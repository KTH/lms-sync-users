var test = require('tape')
const {handleMessages} = require('././utils')
const canvasApi = require('../../canvasApi')
const randomstring = require('randomstring')

async function processMessage (message, course) {
  // First create a fresch course in canvas
  try {
    const accountId = 14 // Courses that starts with an 'A' is handled by account 14
    const canvasCourse = await canvasApi.createCourse({course}, accountId)
    await canvasApi.createDefaultSection(canvasCourse)
    const [{resp}] = await handleMessages(message)
    await canvasApi.pollUntilSisComplete(resp.id)
    const enrolledUsers = await canvasApi.getEnrollments(canvasCourse.id)
    console.log('enrolledUsers:', JSON.stringify(enrolledUsers))
    const [enrolledUser] = enrolledUsers
    return enrolledUser
  } catch (e) {
    console.error('An error occured', e)
  }
}

test('should enroll an assistant in an existing course in canvas', t => {
  t.plan(1)

  const courseCode = 'A' + randomstring.generate(5) // Assistants course code should be 6 chars
  const userKthId = 'u1znmoik'
  const message = {
    ugClass: 'group',
    ug1Name: `edu.courses.SF.${courseCode}.20171.1.assistants`,
    member: [userKthId]}

  const course = {
    name: 'Emil testar',
    'course_code': courseCode,
    'sis_course_id': `${courseCode}VT171`
  }

  processMessage(message, course)
  .then((enrolledUser) => {
    t.equal(enrolledUser.sis_user_id, userKthId)
  })
})

test('should enroll a re-registered student in an existing course in canvas', t => {
  t.plan(2)
  const userKthId = 'u1znmoik'
  const courseCode0 = 'A' + randomstring.generate(1)
  const courseCode1 = randomstring.generate(4)

  const message = {
    ugClass: 'group',
    ug1Name: `ladok2.kurser.${courseCode0}.${courseCode1}.omregistrerade_20171`,
    member: [userKthId]}

  const course = {
    name: 'Emil testar',
    'course_code': courseCode0 + courseCode1,
    'sis_course_id': `${courseCode0 + courseCode1}VT173`
  }

  processMessage(message, course)
  .then(enrolledUser => {
    t.ok(enrolledUser)
    t.equal(enrolledUser.sis_user_id, userKthId)
  })
})

test('should enroll a student in an existing course in canvas', t => {
  t.plan(2)

  const courseCode0 = 'A' + randomstring.generate(1)
  const courseCode1 = randomstring.generate(4)
  const userKthId = 'u1znmoik'

  const message = {
    kthid: 'u2yp4zyn',
    ugClass: 'group',
    ug1Name: `ladok2.kurser.${courseCode0}.${courseCode1}.registrerade_20171.1`,
    member: [userKthId]}

  const course = {
    name: 'Emil testar',
    'course_code': courseCode0 + courseCode1,
    'sis_course_id': `${courseCode0 + courseCode1}VT171`
  }

  processMessage(message, course)
  .then((enrolledUser) => {
    t.ok(enrolledUser)
    t.equal(enrolledUser.sis_user_id, userKthId)
  })
})

test('should enroll a admitted student in an existing course in canvas', t => {
  t.plan(3)
  const userKthId = 'u1znmoik'
  const courseCode0 = 'A' + randomstring.generate(1)
  const courseCode1 = randomstring.generate(4)

  const message = {
    kthid: 'u2vvutyd',
    ugClass: 'group',
    ug1Name: `ladok2.kurser.${courseCode0}.${courseCode1}.antagna_20171.1`,
    member: [userKthId]
  }

  const course = {
    name: 'Emil testar',
    'course_code': courseCode0 + courseCode1,
    'sis_course_id': `${courseCode0 + courseCode1}VT173`
  }

  processMessage(message, course)
  .then(enrolledUser => {
    t.ok(enrolledUser)
    t.ok(enrolledUser.role, 'Admitted/antagen student')
    t.equal(enrolledUser.sis_user_id, userKthId)
  })
})

test('should 𝙣𝙤𝙩 enroll an observer when he is added to the parent group, but return with the message and type:unknown', t => {
  t.plan(1)
  const message = {
    ugClass: 'group',
    ug1Name: 'ladok2.kurser.SF1624.antagna_20171',
    member: ['u1znmoik']
  }

  handleMessages(message)
  .then(([{_desc}]) => {
    t.deepEqual(_desc, { type: 'UNKNOWN' })
  })
})
