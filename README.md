# shipit-db

A set of database tasks for [Shipit](https://github.com/shipitjs/shipit).

**Features:**

- Works via [shipit-cli](https://github.com/shipitjs/shipit) and [grunt-shipit](https://github.com/shipitjs/grunt-shipit)
- Optionally ignore specified tables

**Roadmap**

- DB Backup tasks

## Install

```
npm install shipit-db
```

## Usage

### Example `shipitfile.js`

```js
module.exports = function (shipit) {
  require('shipit-shared')(shipit);

  shipit.initConfig({
    default: {
      db: {
        ignoreTables: ['some_table'],
        local: {
          host     : 'localhost',
          adapter  : 'mysql',
          username : 'root',
          password : 'root',
          socket   : '/Applications/MAMP/tmp/mysql/mysql.sock',
          database : 'mysite_local',
        },
      }
    },
    staging: {
      servers: 'user@myserver.com',
      remote: {
        host     : '127.0.0.1',
        adapter  : 'mysql',
        username : 'myusername',
        password : '123password',
        database : 'mysite_staging',
      }
    }
  });
};
```

Dump your local database, upload and import to remote:

```
shipit staging db:push
```

Dump your remote database, download and import to local:

```
shipit staging db:pull
```

## Options (`shipit.config.db`)

### `db.ignoreTables`

Type: `Array`

An array of database tables to ignore.

### `db.local` \ `db.remote`

Type: `Object`

An object of database credentials.

## License

MIT
