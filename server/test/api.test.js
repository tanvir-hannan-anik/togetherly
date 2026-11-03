import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo;
let client;
let db;
let server;
let baseUrl;
const origin = "http://localhost:3000";

before(async () => {
  process.env.CLIENT_URL = origin;
  process.env.NODE_ENV = "test";
  process.env.COOKIE_CROSS_SITE = "false";
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URL = mongo.getUri();
  process.env.MONGODB_DB = "togetherly_integration_test";
  const serverModule = await import("../index.js");
  client = serverModule.mongoClient;
  db = client.db(process.env.MONGODB_DB);
  const app = serverModule.default;
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await client?.close();
  await mongo?.stop();
});

async function request(
  path,
  { method = "GET", body, cookie, requestOrigin = origin } = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Origin: requestOrigin,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
    headers: response.headers,
  };
}

test("accounts, event ownership, participation, queries, and persistence", async (t) => {
  let ownerCookie;
  let memberCookie;
  let ownerId;
  let eventId;
  const event = {
    title: "Test community cleanup",
    type: "Cleanup",
    location: "Test community garden",
    thumbnail: "https://example.com/test-event.jpg",
    date: new Date(Date.now() + 86400000).toISOString(),
    duration: 2,
    description:
      "An integration-test event in a temporary database, never application content.",
  };

  await t.test(
    "an empty database returns real zero counts and no example events",
    async () => {
      const list = await request("/events");
      assert.equal(list.status, 200);
      assert.deepEqual(list.data.events, []);
      assert.equal((await request("/stats")).data.events, 0);
      assert.equal((await request("/events/invalid-id")).status, 400);
      assert.equal(
        (await request("/events/000000000000000000000001")).status,
        404,
      );
    },
  );

  await t.test(
    "signup validates credentials, hashes passwords, and sets an HttpOnly session",
    async () => {
      assert.equal(
        (
          await request("/auth/signup", {
            method: "POST",
            body: { name: "A", email: "invalid", password: "short" },
          })
        ).status,
        400,
      );
      const result = await request("/auth/signup", {
        method: "POST",
        body: {
          name: "Test Organizer",
          email: "owner@example.com",
          password: "Testing123!",
        },
      });
      assert.equal(result.status, 201);
      ownerCookie = result.cookie;
      ownerId = result.data._id;
      assert.equal(result.data.passwordHash, undefined);
      assert.match(result.headers.get("set-cookie"), /HttpOnly/i);
      const stored = await db
        .collection("users")
        .findOne({ email: "owner@example.com" });
      assert.notEqual(stored.passwordHash, "Testing123!");
      assert.equal(
        (await request("/auth/me", { cookie: ownerCookie })).data.user._id,
        ownerId,
      );
      assert.equal(
        (
          await request("/auth/signup", {
            method: "POST",
            body: {
              name: "Duplicate",
              email: "OWNER@example.com",
              password: "Testing123!",
            },
          })
        ).status,
        409,
      );
      const member = await request("/auth/signup", {
        method: "POST",
        body: {
          name: "Test Volunteer",
          email: "member@example.com",
          password: "Testing123!",
        },
      });
      assert.equal(member.status, 201);
      memberCookie = member.cookie;
    },
  );

  await t.test(
    "protected routes and cross-site writes are rejected",
    async () => {
      assert.equal(
        (await request("/events", { method: "POST", body: event })).status,
        401,
      );
      assert.equal((await request("/my-events")).status, 401);
      assert.equal(
        (
          await request("/events", {
            method: "POST",
            body: event,
            cookie: ownerCookie,
            requestOrigin: "https://untrusted.example",
          })
        ).status,
        403,
      );
    },
  );

  await t.test(
    "event creation validates fields and ignores forged ownership",
    async () => {
      for (const invalid of [
        { date: "2000-01-01" },
        { date: "not-a-date" },
        { thumbnail: "javascript:alert(1)" },
        { duration: 0 },
        { type: "unknown" },
      ]) {
        assert.equal(
          (
            await request("/events", {
              method: "POST",
              cookie: ownerCookie,
              body: { ...event, ...invalid },
            })
          ).status,
          400,
        );
      }
      const result = await request("/events", {
        method: "POST",
        cookie: ownerCookie,
        body: { ...event, organizerId: "forged", participants: ["forged"] },
      });
      assert.equal(result.status, 201);
      eventId = result.data._id;
      const detail = await request(`/events/${eventId}`);
      assert.equal(detail.data.organizerId, ownerId);
      assert.equal(detail.data.participantCount, 0);
      assert.equal((await request("/stats")).data.volunteers, 0);
      assert.equal(detail.data.participants, undefined);
      assert.equal(
        (await request("/my-events", { cookie: ownerCookie })).data.length,
        1,
      );
    },
  );

  await t.test(
    "search, category filtering, pagination, and regex escaping use MongoDB",
    async () => {
      assert.equal(
        (await request("/events?search=garden&type=Cleanup&limit=1")).data
          .total,
        1,
      );
      assert.equal((await request("/events?type=Donation")).data.total, 0);
      assert.equal((await request("/events?search=%2E%2A")).data.total, 0);
      assert.equal(
        (await request("/events?page=2&limit=1")).data.events.length,
        0,
      );
    },
  );

  await t.test("only the organizer can edit or delete an event", async () => {
    assert.equal(
      (
        await request(`/events/${eventId}`, {
          method: "PATCH",
          cookie: memberCookie,
          body: event,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request(`/events/${eventId}`, {
          method: "DELETE",
          cookie: memberCookie,
        })
      ).status,
      403,
    );
    const result = await request(`/events/${eventId}`, {
      method: "PATCH",
      cookie: ownerCookie,
      body: { ...event, title: "Updated test cleanup" },
    });
    assert.equal(result.status, 200);
    assert.equal(
      (await request(`/events/${eventId}`)).data.title,
      "Updated test cleanup",
    );
  });

  await t.test(
    "joining is atomic, private, idempotent, and excludes the organizer",
    async () => {
      assert.equal(
        (
          await request(`/events/${eventId}/join`, {
            method: "POST",
            cookie: ownerCookie,
          })
        ).status,
        409,
      );
      const joins = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(`/events/${eventId}/join`, {
            method: "POST",
            cookie: memberCookie,
          }),
        ),
      );
      assert.ok(joins.every((result) => result.status === 200));
      const detail = await request(`/events/${eventId}`, {
        cookie: memberCookie,
      });
      assert.equal(detail.data.joined, true);
      assert.equal(detail.data.participantCount, 1);
      assert.equal(detail.data.participants, undefined);
      assert.equal(
        (await request("/joined-events", { cookie: memberCookie })).data.length,
        1,
      );
      assert.equal((await request("/stats")).data.volunteers, 1);
      assert.equal(
        (
          await request(`/events/${eventId}/join`, {
            method: "DELETE",
            cookie: memberCookie,
          })
        ).status,
        200,
      );
      assert.equal(
        (await request("/joined-events", { cookie: memberCookie })).data.length,
        0,
      );
    },
  );

  await t.test(
    "past events disappear from upcoming results and cannot be joined or edited",
    async () => {
      await db
        .collection("events")
        .updateOne(
          { title: "Updated test cleanup" },
          { $set: { date: new Date("2000-01-01") } },
        );
      assert.equal((await request("/events")).data.total, 0);
      assert.equal(
        (
          await request(`/events/${eventId}/join`, {
            method: "POST",
            cookie: memberCookie,
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request(`/events/${eventId}`, {
            method: "PATCH",
            cookie: ownerCookie,
            body: event,
          })
        ).status,
        403,
      );
      assert.equal((await request("/stats")).data.completed, 1);
    },
  );

  await t.test(
    "newsletter subscriptions are validated and deduplicated",
    async () => {
      assert.equal(
        (
          await request("/newsletter", {
            method: "POST",
            body: { email: "bad" },
          })
        ).status,
        400,
      );
      await request("/newsletter", {
        method: "POST",
        body: { email: "updates@example.com" },
      });
      await request("/newsletter", {
        method: "POST",
        body: { email: "UPDATES@example.com" },
      });
      assert.equal(await db.collection("subscribers").countDocuments(), 1);
    },
  );

  await t.test(
    "deleting removes the event and its participation records",
    async () => {
      assert.equal(
        (
          await request(`/events/${eventId}`, {
            method: "DELETE",
            cookie: ownerCookie,
          })
        ).status,
        200,
      );
      assert.equal((await request(`/events/${eventId}`)).status, 404);
      assert.equal((await request("/stats")).data.events, 0);
    },
  );

  await t.test(
    "logout invalidates the session; login restores access",
    async () => {
      assert.equal(
        (await request("/auth/logout", { method: "POST", cookie: ownerCookie }))
          .status,
        200,
      );
      assert.equal(
        (await request("/auth/me", { cookie: ownerCookie })).data.user,
        null,
      );
      assert.equal(
        (
          await request("/auth/login", {
            method: "POST",
            body: { email: "owner@example.com", password: "wrong" },
          })
        ).status,
        401,
      );
      const login = await request("/auth/login", {
        method: "POST",
        body: { email: "owner@example.com", password: "Testing123!" },
      });
      assert.equal(login.status, 200);
      assert.equal(
        (await request("/auth/me", { cookie: login.cookie })).data.user._id,
        ownerId,
      );
      await db
        .collection("sessions")
        .updateMany({}, { $set: { expiresAt: new Date("2000-01-01") } });
      assert.equal(
        (await request("/my-events", { cookie: login.cookie })).status,
        401,
      );
    },
  );
});
