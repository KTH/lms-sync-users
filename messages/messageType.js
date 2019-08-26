const Type = {
  USER: 'USER',
  COURSE: 'COURSE',
  UNKNOWN: 'UNKNOWN',
  STAFF: 'STAFF'
}

const UserType = {
  STUDENT: 'STUDENT',
  OMREGISTRERADE: 'Re-reg student',
  STAFF: 'STAFF',
  TEACHER: 'TEACHER',
  COURSE_RESPONSIBLE: 'Course Responsible',
  ASSISTANT: 'TA',
  ANTAGNA: 'Admitted/antagen student'
}

const CanvasRole = {
  [UserType.STUDENT]: {
    role: 'Student',
    role_id: 3
  },
  [UserType.OMREGISTRERADE]: {
    role: 'Re-reg student',
    role_id: 11
  },
  [UserType.TEACHER]: {
    role: 'Teacher',
    role_id: 4
  },
  [UserType.COURSE_RESPONSIBLE]: {
    role: 'Course Responsible',
    role_id: 9
  },
  [UserType.ASSISTANT]: {
    role: 'TA',
    role_id: 5
  },
  [UserType.ANTAGNA]: {
    role: 'Admitted not registered',
    role_id: 25
  }
}

module.exports = {
  Type,
  UserType,
  CanvasRole,
  addDescription (msg) {
    const result = Object.assign({}, msg)
    if (result.ugClass === 'user') {
      result._desc = {
        type: Type.USER
      }
      return result
    }

    if (!result.ug1Name) {
      result._desc = {
        type: Type.UNKNOWN
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
        type: Type.COURSE,
        userType: UserType.TEACHER
      }
    } else if (result.ug1Name.match(isAssistantsRegExp)) {
      result._desc = {
        type: Type.COURSE,
        userType: UserType.ASSISTANT
      }
    } else if (result.ug1Name.match(isCourseResponsibleRegExp)) {
      result._desc = {
        type: Type.COURSE,
        userType: UserType.COURSE_RESPONSIBLE
      }
    } else if (result.ug1Name.match(isStudentsRegExp)) {
      result._desc = {
        type: Type.COURSE,
        userType: UserType.STUDENT
      }
    } else if (result.ug1Name.match(isOmregRegexp)) {
      result._desc = {
        type: Type.COURSE,
        userType: UserType.OMREGISTRERADE
      }
    } else if (result.ug1Name.match(isAntagnaRegexp)) {
      result._desc = {
        type: Type.COURSE,
        userType: UserType.ANTAGNA
      }
    } else if (result.ug1Name.match(isStaff)) {
      result._desc = {
        type: Type.STAFF,
        userType: UserType.STUDENT
      }
    } else {
      result._desc = {
        type: Type.UNKNOWN
      }
    }
    return result
  }
}
