const crypto = require('crypto')
const Promise = require('bluebird')
const rewire = require('rewire')
const azureSb = require('azure-sb')
const azureCommon = require('azure-common')

const consumeMessages = rewire('../../messages/consumeMessages')

const serviceBusUrl = 'lms-queue.servicebus.windows.net'
const topicNamePrefix = 'lms-topic-integration-test-'
const subscriptionNamePrefix = 'lms-sub-integration-test-'

function createSBService (queueConnectionString) {
  const sBService = azureSb.createServiceBusService(queueConnectionString)
  sBService.logger = new azureCommon.Logger(azureCommon.Logger.LogLevels.TRACE)

  return {
    deleteTopic: Promise.promisify(sBService.deleteTopic, {
      context: sBService
    }),

    createTopicIfNotExists: Promise.promisify(
      sBService.createTopicIfNotExists,
      { context: sBService }
    ),

    createSubscription: Promise.promisify(sBService.createSubscription, {
      context: sBService
    }),

    sendTopicMessage (topicName, message) {
      if (typeof message === 'object') {
        message = JSON.stringify(message)
      }

      const topicMessage = { body: message }

      return new Promise((resolve, reject) => {
        sBService.sendTopicMessage(topicName, topicMessage, err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }
  }
}

const sBConnectionString = `Endpoint=sb://lms-queue.servicebus.windows.net/;SharedAccessKeyName=${
  process.env.AZURE_SHARED_ACCESS_KEY_NAME
};SharedAccessKey=${process.env.AZURE_SHARED_ACCESS_KEY}`
const sBService = createSBService(sBConnectionString)
let topicName = ''

function sendAndWaitUntilMessageProcessed (message) {
  console.log('Send and read a message', message)
  const resultPromise = new Promise((resolve, reject) => {
    consumeMessages.eventEmitter.once('messageProcessed', (msg, result) => {
      console.log('has processed message. Resolve.')
      resolve(result)
    })
  })

  console.log('sending a message to the topic:', topicName)
  sBService
    .sendTopicMessage(topicName, message)
    .catch(err => console.error(err))

  return resultPromise
}

async function handleMessages (...messages) {
  try {
    console.log('handle messages', messages.length)
    process.env.AZURE_SERVICE_BUS_URL = serviceBusUrl
    topicName = `${topicNamePrefix}${crypto.randomBytes(8).toString('hex')}`
    process.env.AZURE_SUBSCRIPTION_NAME = `${subscriptionNamePrefix}${crypto
      .randomBytes(8)
      .toString('hex')}`
    process.env.AZURE_SUBSCRIPTION_PATH = `${topicName}/Subscriptions`
    await sBService.createTopicIfNotExists(topicName)
    await sBService.createSubscription(
      topicName,
      process.env.AZURE_SUBSCRIPTION_NAME
    )

    await consumeMessages.start(false)

    const result = await Promise.mapSeries(
      messages,
      sendAndWaitUntilMessageProcessed
    )
    consumeMessages.__get__('connection').close()

    return result
  } catch (e) {
    console.error(`An exception occured when running handleMessage: ${e}`)
  } finally {
    sBService.deleteTopic(topicName)
  }
}

module.exports = {
  handleMessages
}
