# noStrudel

> NOTE: This client is still in development and is very buggy

## noStrudel is my personal nostr client.

My goals for this project is to learn as much as I can about nostr (by implementing everything myself) and to have a client that works exactly how I like.

There are many features missing from this client and I wont get around to implementing everything. but if you like the client you are welcome to use it.

Live Instance: [nostrudel.ninja](https://nostrudel.ninja)

You can find better clients with more features in the [awesome-nostr](https://github.com/aljazceru/awesome-nostr) repo.

## Please don't trust my app with your nsec

While logging in with a secret key is supported. please don't. This is a web client, so there is always a change of XXS attacks that could steal your secret key.

I would recommend you use a browser extension like [Alby](https://getalby.com/) or [Nos2x](https://github.com/fiatjaf/nos2x)

## Ideas

- Update main timeline to only connect to the necessary relays for your contacts
- Add mentions in notes (https://css-tricks.com/so-you-want-to-build-an-mention-autocomplete-feature/)
- Save note drafts and let users manage them
- Make app a valid web share target https://developer.chrome.com/articles/web-share-target/
  - Handle image share
- Improve link previews https://github.com/pengx17/logseq-plugin-link-preview/blob/master/src/use-link-preview-metadata.tsx
- Support `magnet:` links
  - in-browser video player? https://webtorrent.io/
  - Button to open magnet link in system default app
  - Add support for uploading files (seed files in background?, how to pick trackers?)

## Running locally

```bash
git clone git@github.com:hzrd149/nostrudel.git
cd nostrudel
yarn install
yarn start
```

## Contributing

For now this is only a personal project, and while im more than happy to fix any issues that are found. id like to spend as much time as possible build the app and not responding to PRs. If you do want to open a PR please keep it small and don't rewrite the whole project :D
