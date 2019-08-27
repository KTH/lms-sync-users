const { writeLine } = require('../csvFile')
const Promise = require('bluebird')
const fs = require('fs')
const readFile = Promise.promisify(fs.readFile)
const log = require('../server/logging')
const { CanvasRole } = require('./messageType')

module.exports = async function createCsvFile (msg, sisCourseCodes, csvDir, csvVol) {
  let userType = msg._desc.userType

  const fileName = `${process.env.CSV_DIR || '/tmp/'}enrollments.${userType}.${sisCourseCodes[0]}.${Date.now()}.csv`
  // Make sure that sisCourseCodes is an array, which makes the rest of this function simpler
  if (!Array.isArray(sisCourseCodes)) {
    sisCourseCodes = [sisCourseCodes]
  }

  // create one line per sisCourseId, per user. One user can be enrolled to multiple courses, for instance if this is re-registered students
  function oneLinePerSisCourseId (userId) {
    const canvasRole = CanvasRole[userType]
    return Promise.each(sisCourseCodes, sisSectionId => writeLine([sisSectionId, userId, canvasRole.role_id, 'active'], fileName))
  }

  await writeLine(['section_id', 'user_id', 'role_id', 'status'], fileName)
  await Promise.map(msg.member, oneLinePerSisCourseId)
  const data = await readFile(fileName, 'utf8')
  log.info('Wrote file', fileName, '\n', data)
  return { name: fileName }
}
