const test = require("tape");
const randomstring = require("randomstring");
const handleMessage = require("../../src/messageHandlers");
const canvasApi = require("../../src/externalApis/canvasApi");

// TODO: Create a unit test that checks what is returned by `handleMessage`

test("should create a new user in canvas", async (t) => {
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

  await handleMessage(message);

  const user = await canvasApi.getUser(kthid);
  t.ok(user, "User should exist in Canvas");
});

test("should create a new user in canvas even without ladokId", async (t) => {
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

  await handleMessage(message);

  const user = await canvasApi.getUser(kthid);
  t.ok(user, "User should exist in Canvas");
});

test("should create a new user of affiliation:member in canvas", async (t) => {
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

  await handleMessage(message);

  const user = await canvasApi.getUser(kthid);
  t.ok(user, `User with KTH ID ${kthid} should exist in Canvas`);
});

test("should not create a new user of affiliation:other in canvas", async (t) => {
  t.plan(1);
  const kthid = randomstring.generate(8);
  const username = `${kthid}_abc`;
  const ladokId = randomstring.generate(24);
  const message = {
    kthid,
    ugClass: "user",
    deleted: false,
    affiliation: ["other"],
    username,
    family_name: "Stenberg",
    given_name: "Emil Stenberg",
    primary_email: "esandin@gmail.com",
    ladok3_student_uid: ladokId,
  };

  await handleMessage(message);

  const user = await canvasApi.getUser(kthid);
  t.equal(user, null, "User should not exist in Canvas");
});

test("should update a user in canvas", async (t) => {
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
    given_name: "Emil",
    primary_email: "esandin@gmail.com",
    ladok3_student_uid: ladokId,
  };

  const message2 = {
    kthid,
    ugClass: "user",
    deleted: false,
    affiliation: ["student"],
    username,
    family_name: "Stenberg Uppdaterad",
    given_name: "Emil",
    primary_email: "esandin@gmail.com",
    ladok3_student_uid: ladokId,
  };

  await handleMessage(message);
  await handleMessage(message2);

  const user = await canvasApi.getUser(kthid);
  t.equal(user.name, "Emil Stenberg Uppdaterad", "Name should be updated");
});

test("should update a user in canvas even if Ladok ID is not supplied", async (t) => {
  t.plan(2);
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
    given_name: "Emil",
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
    given_name: "Emil Uppdaterad",
    primary_email: "esandin@gmail.com",
  };

  await handleMessage(message);
  await handleMessage(message2);

  const user = await canvasApi.getUser(kthid);
  t.ok(user, "User should exist in Canvas");
  t.equal(user.name, "Emil Uppdaterad Stenberg", "Name should be updated");
});
