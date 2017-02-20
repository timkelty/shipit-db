var utils = require('shipit-utils');
var path = require('path');
var db = require('../../lib/db');

module.exports = function(gruntOrShipit) {
  var task = function task() {

    var shipit = db(utils.getShipit(gruntOrShipit));

    var localDumpFile = shipit.db.dumpFile("local");
    var localDumpFilePath = path.join(localDumpFile);
    var remoteLocalDumpFilePath = path.join(shipit.sharedPath || shipit.currentPath, localDumpFile);

    var remoteBackupDumpFile = shipit.db.dumpFile(shipit.environment);
    var remoteBackupFilePath = path.join(shipit.sharedPath || shipit.currentPath, remoteBackupDumpFile);
    var localRemoteBackupFilePath = path.join(remoteBackupDumpFile);

    var upload = function upload() {
      return shipit.remoteCopy(localDumpFilePath, remoteLocalDumpFilePath);
    };

    // Downloading the backup
    var download = function download() {
      return shipit.remoteCopy(remoteBackupFilePath, localRemoteBackupFilePath, {
        direction: 'remoteToLocal'
      });
    };

    return shipit.db.createDirs()
    .then(function() {
      return shipit.db.dump('local', localDumpFilePath);
    })
    .then(upload)
    .then(function() {
      return shipit.db.clean('local', localDumpFilePath, shipit.config.db.cleanLocal);
    })
    .then(function() {
      return shipit.db.dump('remote', remoteBackupFilePath);
    })
    .then(download)
    .then(function() {
      return shipit.db.load('remote', remoteLocalDumpFilePath);
    })
    .then(function() {
      return shipit.db.clean('remote', remoteLocalDumpFilePath, shipit.config.db.cleanRemote);
    });
  };

  utils.registerTask(gruntOrShipit, 'db:push:task', task);
};
