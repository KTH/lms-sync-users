/**
 * This is a "wide-scope" integration test (or an end-to-end test if you prefer)
 * that tests the whole process from the Azure Service Bus topic to Canvas
 * including the integration among:
 *
 * - The topic and subscription in Azure Service Bus
 * - The "message consumer" module in this app (i.e. `/src/messageConsumer`)
 * - The "message handler" (i.e. `/src/messageHandlers`)
 * - Canvas
 *
 * Since these tests require lots of plumbing, it tests only one thing (to
 * create a user). To test the "logic" of the app, it is better to test only
 * the "message handler" in isolation
 */

const azureSb = require("azure-sb");
const test = require("tape");
const randomstring = require("randomstring");
const { promisify } = require("util");
const messageConsumer = require("../../src/messageConsumer");
const canvasApi = require("../../src/externalApis/canvasApi");

/**
 * Sets up the "plumbing" for tests
 * 1. Creates a topic and subscription in Azure Service Bus
 * 2. Sets up the `messageConsumer` to start listening to the newly created
 *    topic/subscription
 * 3. Sends the `message` (argument of this function) to the topic
 * 4. When the consumer finishes processing the message, closes the connection,
 *    and deletes the topic and subscription
 *
 * This function resolves when the consumer emits an event signaling that
 * has finished processing the message
 */
async function sendAndConsumeMessage(message) {
  const connectionString = `Endpoint=sb://lms-queue.servicebus.windows.net/;SharedAccessKeyName=${process.env.AZURE_SHARED_ACCESS_KEY_NAME};SharedAccessKey=${process.env.AZURE_SHARED_ACCESS_KEY}`;
  const serviceBusService = azureSb.createServiceBusService(connectionString);

  // Helper functions (promisified versions of the `serviceBusService` methods)
  const deleteTopic = promisify(
    serviceBusService.deleteTopic.bind(serviceBusService)
  );
  const createTopic = promisify(
    serviceBusService.createTopicIfNotExists.bind(serviceBusService)
  );
  const createSubscription = promisify(
    serviceBusService.createSubscription.bind(serviceBusService)
  );
  const sendMessage = promisify(
    serviceBusService.sendTopicMessage.bind(serviceBusService)
  );

  const topicName = `lms-topic-test-${randomstring.generate(4)}`;
  const subscriptionName = `lms-sub-test-${randomstring.generate(4)}`;

  await createTopic(topicName);
  await createSubscription(topicName, subscriptionName);

  try {
    process.env.AZURE_SERVICE_BUS_URL = "lms-queue.servicebus.windows.net";
    process.env.AZURE_SUBSCRIPTION_NAME = subscriptionName;
    process.env.AZURE_SUBSCRIPTION_PATH = `${topicName}/Subscriptions`;

    await messageConsumer.start(false);
    await sendMessage(topicName, { body: JSON.stringify(message) });

    await new Promise((resolve) => {
      messageConsumer.eventEmitter.once("message_processed", (result) => {
        resolve(result);
      });
    });
  } finally {
    messageConsumer.stop();
    await deleteTopic(topicName);
  }
}

test.only("messageConsumer should create a new user in canvas", async (t) => {
  t.plan(2);
  const kthid = randomstring.generate(8);
  const ladokId = randomstring.generate(24);
  const username = `${kthid}_abc`;
  const message = {
    kthid,
    ugClass: "user",
    deleted: false,
    affiliation: ["student"],
    username,
    family_name: "Stenberg",
    given_name: "Emil Stenberg",
    primary_email: "esandin@gmail.com",
    ladok3_student_uid: ladokId,
  };

  await sendAndConsumeMessage(message);

  const user = await canvasApi.getUser(kthid);
  t.ok(user, "User should exist in Canvas");
  t.equal(
    user.sis_user_id,
    kthid,
    "Created user in Canvas should have correct SIS ID"
  );
});
