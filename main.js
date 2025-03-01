const core = require('@actions/core')
const WebSocket = require('ws')
const { finalizeEvent, verifyEvent } = require('nostr-tools')
const { Relay, useWebSocketImplementation } = require('nostr-tools/relay')
const nip19 = require('nostr-tools/nip19')
const { hexToBytes } = require('@noble/hashes/utils')

useWebSocketImplementation(WebSocket)

const _sendEvent = (dryRun = false) => (async (relayUrl, event) => {
  core.debug(`Connecting to relay ${relayUrl}..`)

  let relay
  try {
    relay = await Relay.connect(relayUrl)
    core.debug(`Successfully connected to relay ${relayUrl}`)

    if (!dryRun) {
      core.debug(`Publishing event ${event.id}..`)
      await relay.publish(event)
      core.debug(`Successfully published event ${event.id}`)
    }

    return event
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

const DEFAULT_EVENT_TEMPLATE = {
  kind: 1,
  tags: [],
  created_at: Math.floor(Date.now() / 1_000),
}
const DEFAULT_EVENT_TEMPLATE_STRING = JSON.stringify(DEFAULT_EVENT_TEMPLATE)

const run = async () => {
  try {
    const relayString = core.getInput('relay', { required: false })
    const relaysString = core.getInput('relays', { required: false })
    const content = core.getInput('content', { required: true })
    const key = core.getInput('key', { required: true })
    const eventTemplateString = core.getInput('event_template', { required: false })
    const dry = core.getBooleanInput('dry', { required: false })

    const keyRaw = key.startsWith('nsec') ? nip19.decode(key).data : hexToBytes(key)
    core.setSecret(key)

    const relays = `${relayString},${relaysString}`.split(',')
      .map((it) => it.trim())
      .filter((it) => it.startsWith('wss://') || it.startsWith('ws://'))
      .filter((it, index, array) => array.indexOf(it) === index)

    if (relays.length === 0) {
      throw new Error(`Could not parse relays from input: "${relayString},${relaysString}"`);
    }

    if (dry) {
      core.info('dry-run enabled - connection to relays will be established, but no event will be sent.')
    }

    const eventTemplate = JSON.parse(eventTemplateString || DEFAULT_EVENT_TEMPLATE_STRING)
    const validEventTemplate = typeof eventTemplate === 'object'
      && !Array.isArray(eventTemplate)
      && eventTemplate !== null
    if (!validEventTemplate) {
      throw new Error(`Could not build event from template: "${eventTemplateString}"`)
    }

    core.debug('Creating event..')
    const rawEvent = {
      kind: eventTemplate.kind ?? DEFAULT_EVENT_TEMPLATE.kind,
      tags: eventTemplate.tags ?? DEFAULT_EVENT_TEMPLATE.tags,
      created_at: eventTemplate.created_at ?? DEFAULT_EVENT_TEMPLATE.created_at,
      content,
    }

    core.debug('Signing event..')
    const event = finalizeEvent(rawEvent, keyRaw)

    core.debug('Validating event..')
    verifyEvent(event) || die('event is not valid')
    
    core.debug('Sending event..', dry ? '(dry-run enabled: event will not be sent)' : '')

    let errors = []
    for (const relay of relays) {
      try {
        dry ? await sendEventDry(relay, event) : await sendEvent(relay, event)
      } catch (e) {
        core.warning(e)
        errors = [...errors, e]
      }
    }
    if (errors.length === relays.length) {
      throw new Error('Failed to send event to any relay. ')
    }
    core.debug('Successfully sent event.')
    
    core.setOutput('event', JSON.stringify(event))
  } catch (error) {
    const reason = error instanceof Error ? error : error.message || 'Unknown reason.'
    core.setFailed(reason)
  }
}

module.exports = {
  run
} 
