const handleUserMessage = require("./handleUserMessage");
const handleGroupMessage = require("./handleGroupMessage");

module.exports = async function handleAllMessages(message) {
  if (message.ugClass === "user") {
    // ugClass=user means that a user is created or updated in UG
    const user = await handleUserMessage(message);

    return {
      type: "user",
      user,
    };
  }

  if (message.ugClass === "group") {
    // ugClass=group means that people are added to or removed from an UG group
    // depending on the group we do different things

    const group = await handleGroupMessage(message);

    return {
      type: "group",
      group,
    };
  }

  return { type: "other" };
};
