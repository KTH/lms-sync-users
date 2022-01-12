const log = require("skog");
const canvasApi = require("../externalApis/canvasApi");

function containsHandledAffiliations(affiliations) {
  return (
    affiliations.includes("employee") ||
    affiliations.includes("student") ||
    affiliations.includes("member") ||
    affiliations.includes("affiliate")
  );
}

module.exports = async function handleUserMessage(message) {
  if (!containsHandledAffiliations(message.affiliation)) {
    log.info("Message ignored. We don't handle users with these affiliations.");
    return { action: "ignore", id: null };
  }

  if (!message.kthid) {
    log.info("Message ignored. Missing field [kthid]");
    return { action: "ignore", id: null };
  }

  if (!message.username) {
    log.info("Message ignored. Missing field [username]");
    return { action: "ignore", id: null };
  }

  if (!message.given_name && !message.family_name) {
    log.info("Message ignored. Missing either [given_name] or [family_name]");
    return { action: "ignore", id: null };
  }

  const userFromCanvas = await canvasApi.getUser(message.kthid);

  if (!userFromCanvas) {
    log.info("The user doesn't exist in Canvas, create it.");
    const user = await canvasApi.createUser({
      user: {
        name: `${message.given_name} ${message.family_name}`,
        sortable_name: `${message.family_name}, ${message.given_name}`,
      },
      pseudonym: {
        unique_id: `${message.username}@kth.se`,
        sis_user_id: message.kthid,
        integration_id: message.ladok3_student_uid || null,
      },
      communication_channel: {
        type: "email",
        address: message.primary_email,
        skip_confirmation: true,
      },
    });
    log.info(`User ${message.kthid} created in Canvas`);

    return { action: "create", id: user.id };
  }

  log.info("The user exist in Canvas, update it.");
  const user = await canvasApi.updateUser(userFromCanvas.id, {
    user: {
      name: `${message.given_name} ${message.family_name}`,
      email: message.primary_email,
      sortable_name: `${message.family_name}, ${message.given_name}`,
      short_name: null,
    },
  });
  const primaryLogin = await canvasApi.getPrimaryLoginId(userFromCanvas);

  await canvasApi.updateLogin(primaryLogin.id, {
    login: {
      integration_id: message.ladok3_student_uid || null,
    },
  });
  log.info(`User ${message.kthid} updated in Canvas`);
  return { action: "update", id: user.id };
};
