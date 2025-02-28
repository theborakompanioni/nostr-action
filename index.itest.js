const cp = require('child_process')
const path = require('path')

const NOW = Date.now()

const parseActionOutputs = (result) => {
  return result.split('\n').filter((it) => it.startsWith('::set-output'))
  // now has form "::set-output name=<name>::<value>"
  .map((it) => it.substring('::set-output'.length).trimStart())
  // now has form "name=<name>::value"
  .map((it) => it.substring('name='.length).trimStart())
  .map((it) => [it.substring(0, it.indexOf('::')), it.substring(it.indexOf('::') + 2)])
}

// shows how the runner will run a javascript action with env / stdout protocol
test('it should verify normal behaviour', () => {
  const env = {
    INPUT_DRY: true,
    // test key taken from https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vector-4
    INPUT_KEY: '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678',
    INPUT_RELAY: 'wss://nostr-dev.wellorder.net',
    INPUT_CONTENT: 'test',
  }

  const ip = path.join(__dirname, 'index.js')
  const result = cp.execSync(`node ${ip}`, { env }).toString()
  console.log(result)

  const outputs = parseActionOutputs(result)

  const events = outputs.filter(([key]) => key === 'event').map((([_, val]) => val))
  expect(events.length).toBe(1)

  const event = JSON.parse(events[0])
  expect(event.kind).toBe(1)
  expect(event.pubkey).toBe('17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4')
  expect(event.created_at).toBeGreaterThanOrEqual(Math.floor(NOW / 1_000))
  expect(event.tags).toEqual([])
  expect(event.content).toBe('test')
  expect(event.sig.length).toBe(128)
})

test('it should verify event template handling', () => {
  const env = {
    INPUT_DRY: true,
    // test key taken from https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vector-4
    INPUT_KEY: '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678',
    INPUT_RELAY: 'wss://nostr-dev.wellorder.net',
    INPUT_EVENT_TEMPLATE: JSON.stringify({
      kind: 42,
      tags: [
        ['expiration', '1600000000']
      ],
      created_at: 1337,
      content: 'this should be replaced by the `INPUT_CONTENT` args',
      ignored: 'this should be ignored'
    }),
    INPUT_CONTENT: 'test',
  }

  const ip = path.join(__dirname, 'index.js')
  const result = cp.execSync(`node ${ip}`, { env }).toString()
  console.log(result)

  const outputs = parseActionOutputs(result)

  const events = outputs.filter(([key]) => key === 'event').map((([_, val]) => val))
  expect(events.length).toBe(1)

  const event = JSON.parse(events[0])
  expect(event.kind).toBe(42)
  expect(event.pubkey).toBe('17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4')
  expect(event.created_at).toBe(1337)
  expect(event.tags).toEqual([['expiration', '1600000000']])
  expect(event.content).toBe('test')
  expect(event.sig.length).toBe(128)
  expect(event.ignored).not.toBeDefined()
})
