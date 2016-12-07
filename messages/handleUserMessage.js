'use strict'

const canvasApi = require('../canvasApi')
require('colors')
const log = require('../server/init/logging')

function isInScope (msg) {
  var affArray = msg.affiliation
  return affArray && (affArray.includes('employee') || affArray.includes('student'))
}

function convertToCanvasUser (msg) {
  // UG_USER_ATTRIBUTES=kthid,username,family_name,given_name,affiliation,email_address,primary_email

  if (msg.username && (msg.given_name || msg.family_name) && msg.kthid) {
    let user = {
      pseudonym: {
        unique_id: `${msg.username}@kth.se`, // CSVs analogi av 'login_id'
        sis_user_id: msg.kthid // CSVs analogi av 'user_id' needed for enrollments
      },
      user: {
        'name': `${msg.given_name} ${msg.family_name}`
      }
    }
    return user
  } else {
    return
  }
}

module.exports = function (msg) {
  if (!isInScope(msg)) {
    log.info('\nUser is not an employee and not a student, out of the affilication scope. Skipping user ' + msg.username + ' ' + msg.kthid + ' with affiliation ' + msg.affiliation)
    return Promise.resolve('User not in affiliation scope...')
  }

  log.info('\nConverting the user-type message to canvasApi format for: ' + msg.username + ' ' + msg.kthid, ' msg affiliation ', msg.affiliation)
  let user = convertToCanvasUser(msg)

  if (!user) {
    log.info('\nIncomplete fields to create user in canvas. Probably,it is missing a name(given_name, family_name) or a username or kth_id.....')
    return Promise.resolve('Some of required users fields are missing (a name(given_name, family_name) or a username or kth_id)')
  }

  return canvasApi.getUser(user.pseudonym.sis_user_id)
        .then(userFromCanvas => {
          log.info('found user in canvas', userFromCanvas)
          log.info('update the user with new values: ', user)
          return userFromCanvas
        })
        .then(userFromCanvas => canvasApi.updateUser(user, userFromCanvas.id))
        .catch(e => {
          if (e.statusCode === 404) {
            log.info('user doesnt exist in canvas. Trying to create it.', user)
            return canvasApi.createUser(user)
            .then(res => {
              log.info('Success! User created', res)
              return res
            })
          } else {
            throw e
          }
        })
}
