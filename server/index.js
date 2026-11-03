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
  const result = await eventCollection
    .find(filter)
    .sort(sort)
    .limit(limit)
    .toArray();
  res.send(result.map((event) => publicEvent(event)));
});

app.get("/events/:id", async (req, res) => {
  const event = await eventCollection.findOne({
    _id: new ObjectId(req.params.id),
  });
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
  res.status(201).send({
    _id: result.insertedId,
    message: "Your event has been published.",
  });
});

app.patch("/events/:id", verifyToken, async (req, res) => {
  const event = readEvent(req.body);
  const error = validateEvent(event);
  if (error) return res.status(400).send({ message: error });
  const result = await eventCollection.updateOne(
    {
      _id: new ObjectId(req.params.id),
      organizerId: req.user.id,
      date: { $gt: new Date() },
    },
    { $set: { ...event, updatedAt: new Date() } },
  );
  if (!result.matchedCount)
    return res
      .status(403)
      .send({ message: "Only the organizer can edit an upcoming event." });
  res.send({ message: "Your changes have been saved." });
});

app.delete("/events/:id", verifyToken, async (req, res) => {
  const result = await eventCollection.deleteOne({
    _id: new ObjectId(req.params.id),
    organizerId: req.user.id,
  });
  if (!result.deletedCount)
    return res
      .status(403)
      .send({ message: "Only the organizer can delete this event." });
  res.send({ message: "Your event has been deleted." });
});

app.post("/events/:id/join", verifyToken, async (req, res) => {
  const result = await eventCollection.updateOne(
    {
      _id: new ObjectId(req.params.id),
      date: { $gt: new Date() },
      organizerId: { $ne: req.user.id },
    },
    { $addToSet: { participants: req.user.id } },
  );
  if (!result.matchedCount)
    return res.status(409).send({
      message:
        "This event is no longer available to join, or you are its organizer.",
    });
  res.send({ message: "You're on the list. See you there!" });
});

app.delete("/events/:id/join", verifyToken, async (req, res) => {
  const result = await eventCollection.updateOne(
    { _id: new ObjectId(req.params.id), date: { $gt: new Date() } },
    { $pull: { participants: req.user.id } },
  );
  if (!result.matchedCount)
    return res.status(409).send({
      message: "This event has already started or is no longer available.",
    });
  res.send({ message: "You have left this event." });
});

app.get("/my-events", verifyToken, async (req, res) => {
  const result = await eventCollection
    .find({ organizerId: req.user.id })
    .sort({ date: -1 })
    .toArray();
  res.send(result.map((event) => publicEvent(event, req.user.id)));
});

app.get("/joined-events", verifyToken, async (req, res) => {
  const result = await eventCollection
    .find({ participants: req.user.id })
    .sort({ date: 1 })
    .toArray();
  res.send(result.map((event) => publicEvent(event, req.user.id)));
});

app.get("/stats", async (req, res) => {
  const [events, volunteers, locations, completed, categories] =
    await Promise.all([
      eventCollection.countDocuments(),
      eventCollection.distinct("participants"),
      eventCollection.distinct("location"),
      eventCollection.countDocuments({ date: { $lte: new Date() } }),
      eventCollection
        .aggregate([
          { $group: { _id: "$type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
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

// Express only treats a middleware as an error handler when it declares all four parameters.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
