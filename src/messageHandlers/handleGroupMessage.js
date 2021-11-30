const fs = require("fs");
const path = require("path");
const os = require("os");
const log = require("skog");
const csv = require("fast-csv");
const canvasApi = require("../externalApis/canvasApi");

const terms = { 1: "VT", 2: "HT" };
const temporalDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "lms-sync-users-")
);

function createSisCourseId({ courseCode, startTerm, roundId }) {
  const termNum = startTerm[4];
  const shortYear = `${startTerm[2]}${startTerm[3]}`;
  const term = terms[termNum];

  return `${courseCode}${term}${shortYear}${roundId}`;
}

function getTeacherEnrollmentCsvData(group) {
  // Example: edu.courses.AA.AA1111.20211.1.teachers
  const teachersGroupRegEx =
    /edu\.courses\.\w{2,3}\.(?<courseCode>\w{6,7})\.(?<startTerm>\d{5})\.(?<roundId>\w)\.(?<roleName>\w+)/;

  const roleIds = {
    teachers: 4,
    assistants: 5,
    courseresponsible: 9,
  };

  const match = group.match(teachersGroupRegEx);

  if (!match) {
    return [];
  }

  const { courseCode, startTerm, roundId, roleName } = match.groups;
  const sisId = createSisCourseId({ courseCode, startTerm, roundId });

  return [
    {
      section_id: sisId,
      status: "active",
      role_id: roleIds[roleName],
    },
  ];
}

function getStudentEnrollmentCsvData(group) {
  // Example: ladok2.kurser.AA.1111.registrerade_20211.1
  const studentsGroupRegEx =
    /ladok2\.kurser\.(?<courseCodePrefix>\w{2,3})\.(?<courseCodeSuffix>\w{4})\.registrerade_(?<startTerm>\d{5})\.(?<roundId>\w)/;

  const match = group.match(studentsGroupRegEx);

  if (!match) {
    return [];
  }

  const { courseCodePrefix, courseCodeSuffix, startTerm, roundId } =
    match.groups;
  const courseCode = `${courseCodePrefix}${courseCodeSuffix}`;
  const sisId = createSisCourseId({ courseCode, startTerm, roundId });

  return [
    {
      section_id: sisId,
      status: "active",
      role_id: 3,
    },
    {
      section_id: sisId,
      status: "deleted",
      role_id: 25,
    },
  ];
}

function getEmployeeEnrollmentCsvData(group) {
  // Example: app.katalog3.T
  const employeesGroupRegEx = /app\.katalog3\.(?<department>\w)/;
  const match = group.match(employeesGroupRegEx);

  if (!match) {
    return [];
  }

  return [1, 2, 3, 4, 5].map((i) => ({
    section_id: `${group}.section${i}`,
    role_id: 3,
    status: "active",
  }));
}

/**
 * Given an UG group, returns an array of "enrollment data" i.e. objects with
 * the columns "sis_section_id", "status", "role_id" for enrollments
 */
function getEnrollmentCsvData(group) {
  const teacherEnrollmentData = getTeacherEnrollmentCsvData(group);
  const studentEnrollmentData = getStudentEnrollmentCsvData(group);
  const employeeEnrollmentData = getEmployeeEnrollmentCsvData(group);

  return [
    ...teacherEnrollmentData,
    ...studentEnrollmentData,
    ...employeeEnrollmentData,
  ];
}

module.exports = async function handleGroupMessage(message) {
  const { ug1Name: groupName, member: members } = message;
  const fileName = `${groupName}-${Date.now()}.csv`;
  const filePath = path.join(temporalDirectory, fileName);

  const writer = fs.createWriteStream(filePath);
  const serializer = csv.format({ headers: true });
  serializer.pipe(writer);

  const enrollments = getEnrollmentCsvData(groupName);

  if (enrollments.length === 0) {
    return { sisImportId: null };
  }

  for (const enrollment of enrollments) {
    for (const userId of members) {
      serializer.write({
        ...enrollment,
        user_id: userId,
      });
    }
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
