const test = require("tape");
const randomstring = require("randomstring");
const handleMessage = require("../../src/messageHandlers");
const canvasApi = require("../../src/externalApis/canvasApi");

test("should create a new user in canvas", async (t) => {
  t.plan(4);
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

  const result = await handleMessage(message);
  t.equal(result.type, "user", "handleMessage result.type must be 'user'");
  t.equal(
    result.user.action,
    "create",
    "handleMessage user.action must be 'create'"
  );

  const user = await canvasApi.getUser(kthid);
  t.ok(user, "User should exist in Canvas");
  t.equal(
    user.id,
    result.user.id,
    "Created user in Canvas should be same as value returned by handleMessage"
  );
});

test("should create a new user in canvas even without ladokId", async (t) => {
  t.plan(4);
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

  const result = await handleMessage(message);
  t.equal(result.type, "user", "handleMessage result.type must be 'user'");
  t.equal(
    result.user.action,
    "create",
    "handleMessage user.action must be 'create'"
  );

  const user = await canvasApi.getUser(kthid);
  t.ok(user, "User should exist in Canvas");
  t.equal(
    user.id,
    result.user.id,
    "Created user in Canvas should be same as value returned by handleMessage"
  );
});

test("should create a new user of affiliation:member in canvas", async (t) => {
  t.plan(4);
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

  const result = await handleMessage(message);
  t.equal(result.type, "user", "handleMessage result.type must be 'user'");
  t.equal(
    result.user.action,
    "create",
    "handleMessage user.action must be 'create'"
  );

  const user = await canvasApi.getUser(kthid);
  t.ok(user, "User should exist in Canvas");
  t.equal(
    user.id,
    result.user.id,
    "Created user in Canvas should be same as value returned by handleMessage"
  );
});

test("should not create a new user of affiliation:other in canvas", async (t) => {
  t.plan(4);
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

  const result = await handleMessage(message);
  t.equal(result.type, "user", "handleMessage result.type must be 'user'");
  t.equal(result.user.action, "ignore");

  const user = await canvasApi.getUser(kthid);
  t.equal(user, null, "User should not exist in Canvas");
});

test("should update a user in canvas", async (t) => {
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

  await handleMessage(message);
  const result = await handleMessage(message2);

  t.equal(result.type, "user", "handleMessage result.type must be 'user'");
  t.equal(result.user.action, "update");

  const user = await canvasApi.getUser(kthid);
  t.ok(user, "User should exist in Canvas");
  t.equal(
    user.id,
    result.user.id,
    "Updated user in Canvas should be same as value returned by handleMessage"
  );
});

test("should update a user in canvas even if Ladok ID is not supplied", async (t) => {
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

  await handleMessage(message);
  const result = await handleMessage(message2);

  t.equal(result.type, "user", "handleMessage result.type must be 'user'");
  t.equal(result.user.action, "update");

  const user = await canvasApi.getUser(kthid);
  t.ok(user, "User should exist in Canvas");
  t.equal(
    user.id,
    result.user.id,
    "Updated user in Canvas should be same as value returned by handleMessage"
  );
});
