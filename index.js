const core = require('@actions/core')
const nostr = require('./nostr-tools-commonjs')
const wait = require('./wait')

const waitFor = async (testFn, maxTries = 100, waitDuration = 100) => {
  for (let i = 0; i < maxTries - 1; i++) {
    if (testFn()) {
      return true
    } else {
      await wait(waitDuration)
    }
  }
  return testFn()
}

const _sendEvent = (dryRun = false) => (async (relayUrl, eventObject) => {
  const pool = nostr.relayPool()
  pool.setPolicy('wait', true)

  console.debug(`Connecting to relay ${relayUrl}..`)
  const relay = pool.addRelay(relayUrl, {read: false, write: true})

  try {
    const relayReady = await waitFor(() => relay.status === 1)
    if (!relayReady) {
      throw new Error(`Could not establish connection to relay ${relayUrl}`)
    } else {
      console.debug(`Successfully connected to relay ${relayUrl}`)
    }

    return dryRun ? eventObject : await pool.publish(eventObject)
  } finally {
    console.debug(`Disconnecting from relay ${relayUrl}..`)
    pool.removeRelay(relayUrl)
    console.debug(`Disconnected from relay ${relayUrl}`)
  }
})

const sendEvent = _sendEvent()
const sendEventDry = _sendEvent(true)

const die = (msg) => { throw  new Error(msg) }

async function run() {
  try {
    const relay = core.getInput('relay', { required: true })
    const content = core.getInput('content', { required: true })
    const key = core.getInput('key', { required: true })
    const dry = core.getInput('dry') === 'true'

    if (dry) {
      console.info('dry-run enabled - connection to relays will be established, but no event will be sent.')
    }

    console.debug('Creating event..')
    const eventObject = nostr.getBlankEvent()
    eventObject.kind = 1
    eventObject.pubkey = Buffer.from(nostr.getPublicKey(key)).toString('hex')
    eventObject.content = content
    eventObject.tags = []
    eventObject.created_at = Math.round(Date.now() / 1000)

    console.debug('Signing event..')
    const sig = Buffer.from(await nostr.signEvent(eventObject, key)).toString('hex')
    eventObject.sig = sig
    eventObject.id = nostr.getEventHash(eventObject)

    console.debug('Validating event..')
    nostr.validateEvent(eventObject) || die('event is not valid')
    
    console.debug('Sending event..', dry ? '(dry-run enabled: event will not be sent)' : null)
    const event = dry ? await sendEventDry(relay, eventObject) : await sendEvent(relay, eventObject)
    console.debug('Successfully sent event', event)
    
    core.setOutput('event', JSON.stringify(event))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
