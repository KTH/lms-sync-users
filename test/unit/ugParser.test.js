const test = require("ava");
const ugParser = require("../../messages/ugParser.js");

test.serial("Parse teacher group name for a spring round", (t) => {
  t.is(
    ugParser.parseKeyTeacher("edu.courses.MG.MG1028.20171.2.teachers"),
    "MG1028VT172"
  );
});

test.serial("Parse teacher group name for a fall round", (t) => {
  t.is(
    ugParser.parseKeyTeacher("edu.courses.MG.MG1028.20172.7.teachers"),
    "MG1028HT177"
  );
});

test.serial("Parse student group name for a spring round", (t) => {
  t.is(
    ugParser.parseKeyStudent("ladok2.kurser.DM.2517.registrerade_20171.3"),
    "DM2517VT173"
  );
});

test.serial("Parse student group name for a fall round", (t) => {
  t.is(
    ugParser.parseKeyStudent("ladok2.kurser.DM.2517.registrerade_20162.1"),
    "DM2517HT161"
  );
});
