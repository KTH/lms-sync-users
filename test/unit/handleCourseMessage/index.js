var test = require('tape')
const { type } = require('@kth/message-type')
const proxyquire = require('proxyquire')
require('rewire-global')
const sinon = require('sinon')

test('should NOT parse key:student for antagna', t => {
  const ugParser = { parseKeyStudent: sinon.spy() }
  const handleCourseMessages = proxyquire('../../../messages/handleCourseMessage', { './ugParser': ugParser })
  t.throws(() => handleCourseMessages.parseKey({ ug1Name: 'ladok2.kurser.SF.1626.antagna_20171.1', _desc: { userType: type.antagna } }))
  t.end()
})

test('should send the csv file for user type is student', t => {
  t.plan(1)
  const canvasApi = require('../../../canvasApi')
  const createCsvFile = sinon.stub().returns({ name: 'file.csv' })
  const handleCourseMessages = proxyquire('../../../messages/handleCourseMessage', { './createCsvFile': createCsvFile })
  canvasApi.sendCsvFile = sinon.stub()
  handleCourseMessages.__set__('parseKey', sinon.stub().returns(Promise.resolve()))
  // .returns(Promise.reject({statusCode:404}))
  const message = {
    _desc: {
      userType: type.students
    }
  }

  handleCourseMessages.handleCourseMessage(message)
    .then(() => {
      t.ok(canvasApi.sendCsvFile.calledWith('file.csv', true))
    })
})
