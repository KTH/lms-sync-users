require("dotenv").config();
require("@kth/reqvars").check();
const { default: log, initializeLogger, setFields } = require("skog");

initializeLogger();
setFields({ app: "lms-sync-users" });

const express = require("express");
const messageConsumer = require("./messageConsumer");
const systemRoutes = require("./server/systemRoutes");

const server = express();
server.use("/api/lms-sync-users", systemRoutes);

messageConsumer.start();
server.listen(3000, () => {
  log.info("Server listening on port 3000");
});
