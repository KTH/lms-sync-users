'use strict'
const config = require('./server/init/configuration')
const app = require('kth-node-server')


app.start()
require('./consumeMessages')



const systemRoutes = require('./server/systemroutes')
app.use(config.full.proxyPrefixPath.uri, systemRoutes)


