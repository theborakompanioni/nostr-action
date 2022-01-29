"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decrypt = decrypt;
exports.encrypt = encrypt;

var _browserifyCipher = _interopRequireDefault(require("browserify-cipher"));

var _buffer = require("buffer");

var _utils = require("@noble/hashes/utils");

var secp256k1 = _interopRequireWildcard(require("@noble/secp256k1"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function encrypt(privkey, pubkey, text) {
  const key = secp256k1.getSharedSecret(privkey, '02' + pubkey);
  const normalizedKey = getNormalizedX(key);
  let iv = Uint8Array.from((0, _utils.randomBytes)(16));

  var cipher = _browserifyCipher.default.createCipheriv('aes-256-cbc', _buffer.Buffer.from(normalizedKey, 'hex'), iv);

  let encryptedMessage = cipher.update(text, 'utf8', 'base64');
  encryptedMessage += cipher.final('base64');
  return `${encryptedMessage}?iv=${_buffer.Buffer.from(iv.buffer).toString('base64')}`;
}

function decrypt(privkey, pubkey, ciphertext) {
  let [cip, iv] = ciphertext.split('?iv=');
  let key = secp256k1.getSharedSecret(privkey, '02' + pubkey);
  let normalizedKey = getNormalizedX(key);

  var decipher = _browserifyCipher.default.createDecipheriv('aes-256-cbc', _buffer.Buffer.from(normalizedKey, 'hex'), _buffer.Buffer.from(iv, 'base64'));

  let decryptedMessage = decipher.update(cip, 'base64');
  decryptedMessage += decipher.final('utf8');
  return decryptedMessage;
}

function getNormalizedX(key) {
  return typeof key === 'string' ? key.substr(2, 64) : _buffer.Buffer.from(key.slice(1, 33)).toString('hex');
}