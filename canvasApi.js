const CanvasApi = require("@kth/canvas-api");
const logger = require("./server/logging");

logger.info("using canvas api at:", process.env.CANVAS_API_URL);

const canvasApi = new CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_KEY,
  {
    timeout: 10 * 1000, // 10 seconds
  }
);

module.exports = {
  async sendCsvFile(fileName) {
    const { body } = await canvasApi.sendSis(
      "accounts/1/sis_imports",
      fileName
    );
    logger.info(
      `SIS Import created: ${process.env.CANVAS_API_URL}/accounts/1/sis_imports/${body.id}`
    );
    return body;
  },
  async getUser(sisUserId) {
    const { body } = await canvasApi.get(`users/sis_user_id:${sisUserId}`);
    return body;
  },
  async get(endpoint) {
    const { body } = await canvasApi.get(endpoint);
    return body;
  },
  updateUser(data, id) {
    return canvasApi.requestUrl(`users/${id}`, "PUT", data);
  },
  requestCanvas(url, method, body) {
    return canvasApi.requestUrl(url, method, body);
  },
  createUser(data) {
    return canvasApi.requestUrl("accounts/1/users", "POST", data);
  },
  async createCourse(data, accountId) {
    const { body } = await canvasApi.requestUrl(
      `accounts/${accountId}/courses`,
      "POST",
      data
    );
    return body;
  },
  createDefaultSection(course) {
    const courseSection = {
      course_section: {
        name: `Section for ${course.name}`,
        sis_course_id: course.sis_course_id,
        sis_section_id: course.sis_course_id,
      },
    };

    return canvasApi.requestUrl(
      `courses/${course.id}/sections`,
      "POST",
      courseSection
    );
  },
  async pollUntilSisComplete(sisImportId, wait = 100) {
    return new Promise((resolve) => {
      canvasApi.get(`accounts/1/sis_imports/${sisImportId}`).then((result) => {
        logger.info("progress:", result.body.progress);
        if (result.body.progress === 100) {
          // csv complete
          resolve(result.body);
        } else {
          logger.info(`not yet complete, try again in ${wait / 1000} seconds`);
          // Not complete, wait and try again
          setTimeout(
            () =>
              this.pollUntilSisComplete(sisImportId, wait * 2).then((r) =>
                resolve(r)
              ),
            wait
          );
        }
      });
    });
  },

  async getEnrollments(courseId) {
    const enrollments = canvasApi
      .list(`courses/${courseId}/enrollments`)
      .toArray();

    return enrollments;
  },

  async getSectionEnrollments(courseId, sisSectionId) {
    const enrollments = await canvasApi
      .list(`courses/${courseId}/enrollments`, {
        sis_section_id: sisSectionId,
      })
      .toArray();

    console.log('getSectionEnrollments')
    return enrollments;
  },

  // This function is used in `server/systemroutes` (a.k.a. the monitor page)
  async getRootAccount() {
    try {
      const { body } = await canvasApi.get("accounts/1");

      return body.name === "KTH Royal Institute of Technology";
    } catch (err) {
      logger.error(err, "Error when getting the root account");
      return false;
    }
  },
};
