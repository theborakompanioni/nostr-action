"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBlankEvent = getBlankEvent;
exports.getEventHash = getEventHash;
exports.serializeEvent = serializeEvent;
exports.signEvent = signEvent;
exports.validateEvent = validateEvent;
exports.verifySignature = verifySignature;

var _buffer = require("buffer");

var _createHash = _interopRequireDefault(require("create-hash"));

var secp256k1 = _interopRequireWildcard(require("@noble/secp256k1"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getBlankEvent() {
  return {
    kind: 255,
    pubkey: null,
    content: '',
    tags: [],
    created_at: 0
  };
}

function serializeEvent(evt) {
  return JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]);
}

function getEventHash(event) {
  let eventHash = (0, _createHash.default)('sha256').update(_buffer.Buffer.from(serializeEvent(event))).digest();
  return _buffer.Buffer.from(eventHash).toString('hex');
}

function validateEvent(event) {
  if (event.id !== getEventHash(event)) return false;
  if (typeof event.content !== 'string') return false;
  if (typeof event.created_at !== 'number') return false;
  if (!Array.isArray(event.tags)) return false;

  for (let i = 0; i < event.tags.length; i++) {
    let tag = event.tags[i];
    if (!Array.isArray(tag)) return false;

    for (let j = 0; j < tag.length; j++) {
      if (typeof tag[j] === 'object') return false;
    }
  }

  return true;
}

function verifySignature(event) {
  return secp256k1.schnorr.verify(event.sig, event.id, event.pubkey);
}

async function signEvent(event, key) {
  return secp256k1.schnorr.sign(getEventHash(event), key);
}