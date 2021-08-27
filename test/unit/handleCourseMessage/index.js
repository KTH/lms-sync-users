const test = require("ava");
const proxyquire = require("proxyquire");
require("rewire-global").enable();
const sinon = require("sinon");
const { UserType } = require("../../../messages/messageType");

test.serial("should NOT parse key:student for antagna", (t) => {
  const ugParser = { parseKeyStudent: sinon.spy() };
  const handleCourseMessages = proxyquire(
    "../../../messages/handleCourseMessage",
    { "./ugParser": ugParser }
  );
  t.throws(() =>
    handleCourseMessages.parseKey({
      ug1Name: "ladok2.kurser.SF.1626.antagna_20171.1",
      _desc: { userType: UserType.ANTAGNA },
    })
  );
});

test.serial("should send the csv file for user type is student", async (t) => {
  t.plan(1);
  const canvasApi = require("../../../canvasApi");
  const createCsvFile = sinon.stub().returns({ name: "file.csv" });
  const handleCourseMessages = proxyquire(
    "../../../messages/handleCourseMessage",
    { "./createCsvFile": createCsvFile }
  );
  canvasApi.sendCsvFile = sinon.stub();
  handleCourseMessages.__set__(
    "parseKey",
    sinon.stub().returns(Promise.resolve())
  );
  // .returns(Promise.reject({statusCode:404}))
  const message = {
    _desc: {
      userType: UserType.STUDENT,
    },
  };

  await handleCourseMessages.handleCourseMessage(message).then(() => {
    t.truthy(canvasApi.sendCsvFile.calledWith("file.csv", true));
  });
});
