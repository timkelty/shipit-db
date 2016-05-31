var utils = require('shipit-utils');
var path = require('path');
var db = require('../../lib/db');

module.exports = function(gruntOrShipit) {
  var task = function task() {
    var shipit = db(utils.getShipit(gruntOrShipit));
    var remoteDumpFilePath = path.join(shipit.sharedPath || shipit.currentPath, shipit.db.dumpFile('local'));
    var localDumpFilePath = path.join(shipit.config.workspace, shipit.db.dumpFile('local'));
    var upload = function upload() {
      return shipit.remoteCopy(localDumpFilePath, remoteDumpFilePath);
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
      return shipit.db.load('remote', remoteDumpFilePath);
    })
    .then(function() {
      return shipit.db.clean('remote', remoteDumpFilePath, shipit.config.db.cleanRemote);
    });
  };

  utils.registerTask(gruntOrShipit, 'db:push:task', task);
};
