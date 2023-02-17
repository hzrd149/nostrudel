# noStrudel

> NOTE: This client is still in development and is very buggy

## noStrudel is my personal nostr client.

My goals for this project is to learn as much as I can about nostr (by implementing everything myself) and to have a client that works exactly how I like.

There are many features missing from this client and I wont get around to implementing everything (probably no DM support). but if you like the client you are welcome to use it.

Live Instance: [nostrudel.ninja](https://nostrudel.ninja)

You can find better clients with more features in the [awesome-nostr](https://github.com/aljazceru/awesome-nostr) repo.

## Please dont trust my app with your nsec

While logging in with a secret key is supported. please dont. Ultimatly this is a web client, so there is always a change of XXS attacks that could steal your secret key.

I would recomend you use a browser extension like [Alby](https://getalby.com/) or [Nos2x](https://github.com/fiatjaf/nos2x)

## Current Features

- [x] Home feed
- [ ] Discovery Feed
- [x] Dark theme
- [x] Preview twitter / youtube links
- [x] Lighting invoices
- [x] Blurred or hidden images and embeds for people you dont follow
- [x] Thread view
- [x] NIP-05 support
- [x] Broadcast events
- [x] User tipping
- [x] Manage followers ( Contact List )
- [x] Relay management
- [ ] Profile management
- [ ] Image upload
- [ ] Reactions
- [ ] Dynamically connect to relays (start with one relay then connect to others as required)
- [ ] Reporting users and events
- [ ] Blocking users
- [ ] Notifications

## Supported NIPs

- [x] [NIP-02](https://github.com/nostr-protocol/nips/blob/master/02.md): Contact List and Petnames
- [ ] [NIP-03](https://github.com/nostr-protocol/nips/blob/master/03.md): OpenTimestamps Attestations for Events
- [ ] [NIP-04](https://github.com/nostr-protocol/nips/blob/master/04.md): Encrypted Direct Message
- [x] [NIP-05](https://github.com/nostr-protocol/nips/blob/master/05.md): Mapping Nostr keys to DNS-based internet identifiers
- [ ] [NIP-06](https://github.com/nostr-protocol/nips/blob/master/06.md): Basic key derivation from mnemonic seed phrase
- [x] [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md): `window.nostr` capability for web browsers
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
- [ ] [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md): Lightning Zaps
- [x] [NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md): Relay List Metadata

## TODO

- Create a "event posting" service that can show modals (for qr code scanning), warnings (signed by wrong pubkey), and results (what relays responded) when posting events.
- Create notifications service that keeps track of read notifications. (show unread count in sidenav)
- Rebuild relays view to show relay info and settings NIP-11
- filter list of followers by users the user has blocked/reported (stops bots/spammers from showing up at followers)
- Add note embeds
- Add "repost" button that mentions the note
- Add preview tab to note modal
- Add mentions in posts (https://css-tricks.com/so-you-want-to-build-an-mention-autocomplete-feature/)
- add `client` tag to published events
- Save note drafts and let users manage them
- make app a valid web share target https://developer.chrome.com/articles/web-share-target/
- implement NIP-56 and blocking
- block notes based on content
- allow user to select relay or following list when fetching replies (default to my relays + following?)
  - massive thread note1dapvuu8fl09yjtg2gyr2h6nypaffl2sq0aj5raz86463qk5kpyzqlxvtc3

## Setup

```bash
yarn install && yarn start
```

## Contributing

For now this is only a personal project, and while im more than happy to fix any issues that are found. id like to spend as much time as posible inside of vscode and not responding to PRs or issues. So if you do want to open a PR please keep it small and dont rewrite the whole project :D
