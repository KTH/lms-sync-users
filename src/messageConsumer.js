const EventEmitter = require("events");
const container = require("rhea");
const log = require("skog");
const handleAllMessages = require("./messageHandlers/handleAllMessages");

class MessageError extends Error {
  constructor(type, message, err, messageId) {
    super(message);
    this.name = "MessageError";
    this.type = type;
    this.message = message;
    this.err = err;
    this.messageId = messageId;
  }
}

function formatErrorMessage({ name, type, message }) {
  return `(${name}${type ? "/" + type : ""} ${message}`;
}

let latestMessageTime = new Date();

function getLatestMessageTimestamp() {
  return latestMessageTime;
}

/*
 * To make sure rhea is consuming one message at a time, we are manually handling the receiver's credits.
 * Upon opening a receiver, it is handed a number of credits equal to the constant CREDIT_INCREMENT.
 * This credit is consumed once a message is received, and yet another credit given once it has been handled.
 * To be able to handle both a production scenario where we never want the connection to close and a testing scenarion,
 * there is a parameter for reconnecting even when a connection is closed.
 */

const eventEmitter = new EventEmitter();
// The number of credits give to the message receiver at a time i.e. how many messages can be handled in parallell.
// Note that the code logic is primarily adapted to handle one message, so this value should not be altered without code improvements.
const CREDIT_INCREMENT = 1;

// Variable for determining behavior on connection closed.
let reconnectClosedConnection = true;
// Simply saving a reference to the latest connection, for testing purposes.
let connection;

async function start(reconnect = true) {
  reconnectClosedConnection = reconnect;
  log.info(`Starting connection: ${process.env.AZURE_SERVICE_BUS_URL}`);
  connection = container.connect({
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
}

async function stop() {
  log.debug("Closing all existing connections.");

  if (connection) {
    connection.close();
  }
}

/**
 * @param {object} serviceBusMessage
 * @returns {object} An object with the following properties:
 * - type: type of the message. It can be "user", "group", "other" or "empty".
 * - if type is "user", the following properties are available:
 *   - user.id      user ID in Canvas
 *   - user.action  action performed on the user: "create" or "update"
 * - if type is "group", the following properties are available:
 *   - group.name          group name in UG
 *   - group.sisImportId   Canvas SIS Import ID
 */
async function receiveMessage(serviceBusMessage) {
  latestMessageTime = new Date();

  const messageBody = JSON.parse(
    Buffer.from(serviceBusMessage.body.content).toString()
  );
  log.info({ body: messageBody }, "New message");

  if (!messageBody) {
    log.info("Message is empty or undefined, deleting from queue...");
    return {
      type: "empty",
    };
  }

  // TODO: Test if get readable error if `handleAllMessages` throws something
  //       (e.g. Canvas throws an error)
  return handleAllMessages(messageBody)
    .then((result) => {
      log.info("Message was handled", { result });
    })
    .catch((err) => {
      throw new MessageError(
        "handle_message_error",
        "Error handling message",
        `${err.message}, ${err.stack}`
      );
    });
}

container.on("connection_close", () => {
  if (reconnectClosedConnection) {
    log.debug("Connection closed. Restarting");
    start();
  } else {
    log.debug("Connection was closed!");
  }
});

container.on("connection_error", (context) => {
  log.error(`Connection had an error: ${context.connection.get_error()}`);
});

container.on("disconnected", (context) => {
  if (context.error) {
    log.error(context.error);
  }

  log.warn("Connection was disconnected!");
});

container.on("receiver_open", (context) => {
  log.info("Receiver opened successfully. Starting to receive messages");
  log.debug(`Adding ${CREDIT_INCREMENT} credit(s).`);
  context.receiver.add_credit(CREDIT_INCREMENT);
});

container.on("receiver_close", () => {
  log.debug("Receiver was closed!");
});

container.on("receiver_error", () => {
  // Note: We are not printing the `err` object because it is unreadable.
  // log.error(err);

  if (reconnectClosedConnection) {
    log.error("Error in receiver. Connection is going to be restarted");
    stop();
  } else {
    log.error("Error in receiver. Connection is going to be closed");
  }
});

container.on("message", async (context) => {
  log.debug(
    `logging azure library ids. container id: ${context.container.id}, identifier: ${context.connection.amqp_transport.identifier}`
  );

  await log.child({ message_id: context.message.message_id }, async () => {
    try {
      const result = await receiveMessage(context.message);
      eventEmitter.emit("message_processed", result);
      context.delivery.accept();
    } catch (err) {
      // log error here to make sure that the error log uses the same pre configured log child as other logs
      log.error(err.err || err); // Includes message_id
      // log.error(err.err || err, formatErrorMessage(err)); // Doesn't include message_id
      context.delivery.modified({
        deliveryFailed: true,
        undeliverable_here: false,
      });
    }
  });
});

module.exports = {
  start,
  stop,
  getLatestMessageTimestamp,
  eventEmitter,
};
