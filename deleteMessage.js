module.exports = function (message, queue) {
  console.log('Started delete at: ', new Date())
  promise = queue.deleteMessageFromQueue(message)
  console.log('Finished delete at: ', new Date())
  return promise
}
