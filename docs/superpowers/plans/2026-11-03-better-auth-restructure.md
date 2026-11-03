# Togetherly better-auth Migration + Lean Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Togetherly's hand-rolled cookie-session auth with better-auth (email/password + GitHub OAuth, JWT/JWKS), simplify the Express server to the lean wanderlust-server shape, close the assignment's requirement gaps, and rename client files to the wanderlust-client conventions.

**Architecture:** The Next.js app owns authentication through better-auth (MongoDB adapter + `jwt()` plugin) mounted at `/api/auth/*`. Client code fetches a short-lived JWT with `authClient.token()` and sends it as `Authorization: Bearer` to the Express API, which verifies it against the app's `/api/auth/jwks` with `jose`. `src/proxy.ts` (Next 16's renamed middleware) redirects unauthenticated visitors away from private pages.

**Tech Stack:** Next.js 16.4 (App Router, `proxy.ts`), React 19, better-auth + `@better-auth/mongo-adapter`, `sonner` toasts, Express 5, MongoDB driver 7, `jose`.

**Spec:** `docs/superpowers/specs/2026-11-03-better-auth-restructure-design.md`

## Global Constraints

- Client env (`.env.local`): `MONGODB_URI`, `BETTER_AUTH_URL=http://localhost:3000`, `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- Server env (`server/.env`): `MONGODB_URI`, `CLIENT_URL=http://localhost:3000`, `PORT=8000`.
- Both sides use database name `togetherly` (`client.db("togetherly")`).
- GitHub OAuth callback URL: `http://localhost:3000/api/auth/callback/github`.
- Password rule (register only): at least one uppercase letter, one lowercase letter, length ≥ 6. better-auth's default minimum is 8, so `minPasswordLength: 6` must be set.
- Event types: `["Cleanup", "Plantation", "Donation", "Other"]`. Event dates must be in the future (checked in the form and on the server).
- Only an event's organizer may update or delete it (server-enforced).
- No email verification or forgot-password flow.
- Private routes: `/events/create`, `/events/:id/edit`, `/my-events`, `/joined-events`, `/profile`.
- Home page shows 6 upcoming events (server `.limit()`).
- Use the X logo, never the Twitter bird.
- Read `node_modules/next/dist/docs/` before using a Next.js API you are unsure of (AGENTS.md). `proxy.ts` is documented at `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
- **No automated test suite.** The spec removes Playwright, and the reference server has no tests, so `server/test/` is removed too (it only exercised the deleted cookie-auth endpoints). Each task is verified with the exact commands it lists (`npx tsc --noEmit`, `npm run build`, `curl`, and browser checks).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Logged-out visitor on a public page.** `authClient.token()` returns no token, so `api()` must send no `Authorization` header and public routes (`/events`, `/events/:id`, `/stats`) must still return 200. Checked in Task 4, Step 11.
2. **Missing, expired or forged token on a private API route.** It must return 401 `{ message }` and must never cause a 500. Checked in Task 2, Step 6.
3. **Past date sent directly to the API, bypassing the form.** It must return 400 "Choose a future date and time." Checked in Task 10, Step 3.
4. **Non-organizer PATCH or DELETE of someone else's event.** It must return 403. Checked in Task 10, Step 4.
5. **GitHub account with no avatar and no display name.** The navbar avatar must fall back to the email's first letter without crashing. Checked in Task 6, Step 5.

---

## File Map

| Path | Action | Responsibility |
|---|---|---|
| `tests/`, `playwright.config.ts`, `test-results/` | Delete | Removed Playwright scaffolding |
| `server/test/` | Delete | Tests for the removed cookie-auth endpoints |
| `src/components/UpComingEvantCard.tsx` | Delete | Dead file, imported nowhere |
| `src/app/upcoming-event/` | Delete | Duplicate redirect to `/events` |
| `server/index.js` | Rewrite | Lean Express API with JWKS bearer verification |
| `server/package.json`, `server/.env.example` | Modify | Drop bcrypt, cookie-parser and rate-limit; add `jose`; rename to `MONGODB_URI` |
| `src/lib/auth.ts` | Create | better-auth server instance |
| `src/lib/auth-client.ts` | Create | better-auth React client |
| `src/lib/getTokenFromClient.ts` | Create | Fetch the JWT for API calls |
| `src/app/api/auth/[...all]/route.ts` | Create | better-auth route handler |
| `src/proxy.ts` | Create | Redirect logged-out visitors from private pages |
| `src/lib/api.ts` | Modify | Attach the bearer token; stop sending cookies to the API |
| `src/lib/types.ts` | Modify | Drop `EventResults` and `User`; add `organizerEmail` |
| `src/components/auth-form.tsx` | Create (replaces `AuthForm.tsx`) | Login/register on better-auth |
| `src/components/welcome-toast.tsx` | Create | Toast after the GitHub OAuth redirect |
| `src/components/navbar.tsx` | Create (replaces `HomePage/Navbar.tsx`) | Avatar dropdown with private links |
| `src/app/profile/page.tsx`, `src/components/profile-form.tsx` | Create | Profile view and update |
| `src/components/home/gallery.tsx`, `src/components/home/newsletter.tsx` | Create | Home page sections |
| `AuthProvider.tsx`, `RequireAuth.tsx` | Delete | Superseded by better-auth and `proxy.ts` |
| Remaining components | Rename | wanderlust naming (Task 9) |

`getTokenFromServer.ts` from the reference is deliberately **not** created. No server component calls the Express API, so it would be dead code.

---

### Task 1: Remove Playwright scaffolding and dead files

**Files:**
- Delete: `tests/community.spec.ts`, `tests/visual.spec.ts`, `playwright.config.ts`, `test-results/`, `src/components/UpComingEvantCard.tsx`, `src/app/upcoming-event/page.tsx`
- Modify: `package.json`

**Interfaces:** Consumes nothing. Produces nothing later tasks depend on.

- [ ] **Step 1: Confirm the dead files are unreferenced**

Run: `git grep -n -e "UpComingEvantCard" -e "upcoming-event" -- src`
Expected: matches appear only inside `src/app/upcoming-event/page.tsx` itself, or there are no matches at all.

- [ ] **Step 2: Delete the files**

`tests/visual.spec.ts` is untracked and `tests/community.spec.ts` has uncommitted edits. Both are being deleted on purpose (spec §8).

```bash
git rm -q --cached tests/community.spec.ts playwright.config.ts src/components/UpComingEvantCard.tsx src/app/upcoming-event/page.tsx
rm -rf tests playwright.config.ts test-results src/components/UpComingEvantCard.tsx src/app/upcoming-event
```

- [ ] **Step 3: Edit `package.json`**

Remove the `"test:e2e": "playwright test",` line and the `"@playwright/test": "^1.64.1",` line. Then replace the `format` and `test` scripts:

```json
    "format": "prettier --write src server/index.js README.md",
