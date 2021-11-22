/**
 * System controller for functions such as /about and /monitor
 */
const got = require("got");
const express = require("express");
const moment = require("moment");
const log = require("skog");
const { getRootAccount } = require("../externalApis/canvasApi");
const packageFile = require("../../package.json");

const router = express.Router();

const [waitAmount, waitUnit] = [10, "hours"];
const history = require("../../messages/history");
const version = require("../../config/version");

/* GET /_about
 * About page
 */
function _about(req, res) {
  res.setHeader("Content-Type", "text/plain");
  res.send(`
    packageFile.name:${packageFile.name}
    packageFile.version:${packageFile.version}
    packageFile.description:${packageFile.description}
    version.gitBranch:${version.gitBranch}
    version.gitCommit:${version.gitCommit}
    version.jenkinsBuild:${version.jenkinsBuild}
    version.dockerName:${version.dockerName}
    version.dockerVersion:${version.dockerVersion}
    version.jenkinsBuildDate:${version.jenkinsBuildDate}`);
}

async function checkCanvasStatus() {
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

async function checkCanvasKey() {
  try {
    await getRootAccount();
    return true;
  } catch (e) {
    log.error("Could not use canvas api.");
    return false;
  }
}

async function _monitor(req, res) {
  const canvasOk = await checkCanvasStatus();
  const canvasKeyOk = await checkCanvasKey();
  res.setHeader("Content-Type", "text/plain");
  const checkTimeAgainst = moment().subtract(waitAmount, waitUnit);
  const idleTimeOk = history.idleTimeStart.isAfter(checkTimeAgainst);

  log.info(
    `checking idle time: last time a message was read was: ${history.idleTimeStart}, compare this to now minus some predifined time: ${checkTimeAgainst}`
  );
  const statusStr = [
    `APPLICATION_STATUS: ${idleTimeOk && canvasKeyOk ? "OK" : "ERROR"} ${
      packageFile.name
    }-${version.jenkinsBuild}`,
    `READ MESSAGE FROM AZURE: ${
      idleTimeOk
        ? `OK. The server has waited less then ${waitAmount} ${waitUnit} for a message.`
        : `ERROR. The server has not received a message in the last ${waitAmount} ${waitUnit}`
    }`,
    `CANVAS: ${canvasOk ? "OK" : "Canvas is down"}`,
    `CANVASKEY: ${
      canvasKeyOk ? "OK" : 'Invalid access token (in case if CANVAS is "OK")'
    }`,
  ].join("\n");
  log.info("monitor page displays:", statusStr);
  res.send(statusStr);
}

router.get("/_monitor", _monitor);
router.get("/_monitor_all", _monitor);

router.get("/_monitor_core", _monitor);
router.get("/_about", _about);

router.get("/", (req, res) => {
  res.redirect(`${process.env.PROXY_PREFIX_PATH}/_monitor`);
});

module.exports = router;
