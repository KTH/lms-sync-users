'use strict'
const config = require('./server/init/configuration')
const app = require('kth-node-server')
const processWatcher = require('./watch')
const cl = require('./azureStorage')
const logVol = config.secure.azure.logBlobName
cl.cloudCreateContainer(config.secure.azure.logBlobName)
.then(() => console.log('Created: ' + config.secure.azure.logBlobName))
processWatcher.cloudWatch(logVol, 'log')

app.start()
const consumeMessages = require('./messages/consumeMessages')
consumeMessages.start()

const systemRoutes = require('./server/systemroutes')
app.use(config.full.proxyPrefixPath.uri, systemRoutes)
