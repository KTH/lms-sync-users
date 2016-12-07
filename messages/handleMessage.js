'use strict'

const handleCourseMessage = require('./handleCourseMessage')
const handleUserMessage = require('./handleUserMessage')
const {type} = require('message-type')
const log = require('../server/init/logging')

module.exports = function (msg) {
  if (msg._desc.type === type.course) {
    log.info('\nStart handling a queue message for course...'.green)
    return handleCourseMessage(msg)
  } else if (msg._desc.type === type.user) {
    log.info('\nStart handling a queue for user...'.green)
    return handleUserMessage(msg)
  } else {
    return Promise.resolve('Message type irrelevant for this app.....')
  }
}
