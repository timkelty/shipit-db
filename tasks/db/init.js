var utils = require('shipit-utils');
var path = require('path2/posix');
var _ = require('lodash');

/**
 * Init task.
 * - Emit deploy event.
 */

module.exports = function (gruntOrShipit) {
  utils.registerTask(gruntOrShipit, 'db:init', task);

  function task() {
    var shipit = utils.getShipit(gruntOrShipit);

    shipit.currentPath = path.join(shipit.config.deployTo, 'current');
    shipit.sharedPath = path.join(shipit.config.deployTo, 'shared');
    shipit.config.db = _.defaults(shipit.config.db || {}, {
      dumpDir: 'db',
      cleanLocal: true,
      cleanRemote: true,
      ignoreTables: [],
      local: {},
      remote: {}
    });
    shipit.localDumpDir = path.join(shipit.config.workspace, shipit.config.db.dumpDir);
    shipit.remoteDumpDir = path.join(shipit.sharedPath || shipit.currentPath, shipit.config.db.dumpDir);
    shipit.emit('db');

    return shipit;
  }
};
