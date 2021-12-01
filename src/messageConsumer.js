const EventEmitter = require("events");
const container = require("rhea");
const log = require("skog");
const handleMessage = require("./messageHandlers/index");

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
}

async function stop() {
  log.debug("Closing all existing connections.");

  if (connection) {
    connection.close();
  }
}

/**
 *
 * @returns {object} An object with the following properties:
 * - type: type of the message. It can be "user", "group", "other" or "empty".
 * - if type is "user", the following properties are available:
 *   - user.id      user ID in Canvas
 *   - user.action  action performed on the user: "create" or "update"
 * - if type is "group", the following properties are available:
 *   - group.name          group name in UG
 *   - group.sisImportId   Canvas SIS Import ID
 */
async function receiveMessage(message) {
  latestMessageTime = new Date();

  if (!message.body?.typecode) {
    throw new MessageError(
      "missing_typecode",
      "The message is missing a typecode."
    );
  }

  if (message.body?.typecode !== 117) {
    throw new MessageError(
      "wrong_typecode",
      `Field "typecode" in message must be 117. Received ${message.body.typecode} instead`
    );
  }

  const messageBody = JSON.parse(Buffer.from(message.body.content).toString());

  if (!messageBody) {
    log.info("Message is empty or undefined, deleting from queue...");
    return {
      type: "empty",
    };
  }

  const enqueuedTime = message.message_annotations["x-opt-enqueued-time"];

  log.info({
    "metric.timeInQueue": Date.now() - enqueuedTime,
    "metric.handleMessage": 1,
  });

  return handleMessage(messageBody).catch((err) => {
    throw new MessageError(
      "handle_message_error",
      "Error handling message",
      err
    );
  });
}

container.on("connection_open", (context) => {
  log.debug(
    `Connection opened to ${process.env.AZURE_SUBSCRIPTION_NAME} @ ${process.env.AZURE_SUBSCRIPTION_PATH}`
  );

  context.connection.open_receiver({
    name: process.env.AZURE_SUBSCRIPTION_NAME,
    source: {
      address: process.env.AZURE_SUBSCRIPTION_PATH,
      dynamic: false,
      durable: 2, // NOTE: Value taken from rhea official code example for durable subscription reader.
      expiry_policy: "never",
    },
    autoaccept: false,
    credit_window: 0,
  });
});

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
  try {
    log.debug(
      `logging azure library ids. container id: ${context.container.id}, identifier: ${context.connection.amqp_transport.identifier}`
    );
    log.debug("Consumed 1 credit. ");

    const result = await receiveMessage(context.message);
    eventEmitter.emit("message_processed", result);
    context.delivery.accept();
  } catch (err) {
    // If the message is missing typecode, log an error but not mark the message
    // as failed
    if (err.type === "missing_typecode" || err.type === "wrong_typecode") {
      log.error(err, formatErrorMessage(err));

      context.delivery.accept();
      return;
    }

    // Other type of errors: return the message to the queue and log
    if (err.err) {
      log.error(err.err, formatErrorMessage(err));
    } else {
      log.error(err, formatErrorMessage(err));
    }
    context.delivery.modified({
      deliveryFailed: true,
      undeliverable_here: false,
    });
  } finally {
    log.debug(`Adding ${CREDIT_INCREMENT} credit(s).`);
    context.receiver.add_credit(CREDIT_INCREMENT);
  }
});

module.exports = {
  start,
  stop,
  getLatestMessageTimestamp,
  eventEmitter,
};
