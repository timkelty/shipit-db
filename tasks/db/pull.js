var utils = require('shipit-utils');
var path = require('path');
var db = require('../../lib/db');

module.exports = function(gruntOrShipit) {
  var task = function task() {

    var shipit = db(utils.getShipit(gruntOrShipit));

    var remoteDumpFile = shipit.db.dumpFile(shipit.environment);
    var remoteDumpFilePath = path.join(shipit.sharedPath || shipit.currentPath, remoteDumpFile);
    var localRemoteDumpFilePath = path.join(remoteDumpFile);

    var localBackupDumpFile = shipit.db.dumpFile('local');
    var localBackupFilePath = path.join(localBackupDumpFile);

    // Method called to trigger the upload
    var download = function download() {
      return shipit.remoteCopy(remoteDumpFilePath, localRemoteDumpFilePath, {
        direction: 'remoteToLocal'
      });
    };

    // Note:
    // The updates we want to make are:
    //  - When a DB is being updated, we want to backup both databases.
    //  - So, before we upload or download, we should be backing up into the database directory
    //  - After that's been backedup, we can then upload and run whatever cleaning we need to.

    return shipit.db.createDirs()
    .then(function() {
      return shipit.db.dump('remote', remoteDumpFilePath);
    })
    .then(download)
    .then(function() {
      return shipit.db.clean('remote', remoteDumpFilePath, shipit.config.db.cleanRemote);
    })
    .then(function(){
      return shipit.db.dump('local', localBackupFilePath);
    })
    .then(function() {
      return shipit.db.load('local', localRemoteDumpFilePath);
    })
    .then(function() {
      return shipit.db.clean('local', localRemoteDumpFilePath, shipit.config.db.cleanLocal);
    });
  };

  utils.registerTask(gruntOrShipit, 'db:pull:task', task);
};
