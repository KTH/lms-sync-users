"use strict";

function parseKeyTeacher(key) {
  // edu.courses.AE.AE2302.20162.1.teachers edu.courses.DD.DD1310.20162.1.assistants
  // edu.courses.DD.DD1310.20162.1.courseresponsible
  let course = null;
  let termin = null;
  let year = null;
  let ladok = null;
  const courseIn = 2;
  const terminIn = 5;
  const yearIn = 4;
  const ladokIn = 6;

  const myRe = /^edu.courses.(\w+).(\w+).(\d\d)(\d\d)(\d).(\d).(\w+)$/g;
  const myArray = myRe.exec(key);
  if (myArray != null) {
    course = myArray[courseIn];
    termin = myArray[terminIn] === "1" ? "VT" : "HT";
    year = myArray[yearIn];
    ladok = myArray[ladokIn];
    const sisCourseCode = course + termin + year + ladok;
    return sisCourseCode;
  }
}

function parseKeyStudent(key) {
  // ladok2.kurser.DM.2517.registrerade_20162.1
  let course = null;
  let termin = null;
  let year = null;
  let ladok = null;
  const myRe = /^(\w+).(\w+).(\w+).(\w+).(\w+)_(\d\d)(\d\d)(\d).(\d+)/g;
  const myArray = myRe.exec(key);
  if (myArray != null) {
    const courseInOne = 3;
    const courseInTwo = 4;
    const terminIn = 8;
    const yearIn = 7;
    const ladokIn = 9;
    course = myArray[courseInOne] + myArray[courseInTwo];
    termin = myArray[terminIn] === "1" ? "VT" : "HT";
    year = myArray[yearIn];
    ladok = myArray[ladokIn];
    const sisCourseCode = course + termin + year + ladok;
    return sisCourseCode;
  }
}

module.exports = {
  parseKeyTeacher,
  parseKeyStudent,
};