```

Delete the `"test": "npm --prefix server test",` line.

- [ ] **Step 4: Reinstall to update the lockfile**

Run: `npm install`
Expected: exits 0, and `package-lock.json` no longer contains `@playwright/test` (`git grep -c "@playwright/test" package-lock.json` prints nothing).

- [ ] **Step 5: Verify the build still type-checks**

Run: `npx tsc --noEmit`
Expected: exits 0 with no output.

- [ ] **Step 6: Commit**

```bash
git add -A package.json package-lock.json tests playwright.config.ts src/components/UpComingEvantCard.tsx src/app/upcoming-event
git commit -m "$(cat <<'EOF'
Remove Playwright scaffolding and dead files

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Lean Express server with JWKS verification

**Files:**
- Rewrite: `server/index.js`
- Modify: `server/package.json`, `server/.env.example`
- Delete: `server/test/`

**Interfaces:**
- Produces the HTTP API that Tasks 4–8 call. Responses are JSON. Every error has the shape `{ message: string }`.
  - `GET /event-types` → `string[]`
  - `GET /events?search=&type=&sort=soonest|newest&limit=N` → `CommunityEvent[]` (upcoming only; `limit` is 0–50, where 0 means all)
  - `GET /events/:id` → `CommunityEvent` (`joined` is true if the bearer user has joined)
  - `POST /events` 🔒 → `201 { _id, message }`
  - `PATCH /events/:id` 🔒 → `{ message }`; 403 if the caller is not the organizer or the event is past
  - `DELETE /events/:id` 🔒 → `{ message }`; 403 if the caller is not the organizer
  - `POST|DELETE /events/:id/join` 🔒 → `{ message }`; 409 if the event is not joinable
  - `GET /my-events` 🔒, `GET /joined-events` 🔒 → `CommunityEvent[]`
  - `GET /stats` → `{ events, volunteers, neighborhoods, completed, categories }`
  - `POST /newsletter` → `{ message }`
- 🔒 means the route requires `Authorization: Bearer <better-auth JWT>`. Without a valid token it returns 401 `{ message: "Please log in to continue." }`.

- [ ] **Step 1: Replace `server/index.js` entirely**

```js
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = process.env.PORT || 8000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
console.log("You successfully connected to MongoDB!");

const db = client.db("togetherly");
const eventCollection = db.collection("events");
const subscriberCollection = db.collection("subscribers");

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

const JWKS = createRemoteJWKSet(new URL(`${CLIENT_URL}/api/auth/jwks`));
const eventTypes = ["Cleanup", "Plantation", "Donation", "Other"];

async function readUser(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS);
    return { id: payload.sub, name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}

const verifyToken = async (req, res, next) => {
  req.user = await readUser(req);
  if (!req.user)
    return res.status(401).send({ message: "Please log in to continue." });
  next();
};

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readEvent(body) {
  return {
    title: text(body.title),
    type: text(body.type),
    thumbnail: text(body.thumbnail),
    location: text(body.location),
    date: new Date(body.date),
    description: text(body.description),
    duration: Number(body.duration),
  };
}

function validateEvent(event) {
  if (event.title.length < 5 || event.title.length > 150)
    return "Use a title between 5 and 150 characters.";
  if (!eventTypes.includes(event.type)) return "Choose a valid event type.";
  if (event.location.length < 3 || event.location.length > 200)
    return "Use a location between 3 and 200 characters.";
  if (event.description.length < 20 || event.description.length > 5000)
    return "Use a description between 20 and 5,000 characters.";
  if (!Number.isFinite(event.date.getTime()) || event.date <= new Date())
    return "Choose a future date and time.";
  if (!(event.duration >= 0.5 && event.duration <= 24))
    return "Duration must be between 0.5 and 24 hours.";
  if (!/^https?:\/\/\S+$/i.test(event.thumbnail))
    return "Enter a valid http or https image URL.";
  return null;
}

function publicEvent(event, userId) {
  const { participants = [], ...details } = event;
  return {
    ...details,
    participantCount: participants.length,
    joined: participants.includes(userId),
  };
}

app.param("id", (req, res, next, id) => {
  if (!/^[a-f\d]{24}$/i.test(id))
    return res.status(400).send({ message: "This event link is invalid." });
  next();
});

app.get("/", (req, res) => {
  res.send({ message: "Togetherly server is running!" });
});

app.get("/event-types", (req, res) => res.send(eventTypes));

app.get("/events", async (req, res) => {
  const filter = { date: { $gt: new Date() } };
  const type = text(req.query.type);
  const search = text(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (type) filter.type = type;
  if (search)
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  const sort = req.query.sort === "newest" ? { createdAt: -1 } : { date: 1 };
  const limit = Math.max(0, Math.min(Number(req.query.limit) || 0, 50));
  const result = await eventCollection.find(filter).sort(sort).limit(limit).toArray();
  res.send(result.map((event) => publicEvent(event)));
});

app.get("/events/:id", async (req, res) => {
  const event = await eventCollection.findOne({ _id: new ObjectId(req.params.id) });
  if (!event)
    return res.status(404).send({ message: "This event could not be found." });
  const user = await readUser(req);
  res.send(publicEvent(event, user?.id));
});

app.post("/events", verifyToken, async (req, res) => {
  const event = readEvent(req.body);
  const error = validateEvent(event);
  if (error) return res.status(400).send({ message: error });
  const result = await eventCollection.insertOne({
    ...event,
    organizerId: req.user.id,
    organizerName: req.user.name,
    organizerEmail: req.user.email,
    participants: [],
    createdAt: new Date(),
  });
  res.status(201).send({ _id: result.insertedId, message: "Your event has been published." });
});

app.patch("/events/:id", verifyToken, async (req, res) => {
  const event = readEvent(req.body);
  const error = validateEvent(event);
  if (error) return res.status(400).send({ message: error });
  const result = await eventCollection.updateOne(
    { _id: new ObjectId(req.params.id), organizerId: req.user.id, date: { $gt: new Date() } },
    { $set: { ...event, updatedAt: new Date() } },
  );
  if (!result.matchedCount)
    return res.status(403).send({ message: "Only the organizer can edit an upcoming event." });
  res.send({ message: "Your changes have been saved." });
});

app.delete("/events/:id", verifyToken, async (req, res) => {
  const result = await eventCollection.deleteOne({
    _id: new ObjectId(req.params.id),
    organizerId: req.user.id,
  });
  if (!result.deletedCount)
    return res.status(403).send({ message: "Only the organizer can delete this event." });
  res.send({ message: "Your event has been deleted." });
});

app.post("/events/:id/join", verifyToken, async (req, res) => {
  const result = await eventCollection.updateOne(
    { _id: new ObjectId(req.params.id), date: { $gt: new Date() }, organizerId: { $ne: req.user.id } },
    { $addToSet: { participants: req.user.id } },
  );
  if (!result.matchedCount)
    return res.status(409).send({ message: "This event is no longer available to join, or you are its organizer." });
  res.send({ message: "You're on the list. See you there!" });
});

app.delete("/events/:id/join", verifyToken, async (req, res) => {
  const result = await eventCollection.updateOne(
    { _id: new ObjectId(req.params.id), date: { $gt: new Date() } },
    { $pull: { participants: req.user.id } },
  );
  if (!result.matchedCount)
    return res.status(409).send({ message: "This event has already started or is no longer available." });
  res.send({ message: "You have left this event." });
});

app.get("/my-events", verifyToken, async (req, res) => {
  const result = await eventCollection.find({ organizerId: req.user.id }).sort({ date: -1 }).toArray();
  res.send(result.map((event) => publicEvent(event, req.user.id)));
});

app.get("/joined-events", verifyToken, async (req, res) => {
  const result = await eventCollection.find({ participants: req.user.id }).sort({ date: 1 }).toArray();
  res.send(result.map((event) => publicEvent(event, req.user.id)));
});

app.get("/stats", async (req, res) => {
  const [events, volunteers, locations, completed, categories] = await Promise.all([
    eventCollection.countDocuments(),
    eventCollection.distinct("participants"),
    eventCollection.distinct("location"),
    eventCollection.countDocuments({ date: { $lte: new Date() } }),
    eventCollection
      .aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray(),
  ]);
  res.send({
    events,
    volunteers: volunteers.length,
    neighborhoods: locations.length,
    completed,
    categories,
  });
});

app.post("/newsletter", async (req, res) => {
  const email = text(req.body.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).send({ message: "Enter a valid email address." });
  await subscriberCollection.updateOne(
    { email },
    { $setOnInsert: { email, createdAt: new Date() } },
    { upsert: true },
  );
  res.send({ message: "You're on the community mailing list. Thank you!" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send({ message: "Something went wrong. Please try again." });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
  });
}

export default app;
```

