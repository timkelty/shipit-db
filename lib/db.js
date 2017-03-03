var path = require('path');
var moment = require('moment');
var sprintf = require('sprintf-js').sprintf;
var mkdirp = require('mkdirp');
var Promise = require('bluebird');

module.exports = function(shipit) {
  shipit.db = shipit.db || {};

  shipit.db.createDirs = function createDirs() {
    return Promise.promisify(mkdirp)(shipit.db.localDumpDir).then(function() {
      return shipit.remote('mkdir -p ' + shipit.db.remoteDumpDir);
    });
  };

  shipit.db.dumpFile = function dumpFile(environment) {
    return path.join(
      shipit.config.db.dumpDir,
      sprintf('%(database)s-%(currentTime)s.sql.bz2', {
        database: shipit.config.db[environment].database,
        currentTime: moment.utc().format('YYYYMMDDHHmmss'),
      })
    );
  };

  shipit.db.credentialParams = function credentialParams(dbConfig) {
    var params = {
      '-u': dbConfig.username || null,
      '-p': dbConfig.password || null,
      '-h': dbConfig.host || null,
      '-S': dbConfig.socket || null,
      '-P': dbConfig.port || null,
    };

    var paramStr = Object.keys(params).map(function(key) {
      return (params[key]) ? key + '\'' + params[key] + '\'' : false;
    }).filter(function(elem) {
      return !!elem;
    });

    return paramStr.join(' ');
  };

  shipit.db.ignoreTablesArgs = function ignoreTablesArgs(environment) {

    // TODO: ignoreTables should be per-env
    var args = shipit.config.db.ignoreTables.map(function(table) {
      table = table.match(/\./) ? table : [shipit.config.db[environment].database, table].join('.');

      return '--ignore-table=' + table;
    });

    return args.join(' ');
  };

  shipit.db.dumpCmd = function dumpCmd(environment) {
    return sprintf('mysqldump %(credentials)s %(database)s --lock-tables=false %(ignoreTablesArgs)s', {
      credentials: shipit.db.credentialParams(shipit.config.db[environment]),
      database: shipit.config.db[environment].database,
      ignoreTablesArgs: shipit.db.ignoreTablesArgs(environment)
    });
  };

  shipit.db.importCmd = function importCmd(environment, file) {
    return sprintf('mysql %(credentials)s -D %(database)s < %(file)s', {
      credentials: shipit.db.credentialParams(shipit.config.db[environment]),
      database: shipit.config.db[environment].database,
      file: path.join(path.dirname(file), path.basename(file, '.bz2')),
    });
  };

  shipit.db.createCmd = function createCmd(environment) {
    return sprintf("mysql %(credentials)s --execute 'CREATE DATABASE IF NOT EXISTS \`%(database)s\`;'", {
      credentials: shipit.db.credentialParams(shipit.config.db[environment]),
      database: shipit.config.db[environment].database,
    });
  };

  shipit.db.unzipCmd = function(file) {
    if (shipit.config.db.shell.unzip) {
      return shipit.config.db.shell.unzip.call(shipit, file);
    }

    return sprintf('bunzip2 -f %(file)s', {
      file: file,
    });
  };

  shipit.db.zipCmd = function(file) {
    if (shipit.config.db.shell.zip) {
      return shipit.config.db.shell.zip.call(shipit, file);
    }

    return shipit.config.db.shell.zip || sprintf('bzip2 - - > %(dumpFile)s', {
      dumpFile: file,
    });
  };

  shipit.db.dump = function dump(environment, file) {
    if (shipit.config.db.shell.dump) {
      return shipit.config.db.shell.dump.call(shipit, environment, file);
    }

    return shipit[environment](
      sprintf('%(dumpCmd)s | %(zipCmd)s', {
        dumpCmd: shipit.db.dumpCmd(environment),
        zipCmd: shipit.db.zipCmd(file),
      })
    );
  };

  shipit.db.load = function load(environment, file) {
    if (shipit.config.db.shell.load) {
      return shipit.config.db.shell.load.call(shipit, environment, file);
    }

    var cmd = sprintf('%(unzipCmd)s && %(createCmd)s && %(importCmd)s', {
      unzipCmd: shipit.db.unzipCmd(file),
      importCmd: shipit.db.importCmd(environment, file),
      createCmd: shipit.db.createCmd(environment)
    });

    return shipit[environment](cmd);
  };

  shipit.db.clean = function clean(environment, path, enabled) {
    if (shipit.config.db.shell.clean) {
      return shipit.config.db.shell.clean.call(shipit, environment, path, enabled);
    }

    return enabled ? shipit[environment]('rm -f ' + path) : Promise.resolve();
  };

  return shipit;
};
