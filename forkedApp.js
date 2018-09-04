const consumeMessages = require('./messages/consumeMessages')
const app = require('kth-node-server')
const systemRoutes = require('./server/systemroutes')
const config = require('./config')
const log = require('./server/logging')

consumeMessages.onDetached = function (msg) {
  log.info('On detached: restart process')
  process.send({action: 'restart'})
}

consumeMessages.start()

app.use(config.proxyPrefixPath.uri, systemRoutes)

// also serve the same urls without the /api prefix. TODO: this can be removed once the old, inprem servers has been removed
app.use('/api' + config.proxyPrefixPath.uri, systemRoutes)
app.start({logger: log})
