var _ = require('lodash');
var path = require('path');
var moment = require('moment');
var sprintf = require('sprintf-js').sprintf;
var mkdirp = require('mkdirp');
var Promise = require('bluebird');

module.exports = function(shipit) {
  // Ask Karl - constructor?
  // init();
  var init = function init() {
    shipit.currentPath = path.join(shipit.config.deployTo, 'current');
    shipit.sharedPath = path.join(shipit.config.deployTo, 'shared');
    shipit.config.db = getConfig();
    shipit.localDumpDir = path.join(shipit.config.workspace, shipit.config.db.dumpDir);
    shipit.remoteDumpDir = path.join(shipit.sharedPath || shipit.currentPath, shipit.config.db.dumpDir);
    return shipit;
  };

  var createDirs = function createDirs() {
    return Promise.promisify(mkdirp)(shipit.localDumpDir).then(function() {
      return shipit.remote('mkdir -p ' + shipit.remoteDumpDir);
    });
  };

  var getConfig = function getConfig() {
    return _.defaults(shipit.config.db, {
      dumpDir: 'db',
      cleanLocal: true,
      cleanRemote: true,
    });
  };

  var dumpFile = function dumpFile(environment) {
    return path.join(
      shipit.config.db.dumpDir,
      sprintf('%(database)s-%(currentTime)s.sql.bz2', {
        database: shipit.config.db[environment].database,
        currentTime: moment.utc().format('YYYYMMDDHHmmss'),
      })
    );
  };

  var credentialParams = function credentialParams(dbConfig) {
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
  };

  var dumpCmd = function dumpCmd(environment) {
    return sprintf('mysqldump %(credentials)s %(database)s --lock-tables=false', {
      credentials: credentialParams(shipit.config.db[environment]),
      database: shipit.config.db[environment].database,
    });
  };

  var importCmd = function importCmd(file, environment) {
    return sprintf('mysql %(credentials)s -D %(database)s < %(file)s', {
      credentials: credentialParams(shipit.config.db[environment]),
      database: shipit.config.db[environment].database,
      file: path.join(path.dirname(file), path.basename(file, '.bz2')),
    });
  };

  var dump = function dump(environment, file) {
    return shipit[environment](
      sprintf('%(dumpCmd)s | bzip2 - - > %(dumpFile)s', {
        dumpCmd: dumpCmd(environment),
        dumpFile: file,
      })
    );
  };

  var load = function load(file, environment) {
    var cmd = sprintf('bunzip2 -f %(file)s && %(importCmd)s', {
      file: file,
      importCmd: importCmd(file, environment)
    });
    return shipit[environment](cmd);
  };

  var clean = function clean(path, environment, enabled) {
    if (enabled) {
      return shipit[environment]('rm -f ' + path);
    }
  };

  return {
    init: init,
    dump: dump,
    load: load,
    clean: clean,
    dumpFile: dumpFile,
    createDirs: createDirs,
  };
};
