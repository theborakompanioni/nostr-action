const wait = require('./wait')
const process = require('process')
const cp = require('child_process')
const path = require('path')

const parseActionOutputs = (result) => {
  return result.split('\n').filter((it) => it.startsWith('::set-output'))
  // now has form "::set-output name=<name>::<value>"
  .map((it) => it.substring('::set-output'.length).trimStart())
  // now has form "name=<name>::value"
  .map((it) => it.substring('name='.length).trimStart())
  .map((it) => [it.substring(0, it.indexOf('::')), it.substring(it.indexOf('::') + 2)])
}

test('throws invalid number', async () => {
  await expect(wait('foo')).rejects.toThrow('milliseconds not a number')
})

test('wait 500 ms', async () => {
  const start = new Date()
  await wait(500)
  const end = new Date()
  var delta = Math.abs(end - start)
  expect(delta).toBeGreaterThanOrEqual(500)
})

const NOW = Date.now()

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_DRY'] = true
  // test key taken from https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vector-4
  process.env['INPUT_KEY'] = '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678'
  process.env['INPUT_RELAY'] = 'wss://relay.damus.io'
  process.env['INPUT_CONTENT'] = 'test'
  
  const ip = path.join(__dirname, 'index.js')
  const result = cp.execSync(`node ${ip}`, { env: process.env }).toString()
  console.log(result)

  const outputs = parseActionOutputs(result)

  const events = outputs.filter(([key]) => key === 'event').map((([_, val]) => val))
  expect(events.length).toBe(1)

  const event = JSON.parse(events[0])
  console.log(event)

  expect(event.kind).toBe(1)
  expect(event.pubkey).toBe('17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4')
  expect(event.created_at).toBeGreaterThanOrEqual(Math.floor(NOW / 1_000))
  expect(event.tags).toEqual([])
  expect(event.content).toBe('test')
  expect(event.sig.length).toBe(128)
})

// shows how the runner will run a javascript action with env / stdout protocol
test('test template input', () => {
  process.env['INPUT_DRY'] = true
  // test key taken from https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vector-4
  process.env['INPUT_KEY'] = '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678'
  process.env['INPUT_RELAY'] = 'wss://nostr-pub.wellorder.net'
  process.env['INPUT_TEMPLATE'] = JSON.stringify({
    kind: 42,
    tags: [
      ['expiration', '1600000000']
    ],
    content: 'this should be replaced by the `INPUT_CONTENT` args'
  })
  process.env['INPUT_CONTENT'] = 'test'

  const ip = path.join(__dirname, 'index.js')
  const result = cp.execSync(`node ${ip}`, { env: process.env }).toString()
  console.log(result)

  const outputs = parseActionOutputs(result)

  const events = outputs.filter(([key]) => key === 'event').map((([_, val]) => val))
  expect(events.length).toBe(1)

  const event = JSON.parse(events[0])
  console.log(event)

  expect(event.kind).toBe(42)
  expect(event.pubkey).toBe('17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4')
  expect(event.created_at).toBeGreaterThanOrEqual(Math.floor(NOW / 1_000))
  expect(event.tags).toEqual([['expiration', '1600000000']])
  expect(event.content).toBe('test')
  expect(event.sig.length).toBe(128)
})
