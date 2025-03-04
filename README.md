[![GitHub Release](https://img.shields.io/github/v/release/theborakompanioni/nostr-action?cacheSeconds=3600)](https://github.com/theborakompanioni/nostr-action/releases/latest)
[![Run Unit Tests](https://github.com/theborakompanioni/nostr-action/actions/workflows/test.yml/badge.svg)](https://github.com/theborakompanioni/nostr-action/actions/workflows/test.yml)

# nostr GitHub Action

Use this action to send events with [Nostr](https://github.com/nostr-protocol/nostr). :rocket:

[See the actions tab](https://github.com/theborakompanioni/nostr-action/actions) for runs of this action.

## Usage

```yaml
uses: theborakompanioni/nostr-action@v1
with:
  key: ${{ secrets.NOSTR_KEY }}
  relay: wss://nostr-dev.wellorder.net
  content: Hello World
```

This will create and publish an event like the following:
```json
{
  "id": "e32f2696b5cfb0c2d0def7c78206421f89560547eaeee2f9f4ef8b802633d289",
  "pubkey": "17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4",
  "kind": 1,
  "created_at": 1740648622,
  "tags": [],
  "content": "Hello World",
  "sig": "4c41949bf08c081427e2f8322b55fd1ea4432c663bb1cd10bcbdd9f013d51a66544666e2abb7cdb51b3bad6b48ef8ebc41ccf345982f6fefe22cc956cc29ef09"
}
```

Example debug output:
```
::debug::Creating event..
::debug::Signing event..
::debug::Validating event..
::debug::Sending event..
::debug::Connecting to relay wss://nostr-dev.wellorder.net..
::debug::Successfully connected to relay wss://nostr-dev.wellorder.net
::debug::Disconnecting from relay wss://nostr-dev.wellorder.net..
::debug::Disconnected from relay wss://nostr-dev.wellorder.net
::debug::Successfully sent event.

::set-output name=event::{"kind":1,"tags":[],"created_at":1740648622,"content":"Hello World","pubkey":"17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4","id":"e32f2696b5cfb0c2d0def7c78206421f89560547eaeee2f9f4ef8b802633d289","sig":"4c41949bf08c081427e2f8322b55fd1ea4432c663bb1cd10bcbdd9f013d51a66544666e2abb7cdb51b3bad6b48ef8ebc41ccf345982f6fefe22cc956cc29ef09"}
```

### Custom event template

```yaml
uses: theborakompanioni/nostr-action@v1
with:
  key: ${{ secrets.NOSTR_KEY }}
  relay: wss://nostr-dev.wellorder.net
  content: Hello World
  event_template: |
    {
      "kind": 42,
      "created_at": 1500000000,
      "tags": [ ["expiration", "1600000000"] ]
    }
```

```json
{
  "id": "59d4a413b08126cbe5b61a9e01bfcb1277b4c765c167a0daac77288c657270a1",
  "pubkey": "17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4",
  "kind": 42,
  "created_at": 1500000000,
  "tags": [
    [
      "expiration",
      "1600000000"
    ]
  ],
  "content": "Hello World",
  "sig": "cc3be9bef353e480f45b2d4efadb902b1b4932f9f1d27219ab462869a0e5487d5aa6eabd7327f5da325ac9bd7a562a29a448b1a9e65ee318e05054126d22bb7e"
}
```

## Development
### Package for distribution

GitHub Actions will run the entry point from the action.yml. 

```bash
npm run build
```
Packaging the action will create a packaged action in the dist folder.

### Create a new release
```bash
git tag --annotate --sign v1.x.x --message "Release v1.x.x"
git tag --force --annotate --sign v1 --message "Update v1 tag"
git push --tags
``` 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md).

### Helper

#### Generate Nostr key pair
```
> npm run generate-key
Private key: 3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678
Public key: 17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4
```

#### Publish example event
Send an example event via Nostr (dry-run by default)

```
> npm run example
```
```
dry-run enabled - connection to relays will be established, but no event will be sent.
::debug::Creating event..
::debug::Signing event..
::debug::Validating event..
::debug::Sending event..
::debug::Connecting to relay wss://nostr-dev.wellorder.net..
::debug::Successfully connected to relay wss://nostr-dev.wellorder.net
::debug::Disconnecting from relay wss://nostr-dev.wellorder.net..
::debug::Disconnected from relay wss://nostr-dev.wellorder.net
::debug::Successfully sent event.
[...]
```

## Resources
- Nostr (GitHub): https://github.com/nostr-protocol/nostr
- JavaScript GitHub Action (GitHub): https://github.com/actions/javascript-action
