const EventEmitter = require("events");
const container = require("rhea");
const log = require("../server/logging");
const history = require("./history");
const { addDescription } = require("./messageType");
const handleMessage = require("./handleMessage");

const eventEmitter = new EventEmitter();

async function start(reconnectClosedConnection = true) {
  log.info(
    `Connecting to the following azure service bus: ${process.env.AZURE_SERVICE_BUS_URL}`
  );
  const connection = container.connect({
    transport: "tls",
    host: process.env.AZURE_SERVICE_BUS_URL,
    hostname: process.env.AZURE_SERVICE_BUS_URL,
    port: 5671,
    username: process.env.AZURE_SHARED_ACCESS_KEY_NAME,
    password: process.env.AZURE_SHARED_ACCESS_KEY,
    container_id: "lms-client",
    reconnect: true,
    reconnect_limit: 100,
  });
  connection.open_receiver({
    name: process.env.AZURE_SUBSCRIPTION_NAME,
    source: {
      address: process.env.AZURE_SUBSCRIPTION_PATH,
    },
  });

  container.on("connection_close", () => {
    log.warn("Connection was closed!");
    if (reconnectClosedConnection) {
      log.info("Attempting to connect to azure once more!");
      start();
    }
  });
}

function initLogger(msg, msgId) {
  let config;
  if (msg) {
    const { body } = msg;
    config = {
      kthid: body && body.kthid,
      ug1Name: body && body.ug1Name,
      ugversion:
        (msg &&
          msg.applicationProperties &&
          msg.applicationProperties.UGVersion) ||
        undefined,
      messageId: msgId || undefined,
    };
  } else {
    config = {};
  }

  log.init(config);

  return msg && msg.body;
}

container.on("connection_error", (context) => {
  log.error(`Connection had an error: ${context.connection.get_error()}`);
});

container.on("disconnected", (context) => {
  if (context.error) {
    log.error(context.error);
  }
  log.warn("Connection was disconnected!");
});

container.on("receiver_close", (context) => {
  log.warn("Receiver was closed!");
  log.warn(context.receiver.remote.detach);
});

container.on("receiver_error", (err) => {
  log.warn("Receiver had an error!", err);
});

container.on("message", async (context) => {
  let jsonData;
  let result;
  try {
    log.debug(
      `logging azure library ids. container id: ${context.container.id}, identifier: ${context.connection.amqp_transport.identifier}`
    );
    log.debug("Consumed 1 credit. ");
    if (context.message.body.typecode === 117) {
      jsonData = {
        body: JSON.parse(Buffer.from(context.message.body.content).toString()),
      };
      initLogger(jsonData, context.message.message_id);
      log.info(
        `New message from ug queue for AMQP container ${context.connection.container_id}`,
        context.message,
        jsonData
      );
      history.setIdleTimeStart();
      if (jsonData.body) {
        try {
          const body = addDescription(jsonData.body);
          const now = Date.now();
          const enqueuedTime =
            context.message.message_annotations["x-opt-enqueued-time"];
          const timeInQueue = now - enqueuedTime;
          log.info({ "metric.timeInQueue": timeInQueue });
          log.info({ "metric.handleMessage": 1 });
          result = await handleMessage(body);
          log.info("result from handleMessage", result);
          context.delivery.accept();
        } catch (e) {
          log.error(e);
          log.info(
            "Error Occured, releasing message back to queue...",
            jsonData
          );
          context.delivery.modified({
            deliveryFailed: true,
            undeliverable_here: false,
          });
        }
      } else {
        log.info(
          "Message is empty or undefined, deleting from queue...",
          jsonData
        );
        context.delivery.accept();
      }
    } else {
      log.error(
        `An unexpected content type was received: ${context.message.body.typecode}`
      );
      context.delivery.modified({
        deliveryFailed: true,
        undeliverable_here: false,
      });
    }
  } catch (err) {
    log.error(`An unhandled exception occured in onMessage: ${err}`);
  }
});

module.exports = {
  start,
  eventEmitter,
};
