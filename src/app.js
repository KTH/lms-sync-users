require("dotenv").config();
require("@kth/reqvars").check();
require("skog").init.pino(
  {
    app: "lms-sync-users",
  },
  {
    timestamp: require("pino").stdTimeFunctions.isoTime,
  }
);

const log = require("skog");
const express = require("express");
const messageConsumer = require("./messageConsumer");
const systemRoutes = require("./server/systemRoutes");

const server = express();
server.use("/api/lms-sync-users", systemRoutes);

messageConsumer.start();
server.listen(4000, () => {
  log.info("Server listening on port 4000");
});
