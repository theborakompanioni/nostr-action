const core = require('@actions/core');
const nostr = require('./nostr-tools-commonjs')


async function sendEvent(relay, eventObject) {
  const pool = nostr.relayPool()
  pool.setPolicy('wait', true);
  pool.addRelay(relay, {read: false, write: true})

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const ev = await pool.publish(eventObject, (status, url) => {
          if (status === 0) {
            console.log(`publish request sent to ${url}`)
          }
          if (status === 1) {
            console.log(`event published by ${url}`, ev)
          }
        });
        
        resolve(ev);

      } catch(err) {
        console.log("Error while sending event: " + err);
        reject(err)
      } finally {
        pool.removeRelay(relay)
      }
    }, 3000);
  })
}

const die = (msg) => { throw  new Error(msg) };

// most @actions toolkit packages have async methods
async function run() {
  try {
    // const relay = core.getInput('relay') || die('`relay` must not be empty');
    // const content = core.getInput('content') || die('`content` must not be empty');
    // const key = core.getInput('key') || die('`key` must not be empty');
    const relay = core.getInput('relay') || 'wss://relayer.fiatjaf.com';
    const content = core.getInput('content') || 'test';
    const key = core.getInput('key') || 'bda95ba67b8f225d77858fc599cfc1e91b00e035c3e06c687b7e91ab1f22b895';

    console.debug('Creating event..')
    const eventObject = nostr.getBlankEvent()
    eventObject.kind = 1
    eventObject.pubkey = Buffer.from(nostr.getPublicKey(key)).toString('hex')
    eventObject.content = content
    eventObject.tags = []
    eventObject.created_at = Math.round(Date.now() / 1000);

    console.debug('Signing event..')
    eventObject.id = nostr.getEventHash(eventObject);
    const sig = Buffer.from(await nostr.signEvent(eventObject, key)).toString('hex');
    eventObject.sig = sig;

    console.debug('Validating event..')
    nostr.validateEvent(eventObject) || die('event is not valid');

    console.debug('Sending event..')
    const event = await sendEvent(relay, eventObject);
    console.log(event);
    
    const eventHash = nostr.getEventHash(event);
    core.setOutput('eventHash', JSON.stringify(eventHash));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
