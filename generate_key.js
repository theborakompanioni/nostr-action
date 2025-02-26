
const { generateSecretKey, getPublicKey } = require('nostr-tools')
const { bytesToHex } = require('@noble/hashes/utils')

const privateKey = generateSecretKey();
const privateKeyHex = bytesToHex(privateKey)
const publicKeyHex = getPublicKey(privateKey);

console.info(`Private key: ${privateKeyHex}`)
console.info(`Public key: ${publicKeyHex}`)
