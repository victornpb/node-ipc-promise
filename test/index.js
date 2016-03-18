describe('IPC unit test', function () {

  var child_process = require('child_process');
  var IPC = require('../lib/ipc');

  it('should return port', function (done) {
    var child = child_process.fork(__dirname + '/child');
    var ipc = IPC(child);
    ipc.exec('port').then(function (port) {
      port.should.be.a.number;
      done();
    });
  });

  // it('should throw error', function (done) {
  //   var child = child_process.fork(__dirname + '/child-80');
  //   var ipc = IPC(child);
  //   ipc.exec('port').then(function (port) {
  //     port.should.be.a.number;
  //     done();
  //   });
  // });

});
