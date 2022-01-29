const core = require('@actions/core');
const wait = require('./wait');
// const nostr = require('nostr-tools');

 /*
import * as core from '@actions/core'
import * as wait from 'wait'
import * as nostr from 'nostr-tools'

function doIt(relay, content) {
  const pool = nostr.relayPool()

  // pool.setPrivateKey('<hex>') // optional

  pool.addRelay(relay, {read: false, write: true})

  const eventObject = nostr.getBlankEventnpm()
  eventObject.kind = 1
  eventObject.pubkey = ''
  eventObject.content = content
  eventObject.tags = []
  eventObject.created_at = Math.round(Date.now() / 1000);
  
  pool.publish(eventObject, (status, url) => {
    if (status === 0) {
      console.log(`publish request sent to ${url}`)
    }
    if (status === 1) {
      console.log(`event published by ${url}`, ev)
    }
  })

  pool.removeRelay(relay)
}*/

// most @actions toolkit packages have async methods
async function run() {
  try {
    const relay = core.getInput('relay');
    const content = core.getInput('content');

    // doIt();
    const ms = 1000;

    core.info(`Waiting ${ms} milliseconds ...`);

    core.debug((new Date()).toTimeString()); // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
    await wait(parseInt(ms));
    core.info((new Date()).toTimeString());

    core.setOutput('time', new Date().toTimeString());
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
