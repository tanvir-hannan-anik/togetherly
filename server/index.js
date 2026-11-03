import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { MongoClient, ObjectId } from "mongodb";
import { createHash, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "dotenv/config";

const eventTypes = ["Cleanup", "Plantation", "Donation", "Other"];
const sessionLength = 7 * 24 * 60 * 60 * 1000;
const cookieName = "togetherly_session";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function publicUser(user) {
  return { _id: user._id.toString(), name: user.name, email: user.email };
}

function validId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

function validEmail(email) {
  return typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Only these fields can be saved. A client cannot change the organizer or participants.
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
  if (event.title.length < 5 || event.title.length > 150) return "Use a title between 5 and 150 characters.";
  if (!eventTypes.includes(event.type)) return "Choose a valid event type.";
  if (event.location.length < 3 || event.location.length > 200) return "Use a location between 3 and 200 characters.";
  if (event.description.length < 20 || event.description.length > 5000) return "Use a description between 20 and 5,000 characters.";
  if (!Number.isFinite(event.date.getTime()) || event.date <= new Date()) return "Choose a future date and time.";
  if (!Number.isFinite(event.duration) || event.duration < 0.5 || event.duration > 24) return "Duration must be between 0.5 and 24 hours.";
  try {
    const url = new URL(event.thumbnail);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || event.thumbnail.length > 2000) throw new Error();
  } catch {
    return "Enter a valid http or https image URL.";
  }
  return null;
}

