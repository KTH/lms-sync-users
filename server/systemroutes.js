/**
 * System controller for functions such as /about and /monitor
 */
const canvasApi = require('../canvasApi')
const got = require('got')
const express = require('express')
const router = express.Router()
const packageFile = require('../package.json')
const moment = require('moment')
const [waitAmount, waitUnit] = [10, 'hours']
const history = require('../messages/history')
const log = require('../server/logging')
const version = require('../config/version')
const azure = require('azure-sb')
const { promisify } = require('util')

/* GET /_about
 * About page
 */
var _about = function (req, res) {
  res.setHeader('Content-Type', 'text/plain')
  res.send(`
    packageFile.name:${packageFile.name}
    packageFile.version:${packageFile.version}
    packageFile.description:${packageFile.description}
    version.gitBranch:${version.gitBranch}
    version.gitCommit:${version.gitCommit}
    version.jenkinsBuild:${version.jenkinsBuild}
    version.dockerName:${version.dockerName}
    version.dockerVersion:${version.dockerVersion}
    version.jenkinsBuildDate:${version.jenkinsBuildDate}`)
}

async function checkCanvasStatus () {
  try {
    const { body } = await got('http://nlxv32btr6v7.statuspage.io/api/v2/status.json', {
      json: true
    })
    return body.status.indicator === 'none'
  } catch (e) {
    log.info('An error occured:', e)
    return false
  }
}

async function checkCanvasKey () {
  return canvasApi.getRootAccount()
}

async function deadLetterCount () {
  try {
    const connectionString = process.env.AZURE_SERVICEBUS_CONNECTION_STRING
    const topicName = process.env.AZURE_SERVICEBUS_TOPIC_NAME
    const subscriptionName = process.env.AZURE_SERVICEBUS_SUBSCRIPTION_NAME

    const service = azure.createServiceBusService(connectionString)
    const getSubscription = promisify(service.getSubscription.bind(service))

    const r = await getSubscription(topicName, subscriptionName)

    return r.CountDetails['d3p1:DeadLetterMessageCount']
  } catch (e) {
    log.info('An error occured:', e)
    return false
  }
}

async function checkDeadLetterQueue (dlcount) {
  try {
    return (dlcount === 0)
  } catch (e) {
    log.info('An error occured:', e)
    return false
  }
}

async function _monitor (req, res) {
  const canvasOk = await checkCanvasStatus()
  const canvasKeyOk = await checkCanvasKey()
  const dlCount = await deadLetterCount()
  const dlqOk = await checkDeadLetterQueue(dlCount)
  res.setHeader('Content-Type', 'text/plain')
  const checkTimeAgainst = moment().subtract(waitAmount, waitUnit)
  const idleTimeOk = history.idleTimeStart.isAfter(checkTimeAgainst)

  log.info(`checking idle time: last time a message was read was: ${history.idleTimeStart}, compare this to now minus some predifined time: ${checkTimeAgainst}`)
  const statusStr = [
    `APPLICATION_STATUS: ${idleTimeOk && canvasKeyOk && dlqOk ? 'OK' : 'ERROR'} ${packageFile.name}-${version.jenkinsBuild}`,
    `READ MESSAGE FROM AZURE: ${idleTimeOk ? `OK. The server has waited less then ${waitAmount} ${waitUnit} for a message.` : `ERROR. The server has not received a message in the last ${waitAmount} ${waitUnit}`}`,
    `DLQ: ${dlqOk ? `OK. The dead letter queue is empty.` : `ERROR. There are currently ${dlCount} in the queue.`}`,
    `CANVAS: ${canvasOk ? 'OK' : 'Canvas is down'}`,
    `CANVASKEY: ${canvasKeyOk ? 'OK' : 'Invalid access token (in case if CANVAS is "OK")'}`
  ].join('\n')
  log.info('monitor page displays:', statusStr)
  res.send(statusStr)
}

router.get('/_monitor', _monitor)
router.get('/_monitor_all', _monitor)

router.get('/_monitor_core', _monitor)
router.get('/_about', _about)

router.get('/', function (req, res) {
  res.redirect(`${process.env.PROXY_PREFIX_PATH}/_monitor`)
})

module.exports = router
