[![Run Unit Tests](https://github.com/theborakompanioni/nostr-action/actions/workflows/test.yml/badge.svg)](https://github.com/theborakompanioni/nostr-action/actions/workflows/test.yml)

# nostr GitHub Action

Use this action to send events with [nostr](https://github.com/fiatjaf/nostr). :rocket:

## Usage

```yaml
uses: theborakompanioni/nostr-action@v1
with:
  key: ${{ secrets.NOSTR_KEY }}
  relay: wss://relayer.fiatjaf.com
  content: Hello World
```

See the [actions tab](https://github.com/theborakompanioni/nostr-action/actions) for runs of this action.

Example debug output:
```
Creating event..
Signing event..
Validating event..
Sending event..
Connecting to relay wss://relayer.fiatjaf.com..
connected to wss://relayer.fiatjaf.com
Successfully connected to relay wss://relayer.fiatjaf.com
Disconnecting from relay wss://relayer.fiatjaf.com..
Disconnected from relay wss://relayer.fiatjaf.com
Successfully sent event {
  kind: 1,
  pubkey: '17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4',
  content: 'Pull Request closed\n\ntheborakompanioni closed PR#10',
  tags: [],
  created_at: 1643553583,
  sig: '7165179884b13c2331a749bf04877738a7884bb1bd19eb863b94e8aba50a5d030163f3d99b1352dcb9bf5be82f85beb637886042e648a3b4adad322a11bef5fa',
  id: '3e6b8184d7328242f0c1626ed5377db8d99f334d7f6065612b99a1f679b7ea09'
}
```

## Development
### Package for distribution

GitHub Actions will run the entry point from the action.yml. 

```bash
npm run prepare
```
Packaging the action will create a packaged action in the dist folder.

### Create a new release
```bash
git tag -fa v1 -m "Update v1 tag"
git push --tags --force-with-lease
``` 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

### Helper

#### Generate nostr key pair
```
> npm run generate-key
Private key: 3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678
Public key: 17d188313f254d320183aab21c4ec7354ebad1e2435799431962e6118a56eff4
```

#### Publish example event
Send an example event via nostr (dry-run by default)

```
> npm run example
```
```
dry-run enabled - connection to relays will be established, but no event will be sent.
Creating event..
Signing event..
Validating event..
Sending event.. (dry-run enabled: event will not be sent)
[...]
```


# Resources
- nostr (GitHub): https://github.com/fiatjaf/nostr
- JavaScript GitHub Action (GitHub): https://github.com/actions/javascript-action
