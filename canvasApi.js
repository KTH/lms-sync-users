const config = require('./server/init/configuration')
const logger = require('kth-node-log')
const CanvasApi = require('kth-canvas-api')
const canvasApi = new CanvasApi(config.full.canvas.apiUrl, config.secure.canvas.apiKey)

canvasApi.logger = logger

module.exports = canvasApi

//
