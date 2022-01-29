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

const sendEvent = async (relayUrl, eventObject) => {
  const pool = nostr.relayPool()
  pool.setPolicy('wait', true)

  const relay = pool.addRelay(relayUrl, {read: false, write: true})

  try {
    const relayReady = await waitFor(() => relay.status === 1)
    if (!relayReady) {
      throw new Error(`Could not establish connection to relay ${relayUrl}`)
    }

    return await pool.publish(eventObject)
  } finally {
    pool.removeRelay(relayUrl)
  }
}

const die = (msg) => { throw  new Error(msg) }

async function run() {
  try {
    const relay = core.getInput('relay') || die('`relay` must not be empty')
    const content = core.getInput('content') || die('`content` must not be empty')
    const key = core.getInput('key') || die('`key` must not be empty')

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

    console.debug('Sending event..')
    const event = await sendEvent(relay, eventObject)
    console.log(event)
    
    core.setOutput('event', JSON.stringify(event))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