- [ ] **Step 2: Update `server/package.json`**

Replace the `scripts`, `dependencies` and `devDependencies` blocks with:

```json
  "scripts": {
    "dev": "node --watch index.js",
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "jose": "^6.2.13",
    "mongodb": "^7.0.0"
  }
```

Then remove the old dependencies and add `jose`:

```bash
rm -rf server/test
npm --prefix server uninstall bcryptjs cookie-parser express-rate-limit mongodb-memory-server
npm --prefix server install jose@^6.2.13
```

Expected: both commands exit 0.

- [ ] **Step 3: Replace `server/.env.example`**

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
CLIENT_URL=http://localhost:3000
PORT=8000
```

- [ ] **Step 4: Rename the env key in your real `server/.env` (manual step for the user)**

The implementer cannot read `.env` files. Ask the user to rename `MONGODB_URL` to `MONGODB_URI` in `server/.env`, and to delete `MONGODB_DB` and `COOKIE_CROSS_SITE`. Wait for confirmation before Step 5.

- [ ] **Step 5: Start the server**

Run: `npm run server` (in the background)
Expected log: `You successfully connected to MongoDB!` then `Server is running at 8000`.

- [ ] **Step 6: Smoke-test public and protected routes**

```bash
curl -s localhost:8000/
curl -s localhost:8000/event-types
curl -s "localhost:8000/events?limit=6"
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8000/events -H "Content-Type: application/json" -d '{}'
curl -s -o /dev/null -w "%{http_code}\n" localhost:8000/my-events -H "Authorization: Bearer not-a-real-token"
curl -s -o /dev/null -w "%{http_code}\n" localhost:8000/events/abc
```

Expected, in order: `{"message":"Togetherly server is running!"}`, `["Cleanup","Plantation","Donation","Other"]`, a JSON array (possibly `[]`), `401`, `401` (forged token, never 500), `400`.

- [ ] **Step 7: Stop the server and commit**

```bash
git add server/index.js server/package.json server/package-lock.json server/.env.example server/test
git commit -m "$(cat <<'EOF'
Simplify server to a lean Express API with JWKS bearer verification

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: better-auth core in the client

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/lib/getTokenFromClient.ts`, `src/app/api/auth/[...all]/route.ts`
- Modify: `package.json`, `.env.example`

**Interfaces:**
- Produces `auth` (server-only better-auth instance, with `auth.api.getSession({ headers })`).
- Produces `authClient` (React client). Later tasks use `authClient.useSession()` → `{ data: { user: { id, name, email, image } } | null, isPending }`, plus `signIn.email`, `signUp.email`, `signIn.social`, `signOut`, `updateUser` and `token`.
- Produces `getTokenFromClient(): Promise<string | undefined>`.

- [ ] **Step 1: Install packages**

Run: `npm install better-auth@^1.7.11 @better-auth/mongo-adapter@^1.7.11 mongodb@^7.7.0`
Expected: exits 0.

- [ ] **Step 2: Create `src/lib/auth.ts`**

```ts
import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";

const client = new MongoClient(process.env.MONGODB_URI as string);
const db = client.db("togetherly");

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [jwt()],
  session: {
    cookieCache: {
      enabled: true,
      strategy: "jwt",
      maxAge: 7 * 24 * 60 * 60,
    },
  },
});
```

- [ ] **Step 3: Create `src/lib/auth-client.ts`**

`baseURL` is omitted on purpose. The auth API is same-origin, and `BETTER_AUTH_URL` is not exposed to the browser.

```ts
import { jwtClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [jwtClient()],
});
```

- [ ] **Step 4: Create `src/lib/getTokenFromClient.ts`**

```ts
import { authClient } from "./auth-client";

export const getTokenFromClient = async () => {
  const { data } = await authClient.token();
  return data?.token;
};
```

- [ ] **Step 5: Create `src/app/api/auth/[...all]/route.ts`**

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

- [ ] **Step 6: Replace `.env.example`**

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<run: npx @better-auth/cli secret>
GITHUB_CLIENT_ID=<from github.com/settings/developers>
GITHUB_CLIENT_SECRET=<from github.com/settings/developers>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 7: Fill in the real `.env.local` (manual step for the user)**

Ask the user to add every key from Step 6 to `.env.local`. They need a GitHub OAuth App whose callback URL is `http://localhost:3000/api/auth/callback/github`. Wait for confirmation.

- [ ] **Step 8: Verify the auth endpoints respond**

Run `npm run dev` in the background, then:

```bash
curl -s localhost:3000/api/auth/get-session
curl -s localhost:3000/api/auth/jwks
```

Expected: `null`, then a JSON object with a non-empty `"keys"` array. The first JWKS call creates the signing key in the `jwks` collection.

- [ ] **Step 9: Type-check and commit**

Run: `npx tsc --noEmit` (expected: exits 0)

