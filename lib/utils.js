const TOKEN = 'NODE_IPC_PROMISE_AIHORN_MAC';

module.exports.TOKEN = TOKEN;

function stringifyError (error) {
  const obj = {};
  const names = Object.getOwnPropertyNames(error);
  let i;
  for (i in names) {
    obj[i] = error[i];
  }
  return obj;
}

module.exports.stringifyError = stringifyError;

const chars = '0123456789';
const charsLen = chars.length;
function genRandom (len) {
  let i;
  let j;
  let str = '';
  for (i = 0; i < len; i++) {
    j = Math.floor(charsLen * Math.random());
    str += chars[j];
  }
  return str;
}

function generateKey () {
  let str = '';
  str += new Date().getTime();
  str += genRandom(6);
  return str;
}

module.exports.generateKey = generateKey;

function makeRequest (name, args) {
  args = Array.isArray(args) ? args : [];
  const cmd = {
    type: 'request',
    key: generateKey(),
    name,
    args
  };
  cmd[TOKEN] = true;
  return cmd;
}

module.exports.makeRequest = makeRequest;

function makeResult (key, error, result) {
  const cmd = {
    type: 'result',
    key
  };
  if (error) {
    cmd.error = serializeError(error);
  } else {
    cmd.result = result;
  }
  cmd[TOKEN] = true;
  return cmd;
}

module.exports.makeResult = makeResult;


function serializeError (error) {
  const e = {};
  const keys = Object.getOwnPropertyNames(error);
  // keys = Array.prototype.push.apply(keys, Object.getOwnPropertyNames(error));
  for (const i in keys) {
    const key = keys[i];
    e[key] = error[key];
  }
  return e;
}

module.exports.serializeError = serializeError;

function unserializeError (e) {
  const error = new Error();
  for (const i in e) {
    error[i] = e[i];
  }
  return error;
}

module.exports.unserializeError = unserializeError;

function getPropertyHost (object, name) {
  let obj = object;
  while (obj && !Object.hasOwnProperty(obj, name)) {
    obj = obj.__proto__;
  }
  if (!obj) return false;
  return obj;
}

module.exports.getPropertyHost = getPropertyHost;

function getPropertyDescriptor (object, name) {
  const obj = getPropertyHost(object, name);
  return Object.getPropertyDescriptor(obj, name);
}

module.exports.getPropertyDescriptor = getPropertyDescriptor;
