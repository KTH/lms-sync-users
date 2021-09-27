require("dotenv").config();
require("@kth/reqvars").check();
const app = require("kth-node-server");
const consumeMessages = require("./messages/consumeMessages");
const systemRoutes = require("./server/systemroutes");
const log = require("./server/logging");

consumeMessages.start();
[...Array(1000).keys()].forEach((i) => log.info(`logging line ${i}`));

const prefix = process.env.PROXY_PREFIX_PATH || "/lms-sync-users";

app.use(prefix, systemRoutes);

// also serve the same urls without the /api prefix. TODO: this can be removed once the old, inprem servers has been removed
app.use("/api" + prefix, systemRoutes);
app.start({ logger: log });