// This function also lets the integration tests use a separate, temporary database.
export async function createApp(db) {
  const app = express();
  const events = db.collection("events");
  const users = db.collection("users");
  const sessions = db.collection("sessions");
  const subscribers = db.collection("subscribers");
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.COOKIE_CROSS_SITE === "true" ? "none" : "lax",
    path: "/",
  };

  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    sessions.createIndex({ tokenHash: 1 }, { unique: true }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    subscribers.createIndex({ email: 1 }, { unique: true }),
    events.createIndex({ date: 1, type: 1 }),
    events.createIndex({ organizerId: 1 }),
    events.createIndex({ participants: 1 }),
  ]);

  app.disable("x-powered-by");
  app.use(cors({ origin: clientUrl, credentials: true }));
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    // Cookie authentication needs an origin check to prevent cross-site form submissions.
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("origin") !== clientUrl) {
      return res.status(403).send({ message: "This request must come from the configured website." });
    }
    next();
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again in 15 minutes." },
  });
  const subscribeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, limit: 10,
    message: { message: "Please try subscribing again later." },
  });

  async function getUser(req) {
    const token = req.cookies[cookieName];
    if (typeof token !== "string" || token.length !== 64) return null;
    const session = await sessions.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
    return session ? users.findOne({ _id: new ObjectId(session.userId) }) : null;
  }

  async function requireUser(req, res, next) {
    req.user = await getUser(req);
    if (!req.user) return res.status(401).send({ message: "Please log in to continue." });
    next();
  }

  async function startSession(req, res, user) {
    const previous = req.cookies[cookieName];
    if (typeof previous === "string") await sessions.deleteOne({ tokenHash: hashToken(previous) });
    const token = randomBytes(32).toString("hex");
    await sessions.insertOne({ tokenHash: hashToken(token), userId: user._id.toString(), expiresAt: new Date(Date.now() + sessionLength) });
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionLength });
  }

  function publicEvent(event, userId) {
    const participants = event.participants || [];
    const { participants: omitted, ...details } = event;
    return { ...details, participantCount: participants.length, joined: participants.includes(userId) };
  }

  app.get("/", (req, res) => res.send({ message: "Server is running well" }));
  app.get("/event-types", (req, res) => res.send(eventTypes));

  app.post("/auth/signup", authLimiter, async (req, res) => {
    const name = text(req.body.name);
    const email = text(req.body.email).toLowerCase();
    const password = req.body.password;
    if (name.length < 2 || name.length > 80) return res.status(400).send({ message: "Your name must have 2 to 80 characters." });
    if (!validEmail(email)) return res.status(400).send({ message: "Enter a valid email address." });
    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password) > 72) {
      return res.status(400).send({ message: "Use a password with at least 8 characters and at most 72 bytes." });
    }
    const user = { name, email, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date() };
    const result = await users.insertOne(user);
    user._id = result.insertedId;
    await startSession(req, res, user);
    res.status(201).send(publicUser(user));
  });

  app.post("/auth/login", authLimiter, async (req, res) => {
    const email = text(req.body.email).toLowerCase();
    const password = req.body.password;
    if (!validEmail(email) || typeof password !== "string" || Buffer.byteLength(password) > 72) {
      return res.status(400).send({ message: "Enter a valid email and password." });
    }
    const user = await users.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).send({ message: "Email or password is incorrect." });
    await startSession(req, res, user);
    res.send(publicUser(user));
  });

  app.get("/auth/me", async (req, res) => {
    const user = await getUser(req);
    res.send({ user: user ? publicUser(user) : null });
  });

  app.post("/auth/logout", async (req, res) => {
    const token = req.cookies[cookieName];
    if (typeof token === "string") await sessions.deleteOne({ tokenHash: hashToken(token) });
    res.clearCookie(cookieName, cookieOptions);
    res.send({ message: "You have been logged out." });
  });

  app.get("/events", async (req, res) => {
    const search = text(req.query.search).slice(0, 150);
    const type = text(req.query.type);
    const page = Math.max(1, Math.min(10000, parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(24, parseInt(req.query.limit, 10) || 9));
    const filter = { date: { $gt: new Date() } };
    if (type) filter.type = type;
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ title: { $regex: safeSearch, $options: "i" } }, { location: { $regex: safeSearch, $options: "i" } }];
    }
    const sort = req.query.sort === "newest" ? { createdAt: -1, _id: -1 } : { date: 1, _id: 1 };
    const [items, total] = await Promise.all([
      events.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).toArray(),
      events.countDocuments(filter),
    ]);
    res.send({ events: items.map((event) => publicEvent(event)), total, page, pages: Math.ceil(total / limit) });
  });

  app.get("/my-events", requireUser, async (req, res) => {
    const items = await events.find({ organizerId: req.user._id.toString() }).sort({ date: -1 }).toArray();
    res.send(items.map((event) => publicEvent(event, req.user._id.toString())));
  });

  app.get("/joined-events", requireUser, async (req, res) => {
    const items = await events.find({ participants: req.user._id.toString() }).sort({ date: 1 }).toArray();
    res.send(items.map((event) => publicEvent(event, req.user._id.toString())));
  });

  // Validate IDs before passing them to MongoDB, so malformed links return 400 instead of 500.
  app.param("id", (req, res, next, id) => {
    if (!validId(id)) return res.status(400).send({ message: "This event link is invalid." });
    next();
  });

  app.get("/events/:id", async (req, res) => {
    const event = await events.findOne({ _id: new ObjectId(req.params.id) });
    if (!event) return res.status(404).send({ message: "This event could not be found." });
    const user = await getUser(req);
    res.send(publicEvent(event, user?._id.toString()));
  });

  app.post("/events", requireUser, async (req, res) => {
    const event = readEvent(req.body);
    const error = validateEvent(event);
    if (error) return res.status(400).send({ message: error });
    const result = await events.insertOne({
      ...event, organizerId: req.user._id.toString(), organizerName: req.user.name,
      participants: [], createdAt: new Date(),
    });
    res.status(201).send({ _id: result.insertedId, message: "Your event has been published." });
  });

  app.patch("/events/:id", requireUser, async (req, res) => {
    const event = readEvent(req.body);
    const error = validateEvent(event);
    if (error) return res.status(400).send({ message: error });
    const result = await events.updateOne(
      { _id: new ObjectId(req.params.id), organizerId: req.user._id.toString(), date: { $gt: new Date() } },
      { $set: { ...event, updatedAt: new Date() } },
    );
    if (!result.matchedCount) return res.status(403).send({ message: "Only the organizer can edit an upcoming event." });
    res.send({ message: "Your changes have been saved." });
  });

  app.delete("/events/:id", requireUser, async (req, res) => {
    const result = await events.deleteOne({ _id: new ObjectId(req.params.id), organizerId: req.user._id.toString() });
    if (!result.deletedCount) return res.status(403).send({ message: "Only the organizer can delete this event." });
    // Participation is stored on the event, so deletion cannot leave orphaned joins.
    res.send({ message: "Your event has been deleted." });
  });

  app.post("/events/:id/join", requireUser, async (req, res) => {
    const userId = req.user._id.toString();
    const result = await events.updateOne(
      { _id: new ObjectId(req.params.id), date: { $gt: new Date() }, organizerId: { $ne: userId } },
      { $addToSet: { participants: userId } },
    );
    if (!result.matchedCount) return res.status(409).send({ message: "This event is no longer available to join, or you are its organizer." });
    res.send({ message: "You're on the list. See you there!" });
  });

  app.delete("/events/:id/join", requireUser, async (req, res) => {
    const result = await events.updateOne(
      { _id: new ObjectId(req.params.id), date: { $gt: new Date() } },
      { $pull: { participants: req.user._id.toString() } },
    );
    if (!result.matchedCount) return res.status(409).send({ message: "This event has already started or is no longer available." });
    res.send({ message: "You have left this event." });
  });

  app.get("/stats", async (req, res) => {
    const [eventCount, volunteers, locations, completed, categories] = await Promise.all([
      events.countDocuments(),
      events.distinct("participants"),
      events.distinct("location"),
      events.countDocuments({ date: { $lte: new Date() } }),
      events.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
    ]);
    res.send({ events: eventCount, volunteers: volunteers.length, neighborhoods: locations.length, completed, categories });
  });

  app.post("/newsletter", subscribeLimiter, async (req, res) => {
    const email = text(req.body.email).toLowerCase();
    if (!validEmail(email)) return res.status(400).send({ message: "Enter a valid email address." });
    await subscribers.updateOne({ email }, { $setOnInsert: { email, createdAt: new Date() } }, { upsert: true });
    res.send({ message: "You're on the community mailing list. Thank you!" });
  });

  app.use((req, res) => res.status(404).send({ message: "API route not found." }));
  app.use((error, req, res, next) => {
    if (error.code === 11000) return res.status(409).send({ message: "This email is already registered. Please log in." });
    if (error.type === "entity.parse.failed") return res.status(400).send({ message: "The request contains invalid JSON." });
    if (error.type === "entity.too.large") return res.status(413).send({ message: "This request is too large." });
    console.error("Request failed:", error.name);
    res.status(500).send({ message: "Something went wrong. Please try again." });
  });
  return app;
}

export async function connectToMongoDB() {
  if (!process.env.MONGODB_URL) throw new Error("Add MONGODB_URL to server/.env before starting the server.");
  const client = new MongoClient(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  console.log("You successfully connected to MongoDB!");
  return client;
}

// Importing this file in tests does not start a second server.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let client;
  try {
    client = await connectToMongoDB();
    const db = client.db(process.env.MONGODB_DB || "togrtherly");
    const app = await createApp(db);
    const port = Number(process.env.PORT) || 8000;
    const server = app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
    const shutdown = () => server.close(() => client.close().then(() => process.exit(0)));
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    // Never log a connection string or raw driver error containing credentials.
    console.error(error.name === "Error" ? error.message : "Could not connect to MongoDB. Check your server environment and database access.");
    await client?.close();
    process.exitCode = 1;
  }
}
