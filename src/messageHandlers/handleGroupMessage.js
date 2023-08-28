const fs = require("fs");
const path = require("path");
const os = require("os");
const log = require("skog").default;
const csv = require("fast-csv");
const canvasApi = require("../externalApis/canvasApi");

const temporalDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "lms-sync-users-")
);

// Example: app.katalog3.T
const REGEX_EMPLOYEES_GROUP = /app\.katalog3\.(?<department>\w)/;

/**
 * This function handles a special use case, where each employee at KTH is enrolled in up to five internal courses, each having a course rooms in Canvas.
 * These internal courses could be the Canvas@KTH course, or an environment course for instance. The exact usage for these internal courses is irrelevant, this implementation doesn't know and doesn't care which these internal courses are.
 *
 * The way it works:
 * In UG there are groups for each school where each employee is added. These groups are:
 *  app.katalog3.A
 *  app.katalog3.C
 *  app.katalog3.J
 *  app.katalog3.M
 *  app.katalog3.S
 *  app.katalog3.T
 *
 * Every employee at KTH are added to one of these groups, depending on which school he/she is employed at.
 *
 * In Canvas, there are five different sections per above mentioned UG group: one section per supported internal course, per UG group.
 * These sections can be grouped together within Canvas, so that every employee at KTH is enrolled in each of the internal courses.
 *
 * At the time of writing, the following sections are crosslisted into the Canvas@KTH course room:
 * app.katalog3.A.section2 ( 989 users)
 * app.katalog3.C.section2 ( 1,320 users)
 * app.katalog3.J.section2 ( 1,726 users)
 * app.katalog3.M.section2 ( 1,088 users)
 * app.katalog3.S.section2 ( 1,176 users)
 * app.katalog3.T.section2 ( 962 users)
 *
 * Note that the names of the sections don't include any info about this being the Canvas@KTH course. This is on purpose, so that we maintain a flexibility where the name of the sections is coupled * to the UG group name only, NOT to the course it is being tied to.
 *
 *
 */
function convertToEmployeeEnrollments(ugGroupName, members = []) {
  return members.flatMap((kthId) =>
    [1, 2, 3, 4, 5].map((i) => ({
      section_id: `${ugGroupName}.section${i}`,
      user_id: kthId,
      role_id: 3,
      status: "active",
    }))
  );
}

/** Return the group category */
function getGroupCategory(groupName) {
  if (REGEX_EMPLOYEES_GROUP.test(groupName)) {
    return "employee";
  }

  return "other";
}

module.exports = async function handleGroupMessage(message) {
  const { ug1Name: groupName, member: members } = message;
  if (members.length === 0) {
    return;
  }
  const fileName = `lms-sync-users-${groupName}-${Date.now()}.csv`;
  const filePath = path.join(temporalDirectory, fileName);

  const category = getGroupCategory(groupName);
  const writer = fs.createWriteStream(filePath);
  const serializer = csv.format({ headers: true });

  if (category === "other") {
    return { sisImportId: null };
  }

  serializer.pipe(writer);

  if (category === "employee") {
    log.info("Handle as internal course enrollment");
    convertToEmployeeEnrollments(groupName, members).forEach((enr) =>
      serializer.write(enr)
    );
  }

  serializer.end();

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  const { body } = await canvasApi.sendEnrollments(filePath);

  const url = new URL(
    `/api/v1/accounts/1/sis_imports/${body.id}`,
    process.env.CANVAS_API_URL
  );
  log.info(`Enrollments for ${groupName} sent to Canvas. Check ${url}`);

  return { sisImportId: body.id };
};
