var test = require('tape')
require('rewire-global').enable()
const sinon = require('sinon')

test.skip('should abort promise chain if no message is read', t => {
  t.plan(1)
  const consumeMessages = require('../../../messages/consumeMessages.js')
  const queue = {readMessageFromQueue: sinon.stub().returns(Promise.resolve())}
  consumeMessages.__set__('queue', queue)

  consumeMessages.__get__('readMessage')()

  t.equal(1, 0)
})
