# node-ipc-promise

A Node.js tool for ipc in promise style
* es5 compatibility (Promise and Collections polyfill)
* not affecting other ipc

## basic usage
The following codes are a simple example in one file,
you can just copy, paste and run to have a look at the functionalities.
```js
var IPC = require('../lib/ipc');
var ipc;

if (process.env.isChild) {
  ipc = IPC();

  ipc.register('hi', function () {
    return new Promise(function (resolve) {
      resolve('hey');
      console.log('I love you');
      ipc.exec('I love you').then(function (result) {
        console.log(result);
      }).catch(function (e) {
        console.error(e);
      });
    });
  });

  process.on('message', function (m) {
    console.log(m);
  });

} else {
  var child_process = require('child_process');

  var env = {};
  var i;
  for (i in process.env) {
    env[i] = process.env[i];
  }
  env.isChild = true;

  var child = child_process.fork(__filename, {
    env: env
  });

  ipc = IPC(child);

  ipc.register('I love you', function () {
    return new Promise(function (resolve) {
      resolve('me too~');
    });
  });

  console.log('hi');
  ipc.exec('hi').then(function (result) {
    console.log(result);
  }).catch(function (e) {
    console.error(e);
  });

  child.send('you can still use normal ipc');
}

```
the output may look like
```
hi
I love you
you can still use normal ipc
me too~
hey
```
it can also be coded in es6/es7 mode, which may output similar results
```js
const IPC = require('../lib/ipc');
const { fork } = require('child_process');

if (process.env.isChild) {
  let ipc = IPC();

  ipc.register('hi', async () => {
    console.log('hey');
    console.log('I love you');
    await ipc.exec('I love you');
  });

  process.on('message', function (m) {
    console.log(m);
  });

} else {

  let child = fork(__filename, {
    env: { ...process.env, isChild: true }
  });

  let ipc = IPC(child);

  ipc.register('I love you', async () => {
    console.log('me too~');
  });

  (async () => {

    console.log('hi');
    await ipc.exec('hi')

  })();

  child.send('you can still use normal ipc');
}
```
## APIs
```js
pc.exec(command[, arg1[, arg2, ...]]);
```
```js
ipc.register(command, handler);
```
```js
ipc.unregister(command);
```
```js
ipc.invade();
```
```js
ipc.restore();
```
