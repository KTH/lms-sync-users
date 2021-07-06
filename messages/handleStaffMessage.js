const { writeLine } = require("../csvFile");
const canvasApi = require("../canvasApi");
const { promisify } = require("util");
const unlink = promisify(require("fs").unlink);
const logging = require("../server/logging");
const { CanvasRole } = require("./messageType");

const fileName = `${process.env.CSV_DIR || "/tmp/"}staff_enroll.csv`;

async function handleStaffMessage(msg) {
  try {
    await unlink(fileName);
  } catch (e) {
    logging.info("Couldnt delete file. This is fine.");
  }

  await writeLine(["section_id", "user_id", "role_id", "status"], fileName);
  for (const i of [1, 2, 3, 4, 5]) {
    const sisSectionId = `${msg.ug1Name}.section${i}`;
    for (const member of msg.member) {
      const canvasRole = CanvasRole[msg._desc.userType];
      await writeLine(
        [sisSectionId, member, canvasRole.role_id, "active"],
        fileName
      );
    }
  }
  const canvasReturnValue = await canvasApi.sendCsvFile(fileName, true);
  return { msg, resp: canvasReturnValue };
}

module.exports = { handleStaffMessage };
