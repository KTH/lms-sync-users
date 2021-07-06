const moment = require("moment");
let _idleTimeStart = moment();

module.exports = {
  setIdleTimeStart() {
    _idleTimeStart = moment();
  },
  get idleTimeStart() {
    return _idleTimeStart;
  },
};
