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
      dumpDir: 'database',
      ignoreTables: [],
      local: {},
      remote: {},
      shell: {},
    });

    //
    // The different paths we're backing up to
    //
    shipit.db = {

      // Our local folder holding a remote DB
      localRemoteDumpDir: path.join(shipit.config.db.dumpDir, shipit.environment),

      // Our local folder holding our local DB
      localDumpDir: path.join(shipit.config.db.dumpDir, "local"),

      // A remote folder holding our remote DB
      remoteDumpDir: path.join(shipit.sharedPath || shipit.currentPath, shipit.config.db.dumpDir, shipit.environment),

      // A remote folder holdin gour local DB
      remoteLocalDumpDir: path.join(shipit.sharedPath || shipit.currentPath, shipit.config.db.dumpDir, "local"),

    };

    shipit.emit('db');

    return shipit;
  };

  utils.registerTask(gruntOrShipit, 'db:init', task);

};