```bash
git add package.json package-lock.json .env.example src/lib/auth.ts src/lib/auth-client.ts src/lib/getTokenFromClient.ts "src/app/api/auth/[...all]/route.ts"
git commit -m "$(cat <<'EOF'
Add better-auth with MongoDB adapter, JWT plugin and GitHub provider

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Bearer-token API calls, route protection and session-aware event pages

**Files:**
- Create: `src/proxy.ts`
- Modify: `src/lib/api.ts`, `src/lib/types.ts`, `src/app/layout.tsx`, `src/components/EventBrowser.tsx`, `src/components/HomePage/UpcomingEvents.tsx`, `src/components/EventDetails.tsx`, `src/components/EventEditor.tsx`, `src/components/EventForm.tsx`, `src/app/events/create/page.tsx`, `src/app/events/[id]/edit/page.tsx`, `src/app/my-events/page.tsx`, `src/app/joined-events/page.tsx`

**Interfaces:**
- Consumes `authClient`, `auth` and `getTokenFromClient` from Task 3.
- Produces `api<T>(path, options)`, with the same signature as before. It now sends `Authorization: Bearer <jwt>` when the visitor is logged in.
- Produces `<Toaster />` mounted in the root layout, so any client component can `import { toast } from "sonner"`.

- [ ] **Step 1: Install sonner**

Run: `npm install sonner`
Expected: exits 0.

- [ ] **Step 2: Rewrite the fetch in `src/lib/api.ts`**

Replace lines 1–18 (the `API_URL` line through the closing `});` of `fetch`) with:

```ts
import { getTokenFromClient } from "@/lib/getTokenFromClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getTokenFromClient();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });
```

Leave the rest of the file (`catch`, `errorMessage`, `formatDate`) unchanged.

- [ ] **Step 3: Update `src/lib/types.ts`**

Delete the `EventResults` type. Add `organizerEmail: string;` after `organizerName: string;` in `CommunityEvent`. Keep `User` for now (Task 6 deletes it).

- [ ] **Step 4: Create `src/proxy.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/events/create", "/events/:id/edit", "/my-events", "/joined-events", "/profile"],
};
```

- [ ] **Step 5: Drop `RequireAuth` from the four private pages**

In each of `src/app/events/create/page.tsx`, `src/app/events/[id]/edit/page.tsx`, `src/app/my-events/page.tsx` and `src/app/joined-events/page.tsx`:
- delete the `import RequireAuth from "@/components/RequireAuth";` line;
- replace `<RequireAuth>` and `</RequireAuth>` with nothing, keeping the child (`<EventForm />`, `<EventEditor />`, `<PersonalEvents />` or `<PersonalEvents joined />`).

- [ ] **Step 6: Mount the toaster in `src/app/layout.tsx`**

Add `import { Toaster } from "sonner";` and render `<Toaster richColors position="top-center" />` right after `<Footer />`, inside the provider.

- [ ] **Step 7: Switch event pages to `authClient.useSession()`**

`src/components/EventDetails.tsx`:
- replace `import { useAuth } from "@/components/AuthProvider";` with `import { authClient } from "@/lib/auth-client";`;
- replace `const auth = useAuth();` and the `useApi` call with:

```tsx
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;
  const {
    data: event,
    loading,
    error,
    reload,
  } = useApi<CommunityEvent>(
    isPending ? null : `/events/${id}?viewer=${userId || "guest"}`,
  );
```

- change `const isOwner = auth.user?._id === event.organizerId;` to `const isOwner = !!userId && userId === event.organizerId;`;
- in the sidebar, replace the opening

```tsx
          {auth.error ? (
            <ErrorMessage message={auth.error} retry={auth.refresh} />
          ) : isOwner ? (
```

with `{isOwner ? (`;
- replace `) : auth.user ? (` with `) : userId ? (`.

`src/components/EventEditor.tsx`:
- replace the `useAuth` import with `import { authClient } from "@/lib/auth-client";`;
- replace the two hook lines with:

```tsx
  const { data: session, isPending } = authClient.useSession();
  const { data, error, loading, reload } = useApi<CommunityEvent>(
    isPending ? null : `/events/${id}`,
  );
```

- change `data.organizerId !== user?._id` to `data.organizerId !== session?.user.id`.

- [ ] **Step 8: Make event lists use the array response**

`src/components/HomePage/UpcomingEvents.tsx`:
- import `CommunityEvent` instead of `EventResults`;
- use `useApi<CommunityEvent[]>("/events?limit=6")`;
- replace `data?.events.length` with `data?.length` and `data.events.map` with `data.map`.

`src/components/EventBrowser.tsx`:
- import `CommunityEvent` instead of `EventResults`, and drop `ChevronLeft` and `ChevronRight` from the lucide import;
- delete the `page` state and every `setPage(...)` call;
- remove `page: String(page),` from the `URLSearchParams`;
- use `useApi<CommunityEvent[]>(...)`;
- in the status text, use `data.length` in place of `data.total`;
- replace `data?.events.length ? ( <> ...grid... {pagination nav} </> )` with:

```tsx
      ) : data?.length ? (
        <div className="events-grid">
          {data.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      ) : (
```

- [ ] **Step 9: Show a toast and redirect to Upcoming Events after creating an event (spec requirement)**

In `src/components/EventForm.tsx`, add `import { toast } from "sonner";` and replace `router.push(\`/events/${event?._id || result._id}?saved=1\`);` with:

```tsx
      if (event) {
        toast.success("Your changes have been saved.");
        router.push(`/events/${event._id}`);
      } else {
        toast.success("Your event has been published.");
        router.push("/events");
      }
```

Remove the now-unused `result` binding: change `const result = await api<{ _id?: string }>(` to `await api(`.

- [ ] **Step 10: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both exit 0. The build output lists `ƒ Proxy (Middleware)`.

- [ ] **Step 11: Verify behavior in the running app**

With `npm run server` and `npm run dev` running:
1. Logged out, `curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/my-events` prints `307`, and `curl -sI localhost:3000/my-events | grep -i location` shows `/login?next=%2Fmy-events`.
2. Logged out, open `http://localhost:3000/events` in a browser. The list loads, and DevTools → Network shows **no** `Authorization` header on `localhost:8000/events` (Review Focus 1).
3. Logged out, the home page shows at most 6 cards.

Logged-in flows can't be exercised until Task 5 adds the login UI. Task 10 covers them.

- [ ] **Step 12: Commit**

```bash
git add -A src package.json package-lock.json
git commit -m "$(cat <<'EOF'
Send better-auth JWT to the API and protect private routes with proxy.ts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Login and register on better-auth (email/password + GitHub)

**Files:**
- Create: `src/components/auth-form.tsx`, `src/components/welcome-toast.tsx`
- Delete: `src/components/AuthForm.tsx`
- Modify: `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/layout.tsx`

**Interfaces:**
- Consumes `authClient` (Task 3) and `toast` / `<Toaster />` (Task 4).
- Produces `AuthForm({ signup?: boolean })` (default export) and `passwordProblem(password: string): string`, which returns `""` when the password is valid.

- [ ] **Step 1: Create `src/components/auth-form.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/Feedback";

export function passwordProblem(password: string) {
  if (password.length < 6) return "Password must be at least 6 characters long.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  return "";
}

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/events";
}

export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    setError("");
    const fields = new FormData(submission.currentTarget);
    const email = String(fields.get("email")).trim();
    const password = String(fields.get("password"));

    if (signup) {
      const problem = passwordProblem(password);
      if (problem) return fail(problem);
    }

    setBusy(true);
    const { error } = signup
      ? await authClient.signUp.email({
          name: String(fields.get("name")).trim(),
          email,
          password,
          image: String(fields.get("photoURL")).trim() || undefined,
        })
      : await authClient.signIn.email({ email, password });
    setBusy(false);

    if (error) return fail(error.message || "Something went wrong. Please try again.");
    toast.success(signup ? "Welcome to Togetherly!" : "Welcome back!");
    router.replace(next);
    router.refresh();
  }

  async function signInWithGitHub() {
    setError("");
    const joiner = next.includes("?") ? "&" : "?";
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: `${next}${joiner}welcome=1`,
    });
    if (error) fail(error.message || "GitHub sign-in failed. Please try again.");
  }

  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <HeartHandshake size={44} strokeWidth={1.3} />
        <p className="eyebrow">You belong here</p>
        <h2>
          Good things happen
          <br />
          when we show up
          <br />
          <span>together.</span>
        </h2>
        <p>
          Meet your neighbors, support a cause, and turn a little of your time
          into something that matters.
        </p>
        <span className="auth-story-note">Local action. Lasting impact.</span>
      </aside>
      <section className="auth-panel">
        <p className="eyebrow">The next step starts here</p>
        <h1>{signup ? "Join the community" : "Welcome back"}</h1>
        <p className="muted">
          {signup
            ? "Create an account. Make room for a little good."
            : "Log in and pick up where your impact left off."}
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          {signup && (
            <label>
              Full name
              <input name="name" autoComplete="name" placeholder="Your name" minLength={2} maxLength={80} required />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required />
          </label>
          {signup && (
            <label>
              Photo URL
              <input name="photoURL" type="url" placeholder="https://example.com/your-photo.jpg" maxLength={2000} />
            </label>
          )}
          <label>
            Password
            <div className="password-field">
              <input
                name="password"
                aria-label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "6+ characters, upper & lower case" : "Enter your password"}
                maxLength={128}
                required
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && <ErrorMessage message={error} />}
          <Button type="submit" className="form-submit" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
            <ArrowRight size={17} />
          </Button>
          <Button type="button" variant="outline" className="form-submit" onClick={signInWithGitHub}>
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor">
              <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
            </svg>
            Continue with GitHub
          </Button>
          <p className="auth-switch">
            {signup ? "Already part of the community?" : "New to Togetherly?"}{" "}
            <Link className="text-link" href={`${signup ? "/login" : "/signup"}?next=${encodeURIComponent(next)}`}>
              {signup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/welcome-toast.tsx`**

This component shows the success toast after the GitHub OAuth redirect lands on `?welcome=1`.

```tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function WelcomeToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (params.get("welcome") !== "1") return;
    toast.success("Welcome to Togetherly!");
    const rest = new URLSearchParams(params);
    rest.delete("welcome");
    router.replace(rest.size ? `${pathname}?${rest}` : pathname);
  }, [params, pathname, router]);

  return null;
}
```

- [ ] **Step 3: Mount it in `src/app/layout.tsx`**

Add `import { Suspense } from "react";` and `import WelcomeToast from "@/components/welcome-toast";`. Next to `<Toaster ... />`, render:

```tsx
          <Suspense fallback={null}>
            <WelcomeToast />
          </Suspense>
