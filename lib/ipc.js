const utils = require('./utils');
const makeRequest = utils.makeRequest;
const makeResult = utils.makeResult;
const unserializeError = utils.unserializeError;
const getPropertyHost = utils.getPropertyHost;
const TOKEN = utils.TOKEN;

const ipcs = new Map();

function getIPC(proc = process) {
  let ipc = ipcs.get(proc);
  if (!ipc) {
    ipc = new IPC(proc);
    ipc.invade();
    ipcs.set(proc, ipc);
  }
  return ipc;
}

// define IPC
class IPC {
  constructor(proc) {
    Object.defineProperties(this, {
      _requests: { value: {} },
      _commands: { value: {} },
      _proc: { value: proc },
      _oldDescriptor: { writable: true },
      _getEmit: { value: getEmit.bind(this) },
      _setEmit: { value: setEmit.bind(this) },
      _newEmit: { value: emit.bind(this) }
    });
  }

  // (un)register responding functions
  register(cmd, func) {
    if ('string' !== typeof cmd)
      throw new TypeError('cmd name should be String');
    if ('function' !== typeof func)
      throw new TypeError('cmd should be Function');
    const commands = this._commands;
    if (commands[cmd])
      throw new Error(`command "${cmd}" has been registered`);
    commands[cmd] = func;
    return this;
  }

  unregister(cmd) {
    delete this._commands[cmd];
    return this;
  }

  // tell the other process to exec this
  exec(cmd) {
    if ('string' !== typeof cmd)
      throw new TypeError('cmd should be String');

    const proc = this._proc;

    // solve args
    const len = arguments.length;
    const args = new Array(len - 1);
    let i;
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    if (!proc.connected) {
      return Promise.reject(new Error('process is not connected'));
    }
    // generate request promise
    const request = {};
    const promise = new Promise(function (resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    }.bind(request));

    // make request
    const data = makeRequest(cmd, args);

    // add request to waiting
    this._requests[data.key] = request;

    // send request
    proc.send(data);

    return promise;
  }

  invade() {
    if (this._oldDescriptor) return;
    const proc = this._proc;
    let oldDescriptor;
    const newDescriptor = {
      get: this._getEmit,
      set: this._setEmit,
      configurable: true,
      enumerable: true
    };
    const host = getPropertyHost(proc, 'emit');

    if (host === proc) {
      oldDescriptor = Object.getOwnPropertyDescriptor(proc, 'emit');
    }
    if (oldDescriptor) {
      if (!oldDescriptor.configurable) {
        throw new Error('emit is not configurable');
      }
      newDescriptor.enumerable = oldDescriptor.enumerable;
    }

    this._oldDescriptor = oldDescriptor;
    Object.defineProperty(proc, 'emit', newDescriptor);
  }

  restore() {
    const descriptor = this._oldDescriptor;
    if (!descriptor) return;
    const proc = this._proc;
    delete proc.emit;
    if (this._oldDescriptor) {
      Object.defineProperty(proc, 'emit', descriptor);
    }
    if ('_assignEmit' in this) {
      proc.emit = this._assignEmit;
    }
  }
}

// hack into emit of process to prevent our requests from
// affecting others
function getEmit () {
  return this._newEmit;
}

function setEmit (value) {
  const descriptor = this._oldDescriptor;
  if (descriptor.writable || descriptor.set) {
    if (!('_assignEmit' in this)) {
      Object.defineProperty(this, '_assignEmit', { writable: true });
    }
    this._assignEmit = value;
  }
}

function emit (type, data) {
  if (type === 'message') {
    if (data && 'object' === typeof data) {
      if (data[TOKEN]) {
        // console.log(arguments);
        // when get here, it means the message is probably for us
        return IPCDispatch.call(this, data);
      }
    }
  }
  const target = this._proc.__proto__;
  return target.emit.apply(this._proc, arguments);
}

function IPCDispatch(data) {
  try {
    const type = data.type;
    const key = data.key;
    if (type === 'result') {
      const requests = this._requests;
      const request = requests[key];
      if (!request) return false;
      delete requests[key];

      request.error = data.error;
      request.result = data.result;
      process.nextTick(dispatchResult.bind(request));

      return true;
    } else if (type === 'request') {
      const proc = this._proc;
      try {
        const name = data.name;
        const command = this._commands[name];
        if (!command) throw new Error(`command '${name}' not found'`);

        Promise.resolve(command(...data.args))
        .catch(sendResponse.bind(proc, key))
        .then(sendResponse.bind(proc, key, null));

        return true;
      } catch (e) {
        sendResponse.call(proc, key, e);
        throw e;
      }
    }
  } catch (e) {
    console.error(e.stack || e);
  }
  return false;
}

function dispatchResult () {
  if (this.error) {
    this.reject(unserializeError(this.error));
  } else {
    this.resolve(this.result);
  }
}

function sendResponse (key, error, result) {
  const data = makeResult(key, error, result);
  if (!this.connected) { return; } // Process has died, skip send response
  this.send(data);
}

module.exports = getIPC;
