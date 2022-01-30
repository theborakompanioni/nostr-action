const wait = require('./wait');
const process = require('process');
const cp = require('child_process');
const path = require('path');

test('throws invalid number', async () => {
  await expect(wait('foo')).rejects.toThrow('milliseconds not a number');
});

test('wait 500 ms', async () => {
  const start = new Date();
  await wait(500);
  const end = new Date();
  var delta = Math.abs(end - start);
  expect(delta).toBeGreaterThanOrEqual(500);
});

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_DRY'] = true;
  process.env['INPUT_RELAY'] = 'wss://relayer.fiatjaf.com';
  process.env['INPUT_CONTENT'] = 'test';
  // test key taken from https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vector-4
  process.env['INPUT_KEY'] = '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678';
  
  const ip = path.join(__dirname, 'index.js');
  const result = cp.execSync(`node ${ip}`, {env: process.env}).toString();
  console.log(result);
})
