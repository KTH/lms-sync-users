/** Singleton object for Canvas API */
const CanvasApi = require("@kth/canvas-api").default;

const canvas = new CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_TOKEN
);

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
  return canvas.request(`users/${userId}`, "PUT", data);
}

async function createUser(user) {
  return canvas.request("accounts/1/users", "POST", user);
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

async function updateLogin(userId, loginId, data) {
  return canvas.request(`users/${userId}/logins/${loginId}`, "PUT", data);
}

module.exports = {
  getUser,
  updateUser,
  createUser,
  getPrimaryLoginId,
  getRootAccount,
  updateLogin,
};