```

- [ ] **Step 4: Point the pages at the new form, then delete the old one**

In `src/app/login/page.tsx` and `src/app/signup/page.tsx`, change `import AuthForm from "@/components/AuthForm";` to `import AuthForm from "@/components/auth-form";`. Then run:

```bash
git rm -q src/components/AuthForm.tsx
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 6: Verify in the browser** (`npm run server` and `npm run dev` running)

1. `/signup` with password `abcdef` shows the error and a toast "Password must include an uppercase letter." Password `ABCDEF` shows "…lowercase letter." `Abc1` shows "…at least 6 characters long."
2. `/signup` with a valid name, email, photo URL and `Abcdef` shows the toast "Welcome to Togetherly!" and lands on `/events`.
3. Log out (call `authClient.signOut()` from the DevTools console if the navbar isn't updated yet). Then `/login` with a wrong password shows the error toast, and the correct password shows "Welcome back!".
4. Click **Continue with GitHub**, authorize, and land on `/events`. The toast "Welcome to Togetherly!" appears and `?welcome=1` disappears from the URL.
5. Open `/my-events` logged out. You are redirected to `/login?next=%2Fmy-events`, and after logging in you land on `/my-events`.

- [ ] **Step 7: Commit**

```bash
git add -A src
git commit -m "$(cat <<'EOF'
Rebuild login and register on better-auth with GitHub sign-in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Navbar profile dropdown; remove the old auth provider

**Files:**
- Create: `src/components/navbar.tsx`
- Delete: `src/components/HomePage/Navbar.tsx`, `src/components/AuthProvider.tsx`, `src/components/RequireAuth.tsx`
- Modify: `src/app/layout.tsx`, `src/lib/types.ts`, `src/app/globals.css`

**Interfaces:**
- Consumes `authClient` (Task 3).
- Produces `Navbar` (default export, no props).

- [ ] **Step 1: Create `src/components/navbar.tsx`**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Upcoming Events", href: "/events" },
  { label: "Our Impact", href: "/impact" },
];

const profileLinks = [
  { label: "Create Event", href: "/events/create" },
  { label: "Manage Events", href: "/my-events" },
  { label: "Joined Events", href: "/joined-events" },
  { label: "My Profile", href: "/profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const displayName = user?.name || user?.email || "";
  const [isDark, setIsDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const dark = localStorage.getItem("togetherly-theme") === "dark";
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const dark = !isDark;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("togetherly-theme", dark ? "dark" : "light");
    setIsDark(dark);
  }

  async function handleLogout() {
    const { error } = await authClient.signOut();
    if (error) return toast.error(error.message || "Logout failed. Please try again.");
    toast.success("You have been logged out.");
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <nav className="container nav-bar" aria-label="Main navigation">
        <Link href="/" aria-label="Togetherly home">
          <Image
            src="/image/Togetherly Community Leaf Logo-1.png"
            alt="Togetherly"
            width={148}
            height={50}
            preload
            className="brand-logo"
          />
        </Link>
        <div id="main-navigation" className={`nav-links ${open ? "is-open" : ""}`}>
          {navigation.map(({ label, href }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>
          {user ? (
            <>
              <div
                className="profile-menu"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
                }}
              >
                <button
                  className="avatar-button"
                  title={displayName}
                  aria-label={`Account menu for ${displayName}`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                  <span className="avatar-name" aria-hidden="true">
                    {displayName}
                  </span>
                </button>
                {menuOpen && (
                  <div className="profile-dropdown" role="menu">
                    <p className="profile-dropdown-name">{displayName}</p>
                    {profileLinks.map(({ label, href }) => (
                      <Link key={href} href={href} role="menuitem">
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <button className="icon-button" onClick={handleLogout} aria-label="Log out" title="Log out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link href="/login" className="button-link small">
              {isPending ? "Account" : "Login"}
            </Link>
          )}
          <button
            className="mobile-menu icon-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Add the dropdown styles to `src/app/globals.css`**

Append this after the `.user-avatar { … }` rule (which ends around line 394):

```css
.profile-menu {
  position: relative;
}
.avatar-button {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--secondary);
  color: var(--primary);
  font-weight: 700;
}
.avatar-button img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-name {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 30;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--foreground);
  color: var(--background);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
