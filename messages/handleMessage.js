const { handleCourseMessage } = require('./handleCourseMessage')
const handleUserMessage = require('./handleUserMessage')
const { handleStaffMessage } = require('./handleStaffMessage')
const { type } = require('@kth/message-type')
const log = require('../server/logging')

module.exports = function (msg) {
  log.info({ 'metric.handleMessage': 1 })
  if (msg._desc.type === type.course && msg._desc.userType !== type.antagna) {
    log.info('Started handling message to update a course info...')
    return handleCourseMessage(msg)
  } else if (msg._desc.type === type.user) {
    log.info('Started handling the queue message to create/update a user...')
    return handleUserMessage(msg)
  } else if (msg._desc.type === type.staff) {
    log.info('Started handling the queue message to enroll a staff as a student to the course...')
    return handleStaffMessage(msg)
  } else {
    log.info('This message type is irrelevant for this app.....')
    return Promise.resolve(msg)
  }
}
