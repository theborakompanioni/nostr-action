const core = require('@actions/core')
const WebSocket = require('ws')
const { finalizeEvent, verifyEvent } = require('nostr-tools')
const { Relay, useWebSocketImplementation } = require('nostr-tools/relay')
const { hexToBytes } = require('@noble/hashes/utils')

useWebSocketImplementation(WebSocket)

const _sendEvent = (dryRun = false) => (async (relayUrl, eventObject) => {
  core.debug(`Connecting to relay ${relayUrl}..`)

  let relay
  try {
    relay = await Relay.connect(relayUrl)
    core.debug(`Successfully connected to relay ${relayUrl}`)

    if (!dryRun) {
      await relay.publish(eventObject)
    }

    return eventObject
  } catch (e) {
    throw new Error(`Could not establish connection to relay ${relayUrl}: ${e.message || 'Unknown reason'}.`)
  } finally {
    core.debug(`Disconnecting from relay ${relayUrl}..`)
    relay && relay.close()
    core.debug(`Disconnected from relay ${relayUrl}`)
  }
})

const sendEvent = _sendEvent()
const sendEventDry = _sendEvent(true)

const die = (msg) => { throw new Error(msg) }

const DEFAULT_EVENT_TEMPLATE = JSON.stringify({
  kind: 1,
  tags: [],
  created_at: Math.round(Date.now() / 1_000),
})

async function run() {
  try {
    const relay = core.getInput('relay', { required: true })
    const content = core.getInput('content', { required: true })
    const key = hexToBytes(core.getInput('key', { required: true }))
    const templateString = core.getInput('template')
    const dry = core.getBooleanInput('dry')

    if (dry) {
      core.info('dry-run enabled - connection to relays will be established, but no event will be sent.')
    }

    const eventTemplate = JSON.parse(templateString || DEFAULT_EVENT_TEMPLATE)
    const validEventTemplate = typeof eventTemplate === 'object'
      && !Array.isArray(eventTemplate)
      && eventTemplate !== null
    if (!validEventTemplate) {
      throw new Error(`Could not build event from template: "${templateString}"`);
    }

    core.debug('Creating event..')
    const rawEvent = {
      kind: eventTemplate.kind ?? DEFAULT_EVENT_TEMPLATE.kind,
      tags: eventTemplate.tags ?? DEFAULT_EVENT_TEMPLATE.tags,
      created_at: eventTemplate.created_at ?? DEFAULT_EVENT_TEMPLATE.created_at,
      content,
    }

    core.debug('Signing event..')
    const eventObject = finalizeEvent(rawEvent, key)

    core.debug('Validating event..')
    verifyEvent(eventObject) || die('event is not valid')
    
    core.debug('Sending event..', dry ? '(dry-run enabled: event will not be sent)' : '')
    const event = dry ? await sendEventDry(relay, eventObject) : await sendEvent(relay, eventObject)
    core.debug('Successfully sent event.')
    
    core.setOutput('event', JSON.stringify(event))
  } catch (error) {
    const reason = error instanceof Error ? error : error.message || 'Unknown reason.'
    core.setFailed(reason)
  }
}

run()