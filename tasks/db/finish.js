var utils = require('shipit-utils');
var db = require('../../lib/db');

/**
 * Finish task.
 * - Emit an event "dbFinish".
 */

module.exports = function (gruntOrShipit) {
  utils.registerTask(gruntOrShipit, 'db:finish', task);

  function task() {
    var shipit = db(utils.getShipit(gruntOrShipit));
    shipit.emit('dbFinish');
    return shipit;
  }
};
