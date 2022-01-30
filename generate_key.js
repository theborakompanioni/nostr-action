
const nostr = require('./nostr-tools-commonjs')

const privateKeyHex = nostr.generatePrivateKey();
const publicKey = nostr.getPublicKey(privateKeyHex);
const publicKeyHex = Buffer.from(publicKey).toString('hex')

console.info(`Private key: ${privateKeyHex}`)
console.info(`Public key: ${publicKeyHex}`)
