var utils = require('shipit-utils');
var path = require('path');
var db = require('../../lib/db');

module.exports = function (gruntOrShipit) {
  utils.registerTask(gruntOrShipit, 'db:pull:task', task);

  function task() {
    var shipit = utils.getShipit(gruntOrShipit);
    var helper = db(shipit);
    var dumpFile = helper.dumpFile('remote');
    var remoteDumpFilePath = path.join(shipit.sharedPath || shipit.currentPath, dumpFile);
    var localDumpFilePath = path.join(shipit.config.workspace, dumpFile);

    var download = function download() {
      return shipit.remoteCopy(remoteDumpFilePath, localDumpFilePath, {
        direction: 'remoteToLocal'
      });
    };

    return helper.createDirs()
    .then(function() {
      return helper.dump('remote', remoteDumpFilePath);
    })
    .then(download)
    .then(function() {
      return helper.clean(remoteDumpFilePath, 'remote', shipit.config.db.cleanRemote);
    })
    .then(function() {
      return helper.load(localDumpFilePath, 'local');
    })
    .then(function() {
      return helper.clean(localDumpFilePath, 'local', shipit.config.db.cleanLocal);
    });
  }
};
