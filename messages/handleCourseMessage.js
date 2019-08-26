'use strict'

const { type } = require('./mesageType')
const canvasApi = require('../canvasApi')
const ugParser = require('./ugParser')
const createCsvFile = require('./createCsvFile')

function parseKey ({ ug1Name, _desc }) {
  const { userType } = _desc

  if ([type.students].includes(userType)) {
    return ugParser.parseKeyStudent(ug1Name)
  }

  if ([type.teachers, type.assistants, type.courseresponsibles].includes(userType)) {
    return ugParser.parseKeyTeacher(ug1Name)
  }

  throw new Error('Key parse error, type, ' + userType + ' ug1Name, ' + ug1Name)
}

async function handleCourseMessage (msg) {
  const sisCourseCode = parseKey(msg)
  const { name } = await createCsvFile(msg, sisCourseCode)
  const canvasReturnValue = await canvasApi.sendCsvFile(name, true)

  return { msg, resp: canvasReturnValue }
}

module.exports = { handleCourseMessage, parseKey }
