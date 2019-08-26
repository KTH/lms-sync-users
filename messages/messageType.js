const Type = {
  USER: 'USER',
  COURSE: 'COURSE',
  UNKNOWN: 'UNKNOWN',
  STAFF: 'STAFF'
}

const USER_TYPE = {
  STUDENT: 'STUDENT',
  OMREGISTRERADE: 'Re-reg student',
  STAFF: 'STAFF',
  TEACHER: 'TEACHER',
  COURSE_RESPONSIBLE: 'Course Responsible',
  ASSISTANT: 'TA',
  ANTAGNA: 'Admitted/antagen student'
}

const CANVAS_ROLES = {
  [USER_TYPE.STUDENT]: {
    role: 'Student',
    role_id: 3
  }
}

module.exports = {
  Type,
  UserType,
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
        userType: userTypes.teachers
      }
    } else if (result.ug1Name.match(isAssistantsRegExp)) {
      result._desc = {
        type: type.course,
        userType: userTypes.assistants
      }
    } else if (result.ug1Name.match(isCourseResponsibleRegExp)) {
      result._desc = {
        type: type.course,
        userType: userTypes.courseresponsibles
      }
    } else if (result.ug1Name.match(isStudentsRegExp)) {
      result._desc = {
        type: type.course,
        userType: userTypes.students
      }
    } else if (result.ug1Name.match(isOmregRegexp)) {
      result._desc = {
        type: type.course,
        userType: userTypes.omregistrerade
      }
    } else if (result.ug1Name.match(isAntagnaRegexp)) {
      result._desc = {
        type: type.course,
        userType: userTypes.antagna
      }
    } else if (result.ug1Name.match(isStaff)) {
      result._desc = {
        type: type.staff,
        userType: userTypes.students
      }
    } else {
      result._desc = {
        type: type.unknown
      }
    }
    return result
  }
}
