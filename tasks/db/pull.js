/* jshint unused:false */
var registerTask = require('../../lib/register-task');
var getShipit = require('../../lib/get-shipit');
var chalk = require('chalk');
var sprintf = require('sprintf-js').sprintf;
var path = require('path');
var moment = require('moment');
var _ = require('lodash');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');

module.exports = function (gruntOrShipit) {
  registerTask(gruntOrShipit, 'db-pull', task);

  function task() {
    var from = 'remote';
    var to = 'local';
    var shipit = getShipit(gruntOrShipit);

    var dbConfig = _.defaults(shipit.config.db, {
      dumpDir: 'db',
      cleanLocal: true,
      cleanRemote: true,
    });

    shipit.currentPath = path.join(shipit.config.deployTo, 'current');
    shipit.sharedPath = path.join(shipit.config.deployTo, 'shared');
    var remoteDumpFilePath = path.join(shipit.currentPath, dumpFile());
    var localDumpFilePath = path.join(shipit.config.workspace, dumpFile());

    // dbConfig[from].username = dbConfig[from].username || dbConfig[from].user;
    // dbConfig[to].username = dbConfig[to].username || dbConfig[to].user;

    return dump()
    .then(download())
    .then(clean())
    .then(load(localDumpFilePath))
    ;

    function dumpFile() {
      return path.join(
        dbConfig.dumpDir,
        sprintf('%(database)s-%(currentTime)s.sql.bz2', {
          database: dbConfig[from].database,
          currentTime: moment.utc().format('YYYYMMDDHHmmss'),
        })
      );
    }

    function credentialParams(dbConfig) {
      var params = {
        '-u': dbConfig.username || null,
        '-p': dbConfig.password || null,
        '-h': dbConfig.host || null,
        '-S': dbConfig.socket || null,
        '-P': dbConfig.port || null,
      };

      var paramStr = Object.keys(params).map(function(key) {
        return (params[key]) ? key + "'" + params[key] + "'" : false;
      }).filter(function(elem) {
        return !!elem;
      });
      return paramStr.join(' ');
    }

    function dumpCmd() {
      return sprintf('mysqldump %(credentials)s %(database)s --lock-tables=false', {
        credentials: credentialParams(dbConfig.remote),
        database: dbConfig.remote.database,
      });
    }

    function importCmd(file) {
      return sprintf('mysql %(credentials)s -D %(database)s < %(file)s', {
        credentials: credentialParams(dbConfig.local),
        database: dbConfig.local.database,
        file: file,
      });
    }

    function dump() {
      return shipit.remote(
        sprintf('%(dumpCmd)s | bzip2 - - > %(dumpFile)s', {
          dumpCmd: dumpCmd(),
          dumpFile: path.join(shipit.currentPath, dumpFile()),
        }
      ));
    }

    function download() {
      // return shipit.localCopy(remoteDumpFilePath, localDumpFilePath);
      var ignores = shipit.config && shipit.config.ignores ? shipit.config.ignores : [];

      return Promise.promisify(mkdirp)(path.dirname(localDumpFilePath))
      .then(shipit.pool.copy(remoteDumpFilePath, localDumpFilePath, {
        ignores: ignores, direction: 'remoteToLocal'
      }));
    }

    function clean() {
      // return shipit.remote('rm -f ' + localDumpFilePath);
    }

    function load(file) {
      return shipit.local(sprintf('bunzip2 -f %(file)s && %(importCmd)s', {
        file: file,
        importCmd: importCmd(file)
      }));
    }
  }
};
