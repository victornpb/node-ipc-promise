var TOKEN = 'NODE_IPC_PROMISE_AIHORN_MAC';

module.exports.TOKEN = TOKEN;

function stringifyError (error) {
  var obj = {};
  var names = Object.getOwnPropertyNames(error);
  var i;
  for (i in names) {
    obj[i] = error[i];
  }
  return obj;
}

module.exports.stringifyError = stringifyError;

var chars = '0123456789';
var charsLen = chars.length;
function genRandom (len) {
  var i, j, str = '';
  for (i = 0; i < len; i++) {
    j = Math.floor(charsLen * Math.random());
    str += chars[j];
  }
  return str;
}

function generateKey () {
  var str = '';
  str += new Date().getTime();
  str += genRandom(6);
  return str;
}

module.exports.generateKey = generateKey;

function makeRequest (name, args) {
  args = Array.isArray(args) ? args : [];
  var cmd = {
    type: 'request',
    key: generateKey(),
    name: name,
    args: args
  };
  cmd[TOKEN] = true;
  return cmd;
}

module.exports.makeRequest = makeRequest;

function makeResult (key, error, result) {
  var cmd = {
    type: 'result',
    key: key
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
  var e = {};
  var keys = Object.keys(error);
  keys = Array.prototype.push.apply(keys, Object.getOwnPropertyNames(error));
  for (var i in keys) {
    var key = keys[i];
    e[key] = error[key];
  }
  return e;
}

module.exports.serializeError = serializeError;

function unserializeError (e) {
  var error = new Error();
  for (var i in e) {
    error[i] = e[i];
  }
  return error;
}

module.exports.unserializeError = unserializeError;

function getPropertyHost (object, name) {
  var obj = object;
  while (obj && !Object.hasOwnProperty(obj, name)) {
    obj = obj.__proto__;
  }
  if (!obj) return false;
  return obj;
}

module.exports.getPropertyHost = getPropertyHost;

function getPropertyDescriptor (object, name) {
  var obj = getPropertyHost(object, name);
  return Object.getPropertyDescriptor(obj, name);
}

module.exports.getPropertyDescriptor = getPropertyDescriptor;
