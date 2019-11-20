'use strict'

const canvasApi = require('../canvasApi')
const log = require('../server/logging')

function isInScope (msg) {
  var affArray = msg.affiliation
  const result =
    affArray &&
    (affArray.includes('employee') ||
      affArray.includes('student') ||
      affArray.includes('member') ||
      affArray.includes('affiliate'))
  if (!result) {
    log.info(
      '\nUser is not an employee and not a student, out of the affilication scope. User ' +
        msg.username +
        ' ' +
        msg.kthid +
        ' with affiliation ' +
        msg.affiliation
    )
  }
  return result
}

function convertToCanvasUser (msg) {
  log.info(
    '\nConverting the user-type message to canvasApi format for: ' +
      msg.username +
      ' ' +
      msg.kthid,
    ' msg affiliation ',
    msg.affiliation
  )

  if (msg.username && (msg.given_name || msg.family_name) && msg.kthid) {
    const user = {
      pseudonym: {
        unique_id: `${msg.username}@kth.se`, // CSVs analogi av 'login_id'
        sis_user_id: msg.kthid, // CSVs analogi av 'user_id' needed for enrollments
        integration_id: msg.ladok3_student_uid || null // For setting integration_id on creation via the /users endpoint
      },
      user: {
        name: `${msg.given_name} ${msg.family_name}`,
        email: msg.primary_email, // must be when 'updating' user
        sortable_name: `${msg.family_name}, ${msg.given_name}`,
        short_name: null // a fix to make sure that display name is updated
      },
      communication_channel: {
        // must be when 'creating' user
        type: 'email',
        address: msg.primary_email,
        skip_confirmation: true
      },
      login: {
        integration_id: msg.ladok3_student_uid || null // For setting integration_id on update via the logins endpoint
      }
    }
    return user
  } else {
    log.info(
      '\nIncomplete fields to create user in canvas, skipping. Probably,it is missing a name(given_name, family_name) or a username or kth_id.....',
      msg
    )
  }
}

async function createOrUpdate (user) {
  try {
    const userFromCanvas = await canvasApi.getUser(user.pseudonym.sis_user_id)
    log.info('found user in canvas', userFromCanvas)
    log.info('update the user with new values: ', user)
    await canvasApi.updateUser(user, userFromCanvas.id)
    const loginsForUser = await canvasApi.get(
      `users/${userFromCanvas.id}/logins`
    )
    const login = loginsForUser.find(login => {
      return login.unique_id === userFromCanvas.login_id
    })
    await canvasApi.requestCanvas(`accounts/1/logins/${login.id}`, 'PUT', user)
  } catch (e) {
    if (e.statusCode === 404) {
      log.info('user doesnt exist in canvas. Create it.', user)
      const res = await canvasApi.createUser(user)
      log.info('Success! User created', res)
      return res
    } else {
      throw e
    }
  }
}

module.exports = async function (msg) {
  const user = convertToCanvasUser(msg)

  if (isInScope(msg) && user) {
    await createOrUpdate(user)
  }

  return msg
}
