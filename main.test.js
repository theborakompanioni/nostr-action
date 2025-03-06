const core = require('@actions/core')
const nostrToolsRelay = require('nostr-tools/relay')
const { run } = require('./main')

// test key taken from https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vector-4
const TEST_KEY_HEX = '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678'
const TEST_KEY_NSEC = 'nsec18hw4vq3gtzv6j3s3g5rp2lrejlj5g3fg7vqr7cf5wys50kcekeuq0vkmxn'

const DEFAULT_ENV = {
  INPUT_DRY: false,
  INPUT_KEY: TEST_KEY_HEX,
  INPUT_RELAY: '',
  INPUT_RELAYS: 'wss://localhost, wss://localhost:8080',
  INPUT_CONTENT: 'test',
  INPUT_EVENT_TEMPLATE: JSON.stringify({
    tags: [
      ['expiration', '1']
    ],
  }),
}

const NOW = Date.now()

jest.mock('@actions/core')
core.summary = {
  addLink: () => core.summary,
  addHeading: () => core.summary,
  addCodeBlock: () => core.summary,
  write: async() => {},
}

jest.mock('nostr-tools/relay')

core.debug.mockImplementation(console.debug)
core.info.mockImplementation(console.info)
core.notice.mockImplementation(console.info)
core.warning.mockImplementation(console.warn)
core.error.mockImplementation(console.error)

nostrToolsRelay.Relay.connect.mockImplementation(async (relay) => {
  return {
    publish: async (event) => {
      core.info(`Mocked publishing event ${event.id} to ${relay}`)
    },
    close: () => {}
  }
})

test('it should verify normal behaviour', async () => {
  const env = {
    ...DEFAULT_ENV,
    INPUT_EVENT_TEMPLATE: '',
  }

  core.getInput
    .mockReturnValueOnce(env.INPUT_RELAY)
    .mockReturnValueOnce(env.INPUT_RELAYS)
    .mockReturnValueOnce(env.INPUT_CONTENT)
    .mockReturnValueOnce(env.INPUT_KEY)
    .mockReturnValueOnce(env.INPUT_EVENT_TEMPLATE)

  core.getBooleanInput
    .mockReturnValueOnce(env.INPUT_DRY)

  const output = {}
  core.setOutput.mockImplementation((name, value) => output[name] = value)

  const failed = {}
  core.setFailed.mockImplementation((value) => failed.value = value)

  void await run()

  expect(failed.value).toBe(undefined)
  expect(output.event).toBeDefined()

  const event = JSON.parse(output.event)
  expect(event.kind).toBe(1)
  expect(event.pubkey).toBe('17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4')
  expect(event.created_at).toBeGreaterThanOrEqual(Math.floor(NOW / 1_000))
  expect(event.tags).toEqual([])
  expect(event.content).toBe('test')
  expect(event.sig.length).toBe(128)
})

test('it should verify event template handling', async () => {
  const env = {
    ...DEFAULT_ENV,
    INPUT_EVENT_TEMPLATE: JSON.stringify({
      kind: 42,
      tags: [
        ['expiration', '1600000000']
      ],
      created_at: 1337,
      content: 'this should be replaced by the `INPUT_CONTENT` args',
      ignored: 'this should be ignored'
    }),
  }

  core.getInput
    .mockReturnValueOnce(env.INPUT_RELAY)
    .mockReturnValueOnce(env.INPUT_RELAYS)
    .mockReturnValueOnce(env.INPUT_CONTENT)
    .mockReturnValueOnce(env.INPUT_KEY)
    .mockReturnValueOnce(env.INPUT_EVENT_TEMPLATE)

  core.getBooleanInput
    .mockReturnValueOnce(env.INPUT_DRY)

  const output = {}
  core.setOutput.mockImplementation((name, value) => output[name] = value)

  const failed = {}
  core.setFailed.mockImplementation((value) => failed.value = value)

  void await run()

  expect(failed.value).toBe(undefined)
  expect(output.event).toBeDefined()

  const event = JSON.parse(output.event)
  expect(event.kind).toBe(42)
  expect(event.pubkey).toBe('17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4')
  expect(event.created_at).toBe(1337)
  expect(event.tags).toEqual([['expiration', '1600000000']])
  expect(event.content).toBe('test')
  expect(event.sig.length).toBe(128)
  expect(event.ignored).not.toBeDefined()
})

test('it should fail on invalid key', async () => {
  const env = {
    ...DEFAULT_ENV,
    INPUT_KEY: 'invalid',
  }

  core.getInput
    .mockReturnValueOnce(env.INPUT_RELAY)
    .mockReturnValueOnce(env.INPUT_RELAYS)
    .mockReturnValueOnce(env.INPUT_CONTENT)
    .mockReturnValueOnce(env.INPUT_KEY)
    .mockReturnValueOnce(env.INPUT_EVENT_TEMPLATE)

  const failed = {}
  core.setFailed.mockImplementation((value) => failed.value = value)

  void await run()

  expect(failed.value).toBeDefined()
  expect(failed.value.message).toBe('hex string expected, got unpadded hex of length 7')
})

test('it should fail on invalid relays', async () => {
  const env = {
    ...DEFAULT_ENV,
    INPUT_RELAY: 'http://localhost',
    INPUT_RELAYS: 'smtp://localhost, ,.,,invalid,',
  }

  core.getInput
    .mockReturnValueOnce(env.INPUT_RELAY)
    .mockReturnValueOnce(env.INPUT_RELAYS)
    .mockReturnValueOnce(env.INPUT_CONTENT)
    .mockReturnValueOnce(env.INPUT_KEY)
    .mockReturnValueOnce(env.INPUT_EVENT_TEMPLATE)

  const failed = {}
  core.setFailed.mockImplementation((value) => failed.value = value)

  void await run()

  expect(failed.value).toBeDefined()
  expect(failed.value.message).toBe('Could not parse relays from input: "http://localhost,smtp://localhost, ,.,,invalid,"')
})

test('it should accept nip19 encoding as key (nsec)', async () => {
  const env = {
    ...DEFAULT_ENV,
    INPUT_KEY: TEST_KEY_NSEC,
  }

  core.getInput
    .mockReturnValueOnce(env.INPUT_RELAY)
    .mockReturnValueOnce(env.INPUT_RELAYS)
    .mockReturnValueOnce(env.INPUT_CONTENT)
    .mockReturnValueOnce(env.INPUT_KEY)
    .mockReturnValueOnce(env.INPUT_EVENT_TEMPLATE)

  core.getBooleanInput
    .mockReturnValueOnce(env.INPUT_DRY)

  const output = {}
  core.setOutput.mockImplementation((name, value) => output[name] = value)

  void await run()

  expect(output.event).toBeDefined()

  const event = JSON.parse(output.event)
  expect(event.pubkey).toBe('17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4')
  expect(event.sig.length).toBe(128)
})
