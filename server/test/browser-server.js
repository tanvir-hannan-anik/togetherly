// Browser tests use disposable MongoDB data, never your configured database.
import { MongoMemoryServer } from "mongodb-memory-server";
import { fileURLToPath } from "node:url";

process.env.CLIENT_URL = "http://localhost:3010";
process.env.NODE_ENV = "test";
process.env.COOKIE_CROSS_SITE = "false";
const mongo = await MongoMemoryServer.create({
  binary: {
    downloadDir: fileURLToPath(
      new URL("../node_modules/.cache/mongodb-memory-server", import.meta.url),
    ),
  },
});
process.env.MONGODB_URL = mongo.getUri();
process.env.MONGODB_DB = "togetherly_browser_test";
const { default: app, mongoClient: client } = await import("../index.js");
const server = app.listen(8010, () =>
  console.log("Browser-test API ready on port 8010"),
);

async function stop() {
  server.close();
  await client.close();
  await mongo.stop();
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
