'use strict'

const handleCourseMessage = require('./handleCourseMessage')
const handleUserMessage = require('./handleUserMessage')
const {type} = require('message-type')

module.exports = function (msg, counter) {
  if (msg._desc.type === type.course) {
    console.info('\nHandling message for course...'.green)
    return handleCourseMessage(msg, counter)
  } else if (msg._desc.type === type.user) {
    console.info('\nHandling message for user...'.green)
    return handleUserMessage(msg)
  } else {
    return Promise.resolve('Message type irrelevant for this app.....')
  }
}
