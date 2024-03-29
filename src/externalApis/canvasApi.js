/** Singleton object for Canvas API */
const { default: CanvasApi, minimalErrorHandler } = require("@kth/canvas-api");

const canvas = new CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_KEY
);

canvas.errorHandler = minimalErrorHandler;

/** Get the Canvas user with a given KTH ID. Returns null if not found */
async function getUser(kthId) {
  return canvas
    .get(`users/sis_user_id:${kthId}`)
    .then((res) => res.body)
    .catch((err) => {
      if (err?.response?.statusCode === 404) {
        return null;
      }

      throw err;
    });
}

async function updateUser(userId, data) {
  return canvas.request(`users/${userId}`, "PUT", data).then((res) => res.body);
}

async function createUser(user) {
  return canvas
    .request("accounts/1/users", "POST", user)
    .then((res) => res.body);
}

async function getRootAccount() {
  return canvas.get("accounts/1").then((res) => res.body);
}

async function getPrimaryLoginId(user) {
  const allLogins = await canvas
    .get(`users/${user.id}/logins`)
    .then((res) => res.body);

  return allLogins.find((l) => l.unique_id === user.login_id);
}

async function updateLogin(loginId, data) {
  return canvas.request(`accounts/1/logins/${loginId}`, "PUT", data);
}

async function sendEnrollments(path) {
  return canvas.sisImport(path);
}

/* The following functions are used only in tests
   TODO: make it more obvious! */

async function createCourse(accountId, course) {
  return canvas
    .request(`accounts/${accountId}/courses`, "POST", course)
    .then((r) => r.body);
}

async function createDefaultSection(course) {
  return canvas
    .request(`courses/${course.id}/sections`, "POST", {
      course_section: {
        name: `Section for ${course.name}`,
        sis_section_id: course.sis_course_id,
        sis_course_id: course.sis_course_id,
      },
    })
    .then((r) => r.body);
}

async function getCourseEnrollments(courseId) {
  return canvas.listItems(`courses/${courseId}/enrollments`).toArray();
}

async function getSectionEnrollments(sisSectionId, sisUserId) {
  return canvas
    .listItems(`sections/sis_section_id:${sisSectionId}/enrollments`, {
      sis_user_id: sisUserId,
    })
    .toArray();
}

async function pollUntilSisComplete(sisImportId, secondsToWait = 120) {
  for (let i = 1; i < secondsToWait; i++) {
    // eslint-disable-next-line no-await-in-loop
    const sisImport = await canvas
      .get(`accounts/1/sis_imports/${sisImportId}`)
      .then((r) => r.body);

    if (sisImport.progress === 100) {
      return sisImport;
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `SIS import ${sisImportId} did not complete after very long time`
  );
}

module.exports = {
  getUser,
  updateUser,
  createUser,
  getPrimaryLoginId,
  getRootAccount,
  updateLogin,
  sendEnrollments,
  createCourse,
  createDefaultSection,
  getCourseEnrollments,
  getSectionEnrollments,
  pollUntilSisComplete,
};
