"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateSeedWords = generateSeedWords;
exports.privateKeyFromSeed = privateKeyFromSeed;
exports.seedFromWords = seedFromWords;
exports.validateWords = validateWords;

var _english = require("micro-bip39/wordlists/english");

var _microBip = require("micro-bip39");

var _microBip2 = require("micro-bip32");

function privateKeyFromSeed(seed) {
  let root = _microBip2.HDKey.fromMasterSeed(Buffer.from(seed, 'hex'));

  return Buffer.from(root.derive(`m/44'/1237'/0'/0/0`).privateKey).toString('hex');
}

function seedFromWords(mnemonic) {
  return Buffer.from((0, _microBip.mnemonicToSeedSync)(mnemonic)).toString('hex');
}

function generateSeedWords() {
  return (0, _microBip.generateMnemonic)(_english.wordlist);
}

function validateWords(words) {
  return (0, _microBip.validateMnemonic)(words, _english.wordlist);
}