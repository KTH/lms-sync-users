const test = require("tape");
const randomstring = require("randomstring");
const handleMessage = require("../../src/messageHandlers/handleAllMessages");
const canvasApi = require("../../src/externalApis/canvasApi");

async function createFakeUser() {
  const kthId = `v${randomstring.generate(7)}`;
  const email = `${kthId}@kth.se`;
  await canvasApi.createUser({
    pseudonym: {
      unique_id: kthId,
      sis_user_id: kthId,
      skip_registration: true,
      send_confirmation: false,
    },
    user: {
      name: "Integration test",
      sortable_name: "Integration test",
    },
    communication_channel: {
      type: "email",
      address: email,
      skip_confirmation: true,
    },
    enable_sis_reactivation: false,
  });

  return kthId;
}

test("should enroll an employee in Miljöutbildningen and Canvas at KTH", async (t) => {
  t.plan(3);

  // Create the "employee" in Canvas
  const employeeId = await createFakeUser();

  const message = {
    ugClass: "group",
    ug1Name: "app.katalog3.A",
    member: [employeeId],
  };

  const result = await handleMessage(message);
  t.equal(result.type, "group", "`handleMessage` result.type should be group");
  await canvasApi.pollUntilSisComplete(result.group.sisImportId);

  const muEnrollments = await canvasApi.getSectionEnrollments(
    "app.katalog3.A.section1",
    employeeId
  );
  const ckEnrollments = await canvasApi.getSectionEnrollments(
    "app.katalog3.A.section2",
    employeeId
  );

  t.equal(
    muEnrollments.length,
    1,
    `The user ${employeeId} has been enrolled in Miljöutbildningen`
  );

  t.equal(
    ckEnrollments.length,
    1,
    `The user ${employeeId} has been enrolled in Canvas at KTH`
  );
});
