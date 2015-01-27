var registerTask = require('../../lib/register-task');
var getShipit = require('../../lib/get-shipit');
// var chalk = require('chalk');
var sprintf = require('sprintf-js').sprintf;
var path = require('path');
var moment = require('moment');

module.exports = function (gruntOrShipit) {
  var shipit = getShipit(gruntOrShipit);
  registerTask(gruntOrShipit, 'db:pull', task);

  function task() {
    var from = 'remote';
    var to = 'local';

    function outputFile() {
      return path.join(
        shipit.config.db.dumpDir,
        sprintf('%(database)s_%(currentTime)s.sql.bz2', {
          database: 'dbname',
          currentTime: moment.utc().format('YYYYMMDDHHmmss'),
        })
      );
    }

    function dumpCmd() {
      return sprintf('mysqldump %(credentials)s %(database)s --lock-tables=false', {
        credentials: '',
        datbase: ''
      });
    }

    function importCmd(file) {
      return sprintf('mysql %(credentials)s -D %(database)s < %(file)s', {
        credentials: '',
        database: '',
        file: file
      });
    }

    function dump() {
      return shipit.remote('%(dumpCmd)s | bzip2 - - > %(outputFile)s', {
        dumpCmd: dumpCmd(),
        outputFile: outputFile(),
      });
    }

    function download() {
      return shipit.localCopy();
    }

    function clean() {
      return shipit.remote('');
    }

    function load(file, cleanup) {
      return shipit.remote(sprintf('bunzip2 -f %(file)s.bz2 && %(importCmd)s', {
        file: file,
        importCmd: importCmd(file)
      })).then(function () {
        if (cleanup) {
          shipit.local('rm ' + file);
        }
      });
    }

    return dump()
    .then(download())
    .then(clean())
    .then(load());
  }
};
