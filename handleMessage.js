const handleCourseMessage = require('./handleCourseMessage')
const handleUserMessage =  require('./handleUserMessage')
const {type} = require('message-type')

module.exports = function (msg) {

  if (! msg.hasOwnProperty('_desc')) {
    console.warn("\nDescription field is missing....".red,msg)
    return Promise.resolve("\nMessage type is missing, message not processed by handle message....")
  }

  if (msg._desc.type === type.course) {
    console.info("\nHandling message for course...".green)
    return handleCourseMessage(msg)
  }
  else if (msg._desc.type === type.user) {
    console.info("\nHandling message for user...".green)
    return  handleUserMessage(msg)
  }
  else {
    Promise.resolve("Message type irrelevant for this app....." + msg._desc.type)
  }
}
