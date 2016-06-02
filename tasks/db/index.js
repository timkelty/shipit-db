var utils = require('shipit-utils');

/**
 * Database tasks.
 */

module.exports = function(gruntOrShipit) {
  require('./init')(gruntOrShipit);
  require('./pull')(gruntOrShipit);
  require('./push')(gruntOrShipit);
  require('./finish')(gruntOrShipit);

  utils.registerTask(gruntOrShipit, 'db:pull', [
    'db:init',
    'db:pull:task',
    'db:finish',
  ]);

  utils.registerTask(gruntOrShipit, 'db:push', [
    'db:init',
    'db:push:task',
    'db:finish',
  ]);
};
