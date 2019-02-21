'use strict'

const { type } = require('@kth/message-type')
const canvasApi = require('../canvasApi')
const log = require('../server/logging')
const ugParser = require('./ugParser')
const calcSisForOmregistrerade = require('./calcSisForOmregistrerade')
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
  let sisCourseCodeFunction
  if (msg._desc.userType === type.omregistrerade) {
    log.info('using calcSisForOmregistrerade')
    sisCourseCodeFunction = calcSisForOmregistrerade
  } else {
    log.info('using parseKey')
    sisCourseCodeFunction = parseKey
  }

  const sisCourseCode = sisCourseCodeFunction(msg)
  const { name } = await createCsvFile(msg, sisCourseCode)
  const canvasReturnValue = await canvasApi.sendCsvFile(name, true)

  return { msg, resp: canvasReturnValue }
}

module.exports = { handleCourseMessage, parseKey }
