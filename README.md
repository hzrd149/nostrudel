<p align="center">
  <img src="screenshots/icon.svg" alt="Project Logo" width="21%">
</p>

# noStrudel

> NOTE: This client is still in development and will have bugs

noStrudel is a web app for exploring the [nostr](https://github.com/nostr-protocol) protocol.

The goal of this project is to build a nostr client that lets a user explore the nostr protocol by showing as much information as possible and letting the user view the underlying events.

Live Instance: [nostrudel.ninja](https://nostrudel.ninja)

There are many features missing from this client and I wont get around to implementing everything. but if you like the client you are welcome to use it.

You can find more clients with more features on [nostrapps.com](https://www.nostrapps.com/) or in the [awesome-nostr](https://github.com/aljazceru/awesome-nostr) repo.

## Please don't trust my app with your nsec

While logging in with a secret key is supported. please don't. This is a web client, so there is always a chance of XXS attacks that could steal your secret key.

I would recommend you use a browser extension like [Alby](https://getalby.com/) or [Nos2x](https://github.com/fiatjaf/nos2x)

## Running locally

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/$(whoami)/.zshrc
eval "$(/opt/homebrew/bin/brew shellenv)"

brew install pnpm
brew install node

cd ~/
git clone https://github.com/btcforplebs/nostrudel
cd nostrudel
pnpm install
pnpm run dev
```


