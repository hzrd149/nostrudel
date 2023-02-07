# noStrudel

## Current Features

- [x] Home feed
- [x] Discovery Feed
- [x] Dark theme
- [x] Preview twitter / youtube links
- [x] Lighting invoices
- [x] Blurred or hidden images and embeds for people you dont follow
- [x] Thread view
- [ ] Manage followers ( Contact List )
- [ ] Profile management
- [ ] Relay management
- [ ] NIP-05 support
- [x] Broadcast events
- [ ] Image upload
- [x] User tipping
- [ ] Reactions
- [ ] Dynamically connect to relays (start with one relay then connect to others as required)
- [ ] Reporting users and events
- [ ] Blocking users
- [ ] Notifications

## Supported NIPs

- [ ] [NIP-02](https://github.com/nostr-protocol/nips/blob/master/02.md): Contact List and Petnames
- [ ] [NIP-03](https://github.com/nostr-protocol/nips/blob/master/03.md): OpenTimestamps Attestations for Events
- [ ] [NIP-04](https://github.com/nostr-protocol/nips/blob/master/04.md): Encrypted Direct Message
- [ ] [NIP-05](https://github.com/nostr-protocol/nips/blob/master/05.md): Mapping Nostr keys to DNS-based internet identifiers
- [ ] [NIP-06](https://github.com/nostr-protocol/nips/blob/master/06.md): Basic key derivation from mnemonic seed phrase
- [ ] [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md): `window.nostr` capability for web browsers
- [ ] [NIP-08](https://github.com/nostr-protocol/nips/blob/master/08.md): Handling Mentions
- [ ] [NIP-09](https://github.com/nostr-protocol/nips/blob/master/09.md): Event Deletion
- [ ] [NIP-11](https://github.com/nostr-protocol/nips/blob/master/11.md): Relay Information Document
- [ ] [NIP-12](https://github.com/nostr-protocol/nips/blob/master/12.md): Generic Tag Queries
- [ ] [NIP-13](https://github.com/nostr-protocol/nips/blob/master/13.md): Proof of Work
- [ ] [NIP-14](https://github.com/nostr-protocol/nips/blob/master/14.md): Subject tag in text events.
- [ ] [NIP-15](https://github.com/nostr-protocol/nips/blob/master/15.md): End of Stored Events Notice
- [x] [NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md): bech32-encoded entities
- [ ] [NIP-20](https://github.com/nostr-protocol/nips/blob/master/20.md): Command Results
- [ ] [NIP-21](https://github.com/nostr-protocol/nips/blob/master/21.md): `nostr:` URL scheme
- [ ] [NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md): Reactions
- [ ] [NIP-26](https://github.com/nostr-protocol/nips/blob/master/26.md): Delegated Event Signing
- [ ] [NIP-33](https://github.com/nostr-protocol/nips/blob/master/33.md): Parameterized Replaceable Events
- [ ] [NIP-36](https://github.com/nostr-protocol/nips/blob/master/36.md): Sensitive Content
- [ ] [NIP-40](https://github.com/nostr-protocol/nips/blob/master/40.md): Expiration Timestamp
- [ ] [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md): Authentication of clients to relays
- [ ] [NIP-50](https://github.com/nostr-protocol/nips/blob/master/50.md): Keywords filter
- [ ] [NIP-56](https://github.com/nostr-protocol/nips/blob/master/56.md): Reporting

## TODO

- add relay selection to global feed and allow user to specify custom relay
- add `client` tag to published events
- add relay selection to global feed
- add button for creating lightning invoice via WebLN
- setup deploy to s3
- make app a valid web share target https://developer.chrome.com/articles/web-share-target/
  - make app handle image files
- block notes based on content
- implement NIP-56 and blocking
- allow user to select relay or following list when fetching replies (default to my relays + following?)
  - massive thread note1dapvuu8fl09yjtg2gyr2h6nypaffl2sq0aj5raz86463qk5kpyzqlxvtc3
  - sort replies by date
- filter list of followers by users the user has blocked/reported (stops bots/spammers from showing up at followers)

## Setup

```bash
yarn install && yarn start
```
