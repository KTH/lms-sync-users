const ldap = require('ldapjs')
const config = require('../server/init/configuration')
const fs = require('fs')

const fileName = 'allUsers.csv'
const headers = ['user_id', 'login_id', 'email', 'full_name', 'status']
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
    if (err) throw err
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

client.bind(config.secure.ldap.bind.username, config.secure.ldap.bind.password, function (err) {
  ['employee', 'student'].forEach(type => {
    let counter = 0

    const opts = {
      filter: `ugAffiliation=${type}`,
      scope: 'sub',
      paged: true,
      sizeLimit: 1000,
      attributes
    }

    client.search('OU=UG,DC=ug,DC=kth,DC=se', opts, function (err, res) {
      res.on('searchEntry', function (entry) {
        counter++
        // console.log(entry.object)
        // console.log('.')
        const o = entry.object
        const userName = `${o.ugUsername}@kth.se`
        writeLine([o.ugKthid, userName, /* o.ugEmailAddressHR || */o.mail || userName, o.name, 'active' ])
      })
      res.on('error', function (err) {
        console.error('error: ' + err.message)
      })
      res.on('end', function (result) {
        console.log('Done with ', type, counter)
      })
    })
  })
})