.avatar-button:hover .avatar-name {
  opacity: 1;
}
.profile-menu:has(.profile-dropdown) .avatar-name {
  display: none;
}
.profile-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.12);
}
.profile-dropdown-name {
  padding: 6px 10px 10px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 6px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.profile-dropdown a {
  padding: 9px 10px;
  border-radius: 8px;
  font-size: 13px;
}
.profile-dropdown a:hover {
  background: var(--secondary);
  color: var(--primary);
}
```

- [ ] **Step 3: Swap the layout over and delete the old auth pieces**

In `src/app/layout.tsx`:
- change `import Navbar from "@/components/HomePage/Navbar";` to `import Navbar from "@/components/navbar";`;
- delete `import AuthProvider from "@/components/AuthProvider";`;
- replace `<AuthProvider>` and `</AuthProvider>` with `<>` and `</>`.

In `src/lib/types.ts`, delete the `User` type line.

```bash
git rm -q src/components/HomePage/Navbar.tsx src/components/AuthProvider.tsx src/components/RequireAuth.tsx
```

- [ ] **Step 4: Type-check and confirm no references remain**

Run: `npx tsc --noEmit && git grep -n -e "useAuth" -e "AuthProvider" -e "RequireAuth" -- src`
Expected: tsc exits 0, and the grep prints nothing.

- [ ] **Step 5: Verify in the browser**

1. Logged out: the navbar shows **Login**.
2. Logged in with an email account that has a photo URL: the avatar shows the photo, and hovering it shows the display name.
3. Click the avatar. The dropdown lists Create Event, Manage Events, Joined Events and My Profile, each link navigates, and the menu closes on navigation and when you click outside it.
4. Review Focus 5: register an account with **no** photo URL. The avatar shows the first letter of the name. To check the empty-name fallback, run `await authClient.updateUser({ name: "" })` in DevTools, reload, and confirm the avatar shows the email's first letter with no console error. Restore the name afterwards.
5. The logout button shows the toast "You have been logged out." and returns you to `/` with **Login** visible.
6. At mobile width (375px), the hamburger menu still opens and the avatar dropdown stays on screen.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "$(cat <<'EOF'
Add navbar profile dropdown and remove the custom auth provider

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Profile view and update page (optional requirement)

**Files:**
- Create: `src/app/profile/page.tsx`, `src/components/profile-form.tsx`

**Interfaces:**
- Consumes `authClient.useSession()` and `authClient.updateUser({ name, image })` (Task 3). The `/profile` route is already protected by `proxy.ts` (Task 4).

- [ ] **Step 1: Create `src/components/profile-form.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ErrorMessage, Loading } from "@/components/Feedback";

export default function ProfileForm() {
  const { data: session, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isPending) return <Loading label="Loading your profile…" />;
  if (!session) return <ErrorMessage message="Please log in to view your profile." />;
  const { user } = session;

  async function handleSubmit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    setError("");
    const fields = new FormData(submission.currentTarget);
    const name = String(fields.get("name")).trim();
    const image = String(fields.get("image")).trim();
    if (name.length < 2) return setError("Your name must have at least 2 characters.");
    if (image && !/^https?:\/\/\S+$/i.test(image))
      return setError("Enter a valid http or https image URL.");
    setBusy(true);
    const { error } = await authClient.updateUser({ name, image: image || null });
    setBusy(false);
    if (error) return setError(error.message || "Your profile could not be updated.");
    toast.success("Your profile has been updated.");
  }

  return (
    <div className="form-layout">
      <form className="form-stack form-panel" onSubmit={handleSubmit}>
        <div className="organizer-panel">
          <span className="user-avatar">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              (user.name || user.email).charAt(0).toUpperCase()
            )}
          </span>
          <div>
            <h3>{user.name}</h3>
            <p className="muted">{user.email}</p>
          </div>
        </div>
        <label>
          Display name *
          <input name="name" defaultValue={user.name} minLength={2} maxLength={80} required />
        </label>
        <label>
          Photo URL
          <input name="image" type="url" defaultValue={user.image || ""} maxLength={2000} placeholder="https://example.com/your-photo.jpg" />
        </label>
        {error && <ErrorMessage message={error} />}
        <Button type="submit" className="form-submit" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/profile/page.tsx`**

```tsx
import ProfileForm from "@/components/profile-form";

export const metadata = { title: "My Profile" };

