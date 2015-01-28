/* jshint unused:false */
var registerTask = require('../../lib/register-task');
var getShipit = require('../../lib/get-shipit');
var path = require('path');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var db = require('../../lib/db');

module.exports = function (gruntOrShipit) {
  registerTask(gruntOrShipit, 'db-push', task);

  function task() {
    var shipit = getShipit(gruntOrShipit);
    var helper = db(shipit);
    shipit = helper.init();

    return helper.dump('local')
    .then(helper.upload())
    .then(helper.clean('local'))
    .then(helper.load(shipit.db.remoteDumpFilePath, 'remote'))
    .then(helper.clean('local'));

    function upload() {
      return shipit.remote('mkdir -p').then(function() {
        return shipit.remoteCopy(shipit.db.localDumpFilePath, shipit.db.remoteDumpFilePath);
      });
    }
  }
};
