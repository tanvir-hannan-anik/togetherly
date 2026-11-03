// Browser tests use disposable MongoDB data, never your configured database.
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { createApp } from "../index.js";

process.env.CLIENT_URL = "http://localhost:3001";
process.env.NODE_ENV = "test";
process.env.COOKIE_CROSS_SITE = "false";
const mongo = await MongoMemoryServer.create();
const client = await new MongoClient(mongo.getUri()).connect();
const app = await createApp(client.db("togetherly_browser_test"));
const server = app.listen(8001, () => console.log("Browser-test API ready on port 8001"));

async function stop() {
  server.close();
  await client.close();
  await mongo.stop();
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
