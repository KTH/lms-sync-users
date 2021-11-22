const fs = require("fs");
const path = require("path");
const os = require("os");
const log = require("skog");
const csv = require("fast-csv");
const canvasApi = require("../externalApis/canvasApi");

const terms = { 1: "VT", 2: "HT" };
const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
const dir = path.join(baseDir, "csv");
fs.mkdirSync(dir);

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
      sis_section_id: sisId,
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
      sis_section_id: sisId,
      status: "active",
      role_id: 3,
    },
    {
      sis_section_id: sisId,
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
    sis_section_id: `${group}.section${i}`,
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
  const fileName = `${dir}/${message.group}-${Date.now()}.csv`;
  const writer = fs.createWriteStream(fileName);
  const serializer = csv.format({ headers: true });
  const enrollments = getEnrollmentCsvData(message.group);

  serializer.pipe(writer);

  for (const enrollment of enrollments) {
    for (const userId of message.member) {
      serializer.write({
        ...enrollment,
        user_id: userId,
      });
    }
  }

  serializer.end();

  const { body } = await canvasApi.sendEnrollments(path);

  const url = new URL(
    `accounts/1/sis_imports/${body.id}`,
    process.env.CANVAS_API_URL
  );
  log.info(`Enrollments for ${message.group} sent to Canvas. Check ${url}`);
};
