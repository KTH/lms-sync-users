/**
 * System controller for functions such as /about and /monitor
 */
const got = require("got");
const express = require("express");
const log = require("skog");
const { getRootAccount } = require("../externalApis/canvasApi");
const packageFile = require("../../package.json");

const router = express.Router();

const version = require("../../config/version");
const { getLatestMessageTimestamp } = require("../messageConsumer");

/* GET /_about
 * About page
 */
function aboutHandler(req, res) {
  res.setHeader("Content-Type", "text/plain");
  res.send(`
    packageFile.name:${packageFile.name}
    packageFile.version:${packageFile.version}
    packageFile.description:${packageFile.description}
    version.gitBranch:${version.gitBranch}
    version.gitCommit:${version.gitCommit}
    version.dockerName:${version.dockerName}
    version.dockerVersion:${version.dockerVersion}`);
}

async function _checkCanvasStatus() {
  try {
    const { body } = await got(
      "http://nlxv32btr6v7.statuspage.io/api/v2/status.json",
      {
        responseType: "json",
      }
    );
    return body.status.indicator === "none";
  } catch (e) {
    log.info("An error occured:", e);
    return false;
  }
}

async function _checkCanvasKey() {
  try {
    await getRootAccount();
    return true;
  } catch (e) {
    log.error("Could not use canvas api.");
    return false;
  }
}

function _checkIdle() {
  const TEN_HOURS = 10 * 3600 * 1000;
  const lastMessage = getLatestMessageTimestamp();
  const idleTime = new Date() - lastMessage;

  return idleTime < TEN_HOURS;
}

async function monitorHandler(req, res) {
  const canvasOk = await _checkCanvasStatus();
  const canvasKeyOk = await _checkCanvasKey();
  const idleTimeOk = _checkIdle();

  res.setHeader("Content-Type", "text/plain");

  const statusStr = [
    `APPLICATION_STATUS: ${idleTimeOk && canvasKeyOk ? "OK" : "ERROR"} ${
      packageFile.name
    }`,
    `READ MESSAGE FROM AZURE: ${
      idleTimeOk
        ? "OK. The server has waited less than 10 hours for a message."
        : "ERROR. The server has not received a message in the last 10 hours"
    }`,
    `CANVAS: ${canvasOk ? "OK" : "Canvas is down"}`,
    `CANVASKEY: ${
      canvasKeyOk ? "OK" : 'Invalid access token (in case if CANVAS is "OK")'
    }`,
  ].join("\n");

  res.send(statusStr);
}

router.get("/_monitor", monitorHandler);
router.get("/_monitor_all", monitorHandler);

router.get("/_monitor_core", monitorHandler);
router.get("/_about", aboutHandler);

router.get("/", (req, res) => {
  res.redirect(`${process.env.PROXY_PREFIX_PATH}/_monitor`);
});

module.exports = router;
