const core = require('@actions/core')
const WebSocket = require('ws')
const { finalizeEvent, verifyEvent } = require('nostr-tools')
const { Relay, useWebSocketImplementation } = require('nostr-tools/relay')
const { hexToBytes } = require('@noble/hashes/utils')

useWebSocketImplementation(WebSocket)

const _sendEvent = (dryRun = false) => (async (relayUrl, eventObject) => {
  console.debug(`Connecting to relay ${relayUrl}..`)

  let relay
  try {
    relay = await Relay.connect(relayUrl)

    console.debug(`Successfully connected to relay ${relayUrl}`)

    return dryRun ? eventObject : await relay.publish(eventObject)
  } catch (e) {
    throw new Error(`Could not establish connection to relay ${relayUrl}: ${e.message || 'Unknown reason'}.`)
  } finally {
    console.debug(`Disconnecting from relay ${relayUrl}..`)
    relay && relay.close()
    console.debug(`Disconnected from relay ${relayUrl}`)
  }
})

const sendEvent = _sendEvent()
const sendEventDry = _sendEvent(true)

const die = (msg) => { throw new Error(msg) }

async function run() {
  try {
    const relay = core.getInput('relay', { required: true })
    const content = core.getInput('content', { required: true })
    const key = hexToBytes(core.getInput('key', { required: true }))
    const dry = core.getInput('dry') === 'true'

    if (dry) {
      console.info('dry-run enabled - connection to relays will be established, but no event will be sent.')
    }

    console.debug('Creating event..')
    const rawEvent = {
      kind: 1,
      content,
      tags: [],
      created_at: Math.round(Date.now() / 1000),
    }

    console.debug('Signing event..')
    const eventObject = finalizeEvent(rawEvent, key)

    console.debug('Validating event..')
    verifyEvent(eventObject) || die('event is not valid')
    
    console.debug('Sending event..', dry ? '(dry-run enabled: event will not be sent)' : '')
    const event = dry ? await sendEventDry(relay, eventObject) : await sendEvent(relay, eventObject)
    console.debug('Successfully sent event', event)
    
    core.setOutput('event', JSON.stringify(event))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()