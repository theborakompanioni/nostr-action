
const { generateSecretKey, getPublicKey } = require('nostr-tools')
const nip19 = require('nostr-tools/nip19')
const { bytesToHex } = require('@noble/hashes/utils')

const privateKey = generateSecretKey()
const privateKeyHex = bytesToHex(privateKey)
const publicKeyHex = getPublicKey(privateKey)

console.info(`Private key (hex): ${privateKeyHex}`)
console.info(`Private key (nsec): ${nip19.nsecEncode(privateKey)}`)
console.info(`Public key (hex): ${publicKeyHex}`)
console.info(`Public key (npub): ${nip19.npubEncode(publicKeyHex)}`)
