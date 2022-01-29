"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.queryName = queryName;
exports.searchDomain = searchDomain;

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function searchDomain(domain, query = '') {
  try {
    let res = await (await (0, _crossFetch.default)(`https://${domain}/.well-known/nostr.json?name=${query}`)).json();
    return res.names;
  } catch (_) {
    return [];
  }
}

async function queryName(fullname) {
  try {
    let [name, domain] = fullname.split('@');

    if (!domain) {
      domain = name;
      name = '_';
    }

    let res = await (await (0, _crossFetch.default)(`https://${domain}/.well-known/nostr.json?name=${name}`)).json();
    return res.names && res.names[name];
  } catch (_) {
    return null;
  }
}