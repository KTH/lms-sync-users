var test = require('tape')
require('rewire-global').enable()
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const consumeMessages = proxyquire('../../../messages/consumeMessages', {'node-queue-adapter': sinon.stub().returns({})})

test('if it is already reading, then it should just return ', t => {
  t.plan(1)
  const readMessage = sinon.stub()
  consumeMessages.__set__('readMessage', readMessage)
  consumeMessages.__set__('isReading', true)

  consumeMessages.__get__('readMessageUnlessReading')()

  t.equal(readMessage.called, false)
})

test('if it is not already reading, then it should call readMessage ', t => {
  t.plan(1)
  const consumeMessages = require('../../../messages/consumeMessages')
  const readMessage = sinon.stub()
  consumeMessages.__set__('readMessage', readMessage)
  consumeMessages.__set__('isReading', false)

  consumeMessages.__get__('readMessageUnlessReading')()
  t.equal(readMessage.called, true)
})
