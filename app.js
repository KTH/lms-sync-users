// The app starting point is actually `forkedApp.js`.

// Sometimes, the app cannot connect to Azure Service Bus but, when the app
// gets a "connection error" message from there, a new listener is created but
// the old one is not deleted. The only "working way" to solve this by now is
// by restarting the whole app (i.e. the "forkedApp")
const { fork } = require('child_process')
const log = require('./server/logging')

function start () {
  let forked = fork('./forkedApp')

  forked.send({ action: 'start' })

  forked.on('message', (msg) => {
    if (msg.action === 'restart') {
      log.info('Kill the process and restart it.')
      forked.kill()
      start()
    }
  })
}

start()
