const logger = require('./server/logging')
const CanvasApi = require('kth-canvas-api')

logger.info('using canvas api at:', process.env.CANVAS_API_URL)

const canvasApi = new CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_KEY
)

canvasApi.logger = logger

module.exports = canvasApi
