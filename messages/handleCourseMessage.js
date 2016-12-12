'use strict'

const {type} = require('message-type')
const canvasApi = require('../canvasApi')
const Promise = require('bluebird')
const cl = require('../azureStorage')
const config = require('../server/init/configuration')
require('colors')

const csvVol = config.secure.azure.csvBlobName
const msgVol = config.secure.azure.msgBlobName
const csvDir = config.secure.localFile.csvDir
const lmsDatabase = config.secure.azure.databaseName
const lmsCollection = config.secure.azure.collectionName

var COUNTER = 0
let selectedCourses = {}
let skippedCourses = {}

function printStat () {
  console.log('In Canvas: ', selectedCourses)
  console.log('Not in Canvas: ', skippedCourses)
}

function _createCsvFile (msg, sisCourseCode, timeStamp) {
  let header = 'course_id,user_id,role,status\n'
  let msgtype = msg._desc.userType
  let csvFileName = 'enrollments.' + msgtype + '.' + sisCourseCode + '.' + timeStamp + '.csv'
  let msgFileName = 'enrollments.' + msgtype + '.' + sisCourseCode + '.' + timeStamp + '.msg'
  let csvString = ''

  if (msg.member && msg.member.length > 0) {
    let csvArray = msg.member.map(user => {
      return {
        course_id: sisCourseCode,
        user_id: user,
        role: msgtype,
        status: 'active'
      }
    })
    csvArray.forEach(csvRow => {
      csvString = csvString + `${csvRow.course_id},${csvRow.user_id},${csvRow.role},${csvRow.status}
`
    })
  }

  let csvData = header + csvString
  console.info('\nGoing to open file: ' + csvFileName + ' ' + msgFileName)
  return cl.cloudStoreTextToFile(csvFileName, csvVol, csvData)
  .then(result => { console.info(result); return cl.cloudStoreTextToFile(msgFileName, msgVol, JSON.stringify(msg, null, 4)) })
  .then(() => cl.cloudgetFile(csvFileName, csvVol, csvDir))
  .then(result => { console.info(result); return {csvContent: csvData, csvFileName: csvDir + result.name} })
  .catch(error => { console.error(error); return Promise.reject(error) })
}

function _parseKeyStudent (key) {
  // ladok2.kurser.DM.2517.registrerade_20162.1
  let course = null
  let termin = null
  let year = null
  let ladok = null
  let myRe = /^(\w+).(\w+).(\w+).(\w+).(\w+)_(\d\d)(\d\d)(\d).(\d+)/g
  let myArray = myRe.exec(key)
  if (myArray != null) {
    let courseInOne = 3
    let courseInTwo = 4
    let terminIn = 8
    let yearIn = 7
    let ladokIn = 9
    course = myArray[courseInOne] + myArray[courseInTwo]
    termin = myArray[terminIn] === 1 ? 'VT' : 'HT'
    year = myArray[yearIn]
    ladok = myArray[ladokIn]
    let sisCourseCode = course + termin + year + ladok
    return sisCourseCode
  }
  return 0
}

function _parseKeyTeacher (key) {
   // edu.courses.AE.AE2302.20162.1.teachers edu.courses.DD.DD1310.20162.1.assistants
  let course = null
  let termin = null
  let year = null
  let ladok = null
  let courseIn = 2
  let terminIn = 5
  let yearIn = 4
  let ladokIn = 6

  let myRe = /^edu.courses.(\w+).(\w+).(\d\d)(\d\d)(\d).(\d).(\w+)$/g
  let myArray = myRe.exec(key)
  if (myArray != null) {
    course = myArray[courseIn]
    termin = myArray[terminIn] === 1 ? 'VT' : 'HT'
    year = myArray[yearIn]
    ladok = myArray[ladokIn]
    let sisCourseCode = course + termin + year + ladok
    return sisCourseCode
  }
  return 0
}

function _parseKey (key, msgtype) {
  let sisCourseCode = 0
  if (msgtype === type.students) {
    sisCourseCode = _parseKeyStudent(key)
  }
  if (msgtype === type.teachers || msgtype === type.assistants) {
    sisCourseCode = _parseKeyTeacher(key)
  }
  if (!sisCourseCode) {
    console.warn('\nCourse code not parsable from Key. type, ' + msgtype + ' key, ' + key)
    return Promise.reject(Error('Key parse error, type, ' + msgtype + ' key, ' + key))
  }
  return Promise.resolve(sisCourseCode)
}

function _process (msg) {
  let sisCourseCode = ''
  let timeStamp = Date.now()

  return _parseKey(msg.ug1Name, msg._desc.userType)
    .then(sisCode => {
      sisCourseCode = sisCode
      console.info(`In _process ${sisCourseCode}, processing for ${msg._desc.userType}`)
      return canvasApi.findCourse(sisCourseCode)
    })
    .then(result => {
      console.log(JSON.stringify(result, null, 4))
      if (!selectedCourses[sisCourseCode]) {
        selectedCourses[sisCourseCode] = 1
      } else {
        selectedCourses[sisCourseCode] += 1
      }
      // Here to drag out list of enrollments from canvas and compare it
      // with the content of the message based on user type
      // This is necessary to understand what the message content really mean,
      // if the message is activate or deactivation enrollments
      // Investigate if there is a chance if the message both contains
      // activation and deactivation, for now pressumed unlikekly
      // return canvasApi.getEnrollmentList(sisCourseCode)})
      return result
    })
    .then(enrollmentsArray => {
      // console.log(enrollmentsArray)
      return _createCsvFile(msg, sisCourseCode, timeStamp)
    })
    .then(csvObject => {
      console.log('FileName: ', csvObject.csvFileName)
      return csvObject.csvFileName
    })
    .then(fileName => canvasApi.sendCsvFile(fileName))
    .then(canvasReturnValue => {
      let documentId = sisCourseCode + '.' + timeStamp
      let document = {id: documentId, msg: msg, resp: canvasReturnValue}
      let collectionUrl = `dbs/${lmsDatabase}/colls/${lmsCollection}`
      return cl.cloudCreateDocument(document, collectionUrl)
    })
    .catch(err => {
      if (err.statusCode === 404) {
        if (!skippedCourses[sisCourseCode]) {
          skippedCourses[sisCourseCode] = 1
        } else {
          skippedCourses[sisCourseCode] += 1
        }
        console.warn('Course does not exist in canvas, skipping, '.red + sisCourseCode.red)
        return Promise.resolve('Course does not exist in canvas')
      } else {
        return Promise.reject(Error(err))
      }
    })
}

module.exports = function (msg, counter) {
  console.info('\nProcessing for msg..... ' + msg.ug1Name)
  var msgtype = msg._desc.userType
  if (msg._desc && (msgtype === type.students || msgtype === type.teachers || msgtype === type.assistants)) {
    COUNTER += 1
    console.log('Counter = ' + COUNTER)
    if (COUNTER % 10 === 0) {
      printStat()
    }
    return _process(msg)
  } else {
    console.warn('\nThis is something else than students, teacher, assistant, we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
    return Promise.resolve('Unknown flag: ' + msgtype)
  }
}
