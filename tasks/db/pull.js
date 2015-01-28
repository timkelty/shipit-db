/* jshint unused:false */
var registerTask = require('../../lib/register-task');
var getShipit = require('../../lib/get-shipit');
var path = require('path');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var db = require('../../lib/db');

module.exports = function (gruntOrShipit) {
  registerTask(gruntOrShipit, 'db-pull', task);

  function task() {
    var shipit = getShipit(gruntOrShipit);
    var helper = db(shipit);
    shipit = helper.init();

    // dbConfig[from].username = dbConfig[from].username || dbConfig[from].user;
    // dbConfig[to].username = dbConfig[to].username || dbConfig[to].user;

    return helper.dump('remote')
    .then(helper.download())
    .then(helper.clean('remote'))
    .then(helper.load(shipit.db.localDumpFilePath), 'local')
    .then(helper.clean('local'));

    function download() {
      return Promise.promisify(mkdirp)(path.dirname(shipit.db.localDumpFilePath)).then(function() {
        return shipit.remoteCopy(shipit.db.remoteDumpFilePath, shipit.db.localDumpFilePath, {
          direction: 'remoteToLocal'
        });
      });
    }
  }
};