export default function Page() {
  return (
    <main id="main-content" className="container page">
      <div className="page-heading">
        <p className="eyebrow">This is you</p>
        <h1>My profile</h1>
        <p className="muted">Update how your name and photo appear to the community.</p>
      </div>
      <ProfileForm />
    </main>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Verify in the browser**

1. Logged out, `/profile` redirects to `/login?next=%2Fprofile`.
2. Logged in, change the name and photo, then click Save. The toast "Your profile has been updated." appears, and the navbar avatar and hover name update without a reload.
3. A name of 1 character shows the inline error. A photo value of `ftp://x` is rejected.
4. Create an event after renaming. The details page shows the **new** organizer name, which confirms the JWT carries the updated name.

- [ ] **Step 5: Commit**

```bash
git add src/app/profile src/components/profile-form.tsx
git commit -m "$(cat <<'EOF'
Add profile page for updating name and photo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Home gallery and newsletter sections; footer with X logo

**Files:**
- Create: `src/components/home/gallery.tsx`, `src/components/home/newsletter.tsx`, `public/image/gallery/` (user-supplied photos)
- Modify: `src/app/page.tsx`, `src/components/Footer.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes `api()` (Task 4) and `POST /newsletter` (Task 2).
- Produces `Gallery` and `Newsletter` (default exports, no props).

- [ ] **Step 1: Add the gallery photos (manual step for the user)**

Ask the user for six community-service photos saved as `public/image/gallery/gallery-1.jpg` … `gallery-6.jpg` (landscape, about 1200×800). Until they exist, the tiles show `EventImage`'s "image unavailable" fallback, so the page never breaks.

- [ ] **Step 2: Create `src/components/home/gallery.tsx`**

```tsx
import EventImage from "@/components/EventImage";

const photos = [
  { src: "/image/gallery/gallery-1.jpg", caption: "Riverside cleanup" },
  { src: "/image/gallery/gallery-2.jpg", caption: "Tree plantation day" },
  { src: "/image/gallery/gallery-3.jpg", caption: "Winter clothes drive" },
  { src: "/image/gallery/gallery-4.jpg", caption: "Community food bank" },
  { src: "/image/gallery/gallery-5.jpg", caption: "School supplies donation" },
  { src: "/image/gallery/gallery-6.jpg", caption: "Park restoration" },
];

export default function Gallery() {
  return (
    <section className="container section-space" aria-labelledby="gallery-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Moments that matter</p>
          <h2 id="gallery-heading">Community in action</h2>
          <p className="muted">Snapshots from the people who showed up.</p>
        </div>
      </div>
      <ul className="gallery-grid">
        {photos.map(({ src, caption }) => (
          <li key={src}>
            <figure>
              <EventImage src={src} alt={caption} className="gallery-image" />
              <figcaption>{caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/home/newsletter.tsx`**

This moves the subscribe form out of the footer into its own home section.

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Newsletter() {
  const [busy, setBusy] = useState(false);

  async function subscribe(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    const form = submission.currentTarget;
    setBusy(true);
    try {
      const result = await api<{ message: string }>("/newsletter", {
        method: "POST",
        body: JSON.stringify({ email: new FormData(form).get("email") }),
      });
      toast.success(result.message);
      form.reset();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container section-space newsletter-section" aria-labelledby="newsletter-heading">
      <Mail size={36} strokeWidth={1.4} />
      <p className="eyebrow">Stay in the loop</p>
      <h2 id="newsletter-heading">A little good in your inbox</h2>
      <p className="muted">New causes near you, once a month. No spam, ever.</p>
      <form className="newsletter-form" onSubmit={subscribe}>
        <label className="sr-only" htmlFor="newsletter-email">Email address</label>
        <input id="newsletter-email" name="email" type="email" placeholder="you@example.com" maxLength={254} required />
        <Button type="submit" disabled={busy}>{busy ? "Subscribing…" : "Subscribe"}</Button>
      </form>
    </section>
  );
}
```

- [ ] **Step 4: Add both sections to `src/app/page.tsx`**

Add these imports:

```tsx
import Gallery from "@/components/home/gallery";
import Newsletter from "@/components/home/newsletter";
```

Render `<Gallery />` after `<UpcomingEvents />`, and `<Newsletter />` after the closing `</section>` of `community-cta`.

- [ ] **Step 5: Replace the footer's newsletter column with social links (X logo)**

In `src/components/Footer.tsx`:
- remove `"use client";`, the `useState`/`FormEvent` import, the `ArrowRight` import, the `api`/`errorMessage` import, the `Button` import, the three `useState` lines and the `subscribe` function;
- replace the entire third column `<div> <h2>A little good in your inbox</h2> … </div>` with:

```tsx
        <div>
          <h2>Follow the good</h2>
          <p>Stories and new causes from our community.</p>
          <ul className="social-links">
            <li>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Togetherly on X">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </li>
            <li>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Togetherly on Facebook">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
                </svg>
              </a>
            </li>
            <li>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Togetherly on Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
            </li>
          </ul>
          <p>hello@togetherly.org</p>
        </div>
```

- [ ] **Step 6: Add the section styles to `src/app/globals.css`**

Append this at the end of the file:

```css
/* Home: gallery and newsletter */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 0;
  list-style: none;
}
.gallery-grid figure {
  margin: 0;
}
.gallery-image {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: 14px;
}
.gallery-grid figcaption {
  margin-top: 8px;
  color: var(--muted-foreground);
  font-size: 13px;
}
.newsletter-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 24px;
  border-radius: 20px;
  background: var(--secondary);
  text-align: center;
  color: var(--primary);
}
.newsletter-section h2 {
  color: var(--foreground);
}
.newsletter-form {
  display: flex;
  gap: 10px;
  width: min(100%, 460px);
  margin-top: 16px;
}
.newsletter-form input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
  color: var(--foreground);
}
.social-links {
  display: flex;
  gap: 10px;
  margin: 14px 0;
  padding: 0;
  list-style: none;
}
.social-links a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid currentColor;
  border-radius: 50%;
}
@media (max-width: 900px) {
  .gallery-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
  .newsletter-form {
    flex-direction: column;
  }
}
```

Then delete the `.newsletter`, `.newsletter input`, `.newsletter button`, `.site-footer .error-text` and `.site-footer .success-text` rules (around lines 1180–1204), which are now unused.

- [ ] **Step 7: Type-check and verify**

Run: `npx tsc --noEmit` (expected: exits 0). Then in the browser on `/`:
1. The gallery shows six equal-size tiles: 3 columns on desktop, 2 on tablet, 1 on phone.
2. Subscribing with a valid email shows a success toast. An invalid email is blocked by the browser's `type=email` check.
3. The footer shows X, Facebook and Instagram icons. The X icon is the X glyph, not the bird.
4. Toggle dark mode. The newsletter section and gallery captions stay readable.

- [ ] **Step 8: Commit**

```bash
git add -A src public/image/gallery
git commit -m "$(cat <<'EOF'
Add home gallery and newsletter sections; footer social links with X logo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Restructure components to the reference naming

**Files:** renames only, plus import updates.

| From | To |
|---|---|
| `src/components/Footer.tsx` | `src/components/footer.tsx` |
| `src/components/Feedback.tsx` | `src/components/feedback.tsx` |
| `src/components/Impact.tsx` | `src/components/impact.tsx` |
| `src/components/PersonalEvents.tsx` | `src/components/personal-events.tsx` |
| `src/components/HomePage/Header.tsx` | `src/components/home/banner.tsx` |
| `src/components/HomePage/Info.tsx` | `src/components/home/featured.tsx` |
| `src/components/HomePage/UpcomingEvents.tsx` | `src/components/home/upcoming-events.tsx` |
| `src/components/EventCard.tsx` | `src/components/event/event-card.tsx` |
| `src/components/EventBrowser.tsx` | `src/components/event/events-grid.tsx` |
| `src/components/EventDetails.tsx` | `src/components/event/event-details.tsx` |
| `src/components/EventEditor.tsx` | `src/components/event/edit-event.tsx` |
| `src/components/EventForm.tsx` | `src/components/event/event-form.tsx` |
| `src/components/EventImage.tsx` | `src/components/event/event-image.tsx` |
| `src/components/DeleteEventButton.tsx` | `src/components/event/delete-event-dialog.tsx` |
| `src/hooks/useApi.ts` | `src/hooks/use-api.ts` |

**Interfaces:** No exports change. Only the module paths change.

