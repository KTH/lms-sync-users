const test = require("tape");
const { handleMessages } = require("./utils");
const canvasApi = require("../../canvasApi");
const randomstring = require("randomstring");
const { promisify } = require("util");

async function createCourse(sisCourseId) {
  const ACCOUNT_ID = 14;
  const course = {
    name: `Integration test ${sisCourseId}`,
    course_code: "Integration test",
    sis_course_id: sisCourseId,
  };

  const canvasCourse = await canvasApi.createCourse({ course }, ACCOUNT_ID);
  await canvasApi.createDefaultSection(canvasCourse);

  return canvasCourse;
}

async function createUser() {
  const kthId = `v${randomstring.generate(7)}`;
  const email = `${kthId}@kth.se`;
  await canvasApi.createUser({
    pseudonym: {
      unique_id: kthId,
      sis_user_id: kthId,
      skip_registration: true,
      send_confirmation: false,
    },
    user: {
      name: "Integration test",
      sortable_name: "Integration test",
    },
    communication_channel: {
      type: "email",
      address: email,
      skip_confirmation: true,
    },
    enable_sis_reactivation: false,
  });

  return kthId;
}

test("should enroll an assistant in an existing course in canvas", async (t) => {
  t.plan(1);

  // Create the "existing course" and the "assistant" in Canvas
  // Course code should be 6 characters long
  const courseCode = "A" + randomstring.generate(5);
  const assistantId = await createUser();
  const canvasCourse = await createCourse(courseCode + "VT171");

  const message = {
    ugClass: "group",
    ug1Name: `edu.courses.SF.${courseCode}.20171.1.assistants`,
    member: [assistantId],
  };

  const [{ resp }] = await handleMessages(message);
  await canvasApi.pollUntilSisComplete(resp.id);
  const enrollments = await canvasApi.getEnrollments(canvasCourse.id);
  t.equal(enrollments[0].sis_user_id, assistantId);
});

test("should enroll an employee in Miljöutbildningen and Canvas at KTH", async (t) => {
  t.plan(2);
  const muId = 17839; // Miljöutbildningen
  const ckId = 1; // Canvas at KTH

  // Create the "employee" in Canvas
  const employeeId = await createUser();

  const message = {
    ugClass: "group",
    ug1Name: "app.katalog3.A",
    member: [employeeId],
  };

  const [{ resp }] = await handleMessages(message);
  await canvasApi.pollUntilSisComplete(resp.id);

  const muEnrollments = await canvasApi.getSectionEnrollments(
    muId,
    "app.katalog3.A.section1"
  );
  const ckEnrollments = await canvasApi.getSectionEnrollments(
    ckId,
    "app.katalog3.A.section2"
  );

  t.ok(
    muEnrollments.find((e) => e.user.sis_user_id === employeeId),
    `The user ${employeeId} has been enrolled in Miljöutbildningen`
  );

  t.ok(
    ckEnrollments.find((e) => e.user.sis_user_id === employeeId),
    `The user ${employeeId} has been enrolled in Canvas at KTH`
  );
});

test("should NOT enroll a re-registered student in an existing course in Canvas", async (t) => {
  t.plan(1);
  const cc0 = "A" + randomstring.generate(1);
  const cc1 = randomstring.generate(4);

  const canvasCourse = await createCourse(cc0 + cc1 + "VT173");
  const studentId = await createUser();

  const message = {
    ugClass: "group",
    ug1Name: `ladok2.kurser.${cc0}.${cc1}.omregistrerade_20171`,
    member: [studentId],
  };

  await handleMessages(message);
  await promisify(setTimeout)(5000);

  const enrollments = await canvasApi.getEnrollments(canvasCourse.id);
  t.deepEqual(enrollments, []);
});

test("should enroll a student in an existing course", async (t) => {
  t.plan(1);
  const cc0 = "A" + randomstring.generate(1);
  const cc1 = randomstring.generate(4);

  const canvasCourse = await createCourse(cc0 + cc1 + "VT171");
  const studentId = await createUser();

  const message = {
    ugClass: "group",
    ug1Name: `ladok2.kurser.${cc0}.${cc1}.registrerade_20171.1`,
    member: [studentId],
  };

  const [{ resp }] = await handleMessages(message);
  await canvasApi.pollUntilSisComplete(resp.id);

  const enrollments = await canvasApi.getEnrollments(canvasCourse.id);
  t.equal(enrollments[0].sis_user_id, studentId);
});

test("should enroll TA:s for an f-course", async (t) => {
  t.plan(2);

  // Course code is for example "FE" "A1234"
  const cc0 = "F" + randomstring.generate(2);
  const cc1 = randomstring.generate(4);
  const courseCode = cc0 + cc1;

  const canvasCourse = await createCourse(courseCode + "VT171");
  const assistantId = await createUser();

  const message = {
    kthid: "u219zuii",
    ug1Name: `edu.courses.${cc0}.${courseCode}.20171.1.assistants`,
    member: [assistantId],
  };

  const [{ resp }] = await handleMessages(message);
  t.ok(resp);
  await canvasApi.pollUntilSisComplete(resp.id);

  const enrollments = await canvasApi.getEnrollments(canvasCourse.id);
  t.equal(enrollments[0].sis_user_id, assistantId);
});

test("should not enroll an antagen", async (t) => {
  t.plan(1);
  const cc0 = "A" + randomstring.generate(1);
  const cc1 = randomstring.generate(4);

  const canvasCourse = await createCourse(cc0 + cc1 + "VT181");
  const studentId = await createUser();

  const message = {
    ugClass: "group",
    ug1Name: `ladok2.kurser.${cc0}.${cc1}.antagna_20181.1`,
    member: [studentId],
  };

  await handleMessages(message);

  await promisify(setTimeout)(5000);
  const enrollments = await canvasApi.getEnrollments(canvasCourse.id);
  t.deepEqual(enrollments, []);
});
