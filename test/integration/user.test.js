const test = require("ava");
const randomstring = require("randomstring");
const { handleMessages } = require("./_utils");
const canvasApi = require("../../canvasApi");

test.serial("should create a new user in canvas", async (t) => {
  t.plan(1);
  const kthid = randomstring.generate(8);
  const ladokId = randomstring.generate(24);
  const username = `${kthid}_abc`;
  const message = {
    kthid,
    ugClass: "user",
    deleted: false,
    affiliation: ["student"],
    username,
    family_name: "Stenberg",
    given_name: "Emil Stenberg",
    primary_email: "esandin@gmail.com",
    ladok3_student_uid: ladokId,
  };

  await handleMessages(message)
    .then(() => canvasApi.getUser(kthid))
    .then((user) => t.truthy(user));
});

test.serial(
  "should create a new user in canvas even without ladokId",
  async (t) => {
    t.plan(1);
    const kthid = randomstring.generate(8);
    const username = `${kthid}_abc`;
    const message = {
      kthid,
      ugClass: "user",
      deleted: false,
      affiliation: ["student"],
      username,
      family_name: "Stenberg",
      given_name: "Emil Stenberg",
      primary_email: "esandin@gmail.com",
    };

    await handleMessages(message)
      .then(() => canvasApi.getUser(kthid))
      .then((user) => t.truthy(user));
  }
);

test.serial(
  "should create a new user of affiliation:member in canvas",
  async (t) => {
    t.plan(1);
    const kthid = randomstring.generate(8);
    const username = `${kthid}_abc`;
    const ladokId = randomstring.generate(24);
    const message = {
      kthid,
      ugClass: "user",
      deleted: false,
      affiliation: ["member"],
      username,
      family_name: "Stenberg",
      given_name: "Emil Stenberg",
      primary_email: "esandin@gmail.com",
      ladok3_student_uid: ladokId,
    };

    await handleMessages(message)
      .then(() => canvasApi.getUser(kthid))
      .then((user) => t.truthy(user));
  }
);

test.serial("should update a user in canvas", async (t) => {
  t.plan(1);
  const kthid = "emiluppdaterar-namn";
  const username = `${kthid}_abc`;
  const ladokId = randomstring.generate(24);

  const message = {
    kthid,
    ugClass: "user",
    deleted: false,
    affiliation: ["student"],
    username,
    family_name: "Stenberg",
    given_name: "Emil Stenberg",
    primary_email: "esandin@gmail.com",
    ladok3_student_uid: ladokId,
  };

  const message2 = {
    kthid,
    ugClass: "user",
    deleted: false,
    affiliation: ["student"],
    username,
    family_name: "Stenberg",
    given_name: "Emil Stenberg Uppdaterad",
    primary_email: "esandin@gmail.com",
    ladok3_student_uid: ladokId,
  };

  await handleMessages(message, message2)
    .then(() => canvasApi.getUser(kthid))
    .then(
      (user) =>
        t.is(user.short_name, "Emil Stenberg Uppdaterad Stenberg") &&
        t.is(user.integration_id, "")
    );
});

test.serial(
  "should update a user in canvas even if Ladok ID is not supplied",
  async (t) => {
    t.plan(1);
    const kthid = "emiluppdaterar-namn";
    const username = `${kthid}_abc`;
    const ladokId = randomstring.generate(24);

    const message = {
      kthid,
      ugClass: "user",
      deleted: false,
      affiliation: ["student"],
      username,
      family_name: "Stenberg",
      given_name: "Emil Stenberg",
      primary_email: "esandin@gmail.com",
      ladok3_student_uid: ladokId,
    };

    const message2 = {
      kthid,
      ugClass: "user",
      deleted: false,
      affiliation: ["student"],
      username,
      family_name: "Stenberg",
      given_name: "Emil Stenberg Uppdaterad",
      primary_email: "esandin@gmail.com",
    };

    await handleMessages(message, message2)
      .then(() => canvasApi.getUser(kthid))
      .then(
        (user) =>
          t.is(user.short_name, "Emil Stenberg Uppdaterad Stenberg") &&
          t.is(user.integration_id, "")
      );
  }
);
