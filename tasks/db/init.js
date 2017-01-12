var utils = require('shipit-utils');
var path = require('path2/posix');
var _ = require('lodash');
var chalk = require('chalk');

/**
 * Init task.
 * - Emit deploy event.
 */

module.exports = function(gruntOrShipit) {
  var task = function task() {
    var shipit = utils.getShipit(gruntOrShipit);
    if (!shipit.config.deployTo || typeof shipit.config.deployTo !== "string") {
      shipit.log(chalk.red('Cannot initialize (db:init), as deployTo isn\'t specified in the config!'));
      return;
    }
    shipit.currentPath = path.join(shipit.config.deployTo, 'current');
    shipit.sharedPath = path.join(shipit.config.deployTo, 'shared');
    shipit.config.db = _.defaults(shipit.config.db || {}, {
      dumpDir: 'db',
      cleanLocal: true,
      cleanRemote: true,
      ignoreTables: [],
      local: {},
      remote: {},
      shell: {},
    });

    shipit.db = {
      localDumpDir: path.join(shipit.config.workspace, shipit.config.db.dumpDir),
      remoteDumpDir: path.join(shipit.sharedPath || shipit.currentPath, shipit.config.db.dumpDir),
    };

    shipit.emit('db');

    return shipit;
  };

  utils.registerTask(gruntOrShipit, 'db:init', task);
};
