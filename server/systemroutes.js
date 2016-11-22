/**
 * System controller for functions such as /about and /monitor
 */
const rp = require('request-promise')
const express = require('express')
const router = express.Router()
const config = require('./init/configuration')
const version = require('../config/version')
const packageFile = require('../package.json')

/* GET /_about
 * About page
 */
var _about = function (req, res) {
  res.setHeader('Content-Type', 'text/plain')
  res.send(`
    packageFile.name:${packageFile.name}
    packageFile.version:${packageFile.version}
    packageFile.description:${packageFile.description}
    version.gitBranch:${version.gitBranch}
    version.gitCommit:${version.gitCommit}
    version.jenkinsBuild:${version.jenkinsBuild}
    version.jenkinsBuildDate:${version.jenkinsBuildDate}`)
}

/* GET /_monitor
 * Monitor page
 */
var _monitor = function (req, res) {
  res.setHeader('Content-Type', 'text/plain')
  res.send(`APPLICATION_STATUS: OK`)
}

router.get('/_monitor', _monitor)
router.get('/_monitor_all', _monitor)

router.get('/_monitor_core', _monitor)
router.get('/_about', _about)

router.get('/', function (req, res) {
  res.redirect(`${config.full.proxyPrefixPath.uri}/_monitor`)
})

module.exports = router
