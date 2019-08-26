const type = {
  omregistrerade: 'Re-reg student',
  user: 'USER',
  course: 'COURSE',
  students: 'STUDENT',
  staff: 'STAFF',
  teachers: 'TEACHER',
  courseresponsibles: 'Course Responsible',
  assistants: 'TA',
  antagna: 'Admitted/antagen student',
  unknown: 'UNKNOWN'
}

module.exports = {
  type,
  addDescription (msg) {
    const result = Object.assign({}, msg)
    if (result.ugClass === 'user') {
      result._desc = {
        type: type.user
      }
      return result
    }

    if (!result.ug1Name) {
      result._desc = {
        type: type.unknown
      }
      return result
    }

    const isTeacherRegExp = /edu\.courses\.\w{2,3}\.\w{6}\.\d{5}\.\d\.\bteachers\b/
    const isAssistantsRegExp = /edu\.courses\.\w{2,3}\.\w{6}\.\d{5}\.\d\.\bassistants\b/
    const isCourseResponsibleRegExp = /edu\.courses\.\w{2,3}\.\w{6}\.\d{5}\.\d\.\bcourseresponsible\b/
    const isStudentsRegExp = /ladok2\.kurser.\w{2,3}\.\w{4}.registrerade_\d{5}\.\d/
    const isOmregRegexp = /ladok2\.kurser.\w{2,3}\.\w{4}.omregistrerade_\d{5}/
    const isAntagnaRegexp = /ladok2\.kurser.\w{2,3}\.\w{4}.antagna_\d{5}.\d/
    const isStaff = /app\.katalog3.\w/

    if (result.ug1Name.match(isTeacherRegExp)) {
      result._desc = {
        type: type.course,
        userType: type.teachers
      }
    } else if (result.ug1Name.match(isAssistantsRegExp)) {
      result._desc = {
        type: type.course,
        userType: type.assistants
      }
    } else if (result.ug1Name.match(isCourseResponsibleRegExp)) {
      result._desc = {
        type: type.course,
        userType: type.courseresponsibles
      }
    } else if (result.ug1Name.match(isStudentsRegExp)) {
      result._desc = {
        type: type.course,
        userType: type.students
      }
    } else if (result.ug1Name.match(isOmregRegexp)) {
      result._desc = {
        type: type.course,
        userType: type.omregistrerade
      }
    } else if (result.ug1Name.match(isAntagnaRegexp)) {
      result._desc = {
        type: type.course,
        userType: type.antagna
      }
    } else if (result.ug1Name.match(isStaff)) {
      result._desc = {
        type: type.staff,
        userType: type.students
      }
    } else {
      result._desc = {
        type: type.unknown
      }
    }
    return result
  }
}
