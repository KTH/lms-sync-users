const {type} = require('message-type')
const config = require('./server/init/configuration')
const canvasApi = require('canvas-api')(config.safe.canvas.apiUrl, config.secure.canvas.apiKey)
var Promise = require('bluebird')


function isInScope(msg)
{
    var affArray = msg.affiliation
    if ( affArray && ( affArray.indexOf('employee') >= 0 || affArray.indexOf('student') >= 0))
        return true
    return false
}


function createCanvasUser(msg) {
    console.log(msg)
    if (msg.username && (msg.given_name || msg.family_name) &&  msg.username &&  msg.primary_emai &&  msg.kthid)
    {
    let  user = {
        pseudonym: {unique_id: `${msg.username}@kth.se`}, // CSVs analogi av 'login_id'
user: {
    'name': `${msg.given_name} ${msg.family_name}`, // CSVs analogi av 'full_name'
    'username': msg.username, // inte säker
        'email': msg.primary_email,
        'sis-integration-id': msg.kthid // prova om det är rätt analog av CSVs 'user_id'
}}
console.info("Creating canvas User:  " + JSON.stringify(user,null,4))
}
else
return false
}

module.exports = function (msg) {
    console.info('\nProcessing for msg..... ' + msg.ugClass + ' ' + msg.kthid)
    if (isInScope(msg)) {
        let user = createCanvasUser(msg)
        if (user) {
            return canvasApi.updateUser(user, user.pseudonym.unique_id)
                    .catch(e => canvasApi.createUser(user))
            .then(user =>
            console.info(`${user.pseudonym.unique_id} is created in canvas`))
        }
        else {
            console.log("\nIncomplete fields to create user in cavas.....")
            return Promise.resolve("User feels missing...")
        }
    }
    else
    {
    console.info('\nUser not in affiliation scope..... ' + msg.ugClass + ' ' + msg.kthid )
    return Promise.resolve("User not in affiliation scope...")
    }
}
