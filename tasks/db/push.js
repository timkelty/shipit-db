var registerTask = require('../../lib/register-task');
var getShipit = require('../../lib/get-shipit');
// var chalk = require('chalk');
// var sprintf = require('sprintf-js').sprintf;

module.exports = function (gruntOrShipit) {
  var shipit = getShipit(gruntOrShipit);
  registerTask(gruntOrShipit, 'db:pull', task);

  function task() {
  }
};