- [ ] **Step 1: Do the renames**

Case-only renames need two hops on Windows' case-insensitive filesystem.

```bash
mkdir -p src/components/home src/components/event
git mv src/components/Footer.tsx src/components/footer.tmp.tsx && git mv src/components/footer.tmp.tsx src/components/footer.tsx
git mv src/components/Feedback.tsx src/components/feedback.tmp.tsx && git mv src/components/feedback.tmp.tsx src/components/feedback.tsx
git mv src/components/Impact.tsx src/components/impact.tmp.tsx && git mv src/components/impact.tmp.tsx src/components/impact.tsx
git mv src/components/PersonalEvents.tsx src/components/personal-events.tsx
git mv src/components/HomePage/Header.tsx src/components/home/banner.tsx
git mv src/components/HomePage/Info.tsx src/components/home/featured.tsx
git mv src/components/HomePage/UpcomingEvents.tsx src/components/home/upcoming-events.tsx
git mv src/components/EventCard.tsx src/components/event/event-card.tsx
git mv src/components/EventBrowser.tsx src/components/event/events-grid.tsx
git mv src/components/EventDetails.tsx src/components/event/event-details.tsx
git mv src/components/EventEditor.tsx src/components/event/edit-event.tsx
git mv src/components/EventForm.tsx src/components/event/event-form.tsx
git mv src/components/EventImage.tsx src/components/event/event-image.tsx
git mv src/components/DeleteEventButton.tsx src/components/event/delete-event-dialog.tsx
git mv src/hooks/useApi.ts src/hooks/use-api.tmp.ts && git mv src/hooks/use-api.tmp.ts src/hooks/use-api.ts
rmdir src/components/HomePage
```

- [ ] **Step 2: Rewrite the import paths**

```bash
git grep -l -e "@/components/" -e "@/hooks/useApi" -- src | xargs sed -i \
  -e 's#@/components/Footer"#@/components/footer"#' \
  -e 's#@/components/Feedback"#@/components/feedback"#' \
  -e 's#@/components/Impact"#@/components/impact"#' \
  -e 's#@/components/PersonalEvents"#@/components/personal-events"#' \
  -e 's#@/components/HomePage/Header"#@/components/home/banner"#' \
  -e 's#@/components/HomePage/Info"#@/components/home/featured"#' \
  -e 's#@/components/HomePage/UpcomingEvents"#@/components/home/upcoming-events"#' \
  -e 's#@/components/EventCard"#@/components/event/event-card"#' \
  -e 's#@/components/EventBrowser"#@/components/event/events-grid"#' \
  -e 's#@/components/EventDetails"#@/components/event/event-details"#' \
  -e 's#@/components/EventEditor"#@/components/event/edit-event"#' \
  -e 's#@/components/EventForm"#@/components/event/event-form"#' \
  -e 's#@/components/EventImage"#@/components/event/event-image"#' \
  -e 's#@/components/DeleteEventButton"#@/components/event/delete-event-dialog"#' \
  -e 's#@/hooks/useApi"#@/hooks/use-api"#'
```

- [ ] **Step 3: Confirm that no old paths remain and that the app builds**

Run: `git grep -n -E "@/components/(HomePage|[A-Z])|@/hooks/useApi" -- src`
Expected: no output. (`@/components/ui/...` is lowercase and does not match.)

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A src
git commit -m "$(cat <<'EOF'
Rename components to the wanderlust folder and file conventions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: End-to-end verification against the assignment brief

**Files:** none, unless a check fails. A fix goes in its own commit.

- [ ] **Step 1: Run fresh**

Run `npm run server` and `npm run dev`. Use two browsers or profiles: **A** (email account) and **B** (GitHub account).

- [ ] **Step 2: Walk through the checklist**

1. **Navbar:** the logo, Upcoming Events, Login button (logged out), and avatar + Logout (logged in) all appear. Hovering the avatar shows the name. The dropdown has Create / Manage / Joined.
2. **Register (A):** the password rules give errors and toasts, a valid sign-up gives a success toast, and the photo appears in the navbar.
3. **Login:** email/password works for A. GitHub works for B, with a welcome toast.
4. **Create event (A):** a past date is blocked in the form. A valid event shows the toast "Your event has been published." and lands on `/events`, where it appears.
5. **Upcoming Events:** only future events are listed. Each card shows the thumbnail, title, location, type, date and a view button.
6. **Details (logged out):** the page is visible and **Log in to join** appears. As B, **Join this event** works and the count goes up.
7. **Joined Events (B):** the event is listed, sorted by date.
8. **Manage Events (A):** the event is listed. Edit saves with a toast. Delete removes it after confirmation.
9. **Home:** shows up to 6 soonest events, the banner, the feature/stats section, the gallery and the newsletter.
10. **Theme toggle:** every page switches fully between light and dark.
11. **Responsive:** check 375px, 768px and 1280px. There is no horizontal scroll, and cards in each grid are the same height.

- [ ] **Step 3: Authenticated past-date API guard (Review Focus 3)**

Logged in as A, open DevTools → Network, open `/my-events`, select the `localhost:8000/my-events` request, and copy the value after `Bearer ` from its `Authorization` request header. That is `<A-token>`. Do the same as B to get `<B-token>`. Then:

```bash
curl -s -X POST localhost:8000/events -H "Authorization: Bearer <A-token>" -H "Content-Type: application/json" \
  -d '{"title":"Past cleanup","type":"Cleanup","thumbnail":"https://example.com/a.jpg","location":"Dhaka","description":"A description that is long enough.","duration":2,"date":"2000-01-01T00:00:00Z"}'
```

Expected: `{"message":"Choose a future date and time."}`.

- [ ] **Step 4: Non-owner write guard (Review Focus 4)**

Using B's token and an event id that belongs to A:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE localhost:8000/events/<A-event-id> -H "Authorization: Bearer <B-token>"
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH localhost:8000/events/<A-event-id> -H "Authorization: Bearer <B-token>" -H "Content-Type: application/json" \
  -d '{"title":"Hijacked title","type":"Cleanup","thumbnail":"https://example.com/a.jpg","location":"Dhaka","description":"A description that is long enough.","duration":2,"date":"2030-01-01T00:00:00Z"}'
```

Expected: `403` and `403`.

- [ ] **Step 5: Final lint and build**

Run: `npm run lint && npm run build`
Expected: both exit 0.

- [ ] **Step 6: Commit any fixes**

If any check failed and was fixed, commit the fix with a message that names the failed check, ending with the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` line.

---

## Notes for the user (surfaced at handoff)

- **Existing data is not migrated.** The old custom-auth accounts can't log in under better-auth. The database name changes from your current `MONGODB_DB` value to `togetherly`, so old events won't appear. Register again after the switch.
- **You supply:** the GitHub OAuth App credentials, the `.env.local` and `server/.env` values (Tasks 2 and 3), and six gallery photos (Task 8).
