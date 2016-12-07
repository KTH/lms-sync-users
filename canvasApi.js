const config = require('./server/init/configuration')
const canvasApi = require('canvas-api')(config.full.canvas.apiUrl, config.secure.canvas.apiKey)

module.exports = canvasApi
