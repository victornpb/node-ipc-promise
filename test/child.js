var IPC = require('../lib/ipc');
var ipc = IPC();

var http = require('http');
var server = http.createServer();
server.listen(0);

var listening;
var getPort = function () {
  if (!listening) {
    listening = new Promise(function (resolve, reject) {
      if (server.listening) {
        return resolve(server.address().port);
      } else {
        server.once('listening', function () {
          return resolve(server.address().port);
        });
        server.once('error', function (e) {
          return reject(e);
        });
      }
    });
  }
  return listening;
};

ipc.register('port', getPort);
