const ldap = require('ldapjs')
const config = require('../server/init/configuration')
const fs = require('fs')

const fileName = 'allUsers.csv'
const headers = ['user_id', 'login_id', 'full_name', 'status']
const attributes = ['ugKthid', 'ugUsername', 'mail', 'email_address', 'name', 'ugEmailAddressHR']
function escapeCsvData (str) {
  if (str.includes(',') || str.includes('"')) {
    console.error('oh no! bad data!', str)
  }
  return str
}

function writeLine (strArr, _fileName = fileName) {
  const line = strArr.map(escapeCsvData).join(',') + '\n'
  fs.appendFile(_fileName, line, (err) => {
    if (err) {
      throw err
    }
  })
}

try {
  fs.unlinkSync(fileName)
} catch (e) {
  console.log('couldnt delete file. It probably doesnt exist.')
}

const client = ldap.createClient({
  url: config.secure.ldap.client.url
})

writeLine(headers, fileName)

function appendUsers (type) {
  return new Promise((resolve, reject) => {
    let counter = 0

    const opts = {
      filter: `ugAffiliation=${type}`,
      scope: 'sub',
      paged: true,
      sizeLimit: 1000,
      attributes
    }

    client.search('OU=UG,DC=ug,DC=kth,DC=se', opts, function (err, res) {
      if (err) {
        throw err
      }
      res.on('searchEntry', function (entry) {
        counter++
        // console.log(entry.object)
        // console.log('.')
        const o = entry.object
        const userName = `${o.ugUsername}@kth.se`
        writeLine([o.ugKthid, userName, o.name, 'active'])
      })
      res.on('error', function (err) {
        console.error('error: ' + err.message)
      })
      res.on('end', function (result) {
        console.log('Done with ', type, counter)
        resolve()
      })
    })
  })
}

client.bind(config.secure.ldap.bind.username, config.secure.ldap.bind.password, function (err) {
  if (err) {
    throw err
  }

  Promise.all([
    appendUsers('employee'),
    appendUsers('student')])
    .then(result => client.unbind())
    .then(() => console.log('Done with creating the file', fileName))
})
