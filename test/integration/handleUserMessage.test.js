const test = require("tape");
const randomstring = require("randomstring");
const { handleMessages } = require("./utils");
const canvasApi = require("../../src/externalApis/canvasApi");

test("should create a new user in canvas", (t) => {
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

  handleMessages(message)
    .then(() => canvasApi.getUser(kthid))
    .then((user) => t.ok(user));
});

test("should create a new user in canvas even without ladokId", (t) => {
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

  handleMessages(message)
    .then(() => canvasApi.getUser(kthid))
    .then((user) => t.ok(user));
});

test("should create a new user of affiliation:member in canvas", (t) => {
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

  handleMessages(message)
    .then(() => canvasApi.getUser(kthid))
    .then((user) => t.ok(user));
});

test("should update a user in canvas", (t) => {
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

  handleMessages(message, message2)
    .then(() => canvasApi.getUser(kthid))
    .then(
      (user) =>
        t.equal(user.short_name, "Emil Stenberg Uppdaterad Stenberg") &&
        t.equal(user.integration_id, "")
    );
});

test("should update a user in canvas even if Ladok ID is not supplied", (t) => {
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

  handleMessages(message, message2)
    .then(() => canvasApi.getUser(kthid))
    .then(
      (user) =>
        t.equal(user.short_name, "Emil Stenberg Uppdaterad Stenberg") &&
        t.equal(user.integration_id, "")
    );
});
