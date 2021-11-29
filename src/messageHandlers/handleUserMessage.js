const log = require("skog");
const canvasApi = require("../externalApis/canvasApi");

function shouldBeHandled(message) {
  const affiliations = message.affiliation;

  return (
    affiliations.includes("employee") ||
    affiliations.includes("student") ||
    affiliations.includes("member") ||
    affiliations.includes("affiliate")
  );
}

module.exports = async function handleUserMessage(message) {
  if (!shouldBeHandled(message)) {
    log.info("Message ignored. We don't handle users with these affiliations.");
    return;
  }

  if (!message.kthid) {
    log.info("Message ignored. Missing field [kthid]");
    return;
  }

  if (!message.username) {
    log.info("Message ignored. Missing field [username]");
    return;
  }

  if (!message.given_name && !message.family_name) {
    log.info("Message ignored. Missing either [given_name] or [family_name]");
    return;
  }

  const canvasObject = {
    pseudonym: {
      unique_id: `${message.username}@kth.se`,
      sis_user_id: message.kthid,
      integration_id: message.ladok3_student_uid || null,
    },
    user: {
      name: `${message.given_name} ${message.family_name}`,
      email: message.primary_email, // must be when 'updating' user
      sortable_name: `${message.family_name}, ${message.given_name}`,
      short_name: null, // a fix to make sure that display name is updated
    },
    communication_channel: {
      // must be when 'creating' user
      type: "email",
      address: message.primary_email,
      skip_confirmation: true,
    },
    login: {
      integration_id: message.ladok3_student_uid || null, // For setting integration_id on update via the logins endpoint
    },
  };

  const userFromCanvas = await canvasApi.getUser(message.kthid);

  if (!userFromCanvas) {
    await canvasApi.createUser(canvasObject);
    log.info(`User ${message.kthid} created in Canvas`);
  } else {
    await canvasApi.updateUser(userFromCanvas.id, canvasObject);
    const primaryLogin = await canvasApi.getPrimaryLoginId(userFromCanvas);

    await canvasApi.updateLogin(
      userFromCanvas.id,
      primaryLogin.id,
      canvasObject
    );
    log.info(`User ${message.kthid} updated in Canvas`);
  }
};
