/** Singleton object for Canvas API */
const CanvasApi = require("@kth/canvas-api").default;

const canvas = new CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_TOKEN
);

async function getUser(kthId) {
  return canvas.get(`users/sis_user_id:${kthId}`).then((res) => res.body);
}

async function updateUser(userId, data) {
  return canvas.request(`users/${userId}`, "PUT", data);
}

async function getRootAccount() {
  return canvas.get("accounts/1").then((res) => res.body);
}

module.exports = {
  getUser,
  updateUser,
  getRootAccount,
};
