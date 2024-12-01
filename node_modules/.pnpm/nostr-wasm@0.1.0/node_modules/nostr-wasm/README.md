# nostr-wasm

Nostr signature stuff in WASM based on libsecp256k1.

## Install

```sh
yarn install
```

## Demo

A demo application using this package is available at https://nostr-wasm-demo.pages.dev/.

## Usage

First, choose which import method suites your needs:

#### Default

Import with the WASM binary preloaded and uncompressed. No need to perform `fetch`, but bundle will be larger (+332 KiB).

```ts
import {initNostrWasm} from 'nostr-wasm'
const nw = await initNostrWasm()
```

#### Compressed

Import with the WASM binary preloaded and gzipped (requires access to `globalThis.DecompressionSteam`). No need to perform `fetch`, but bundle will be still be a bit larger (+175 KiB).

```ts
import {initNostrWasm} from 'nostr-wasm/gzipped'
const nw = await initNostrWasm()
```

#### Headless

Import without the WASM binary. Produces the smallest bundle size but requires fetching the binary yourself.

```ts
import {NostrWasm} from 'nostr-wasm/headless'

// provide the binary (the constructor also accepts raw bytes)
const nw = await NostrWasm(await fetch('secp256k1.wasm'))
```

### Using the instance:

```ts
// generate a random private key
const sec = nw.generateSecretKey()

// get its corresponding public key
const pubkey = nw.getPublicKey(sec)

// finalize a nostr event in-place, filling it with id, pubkey and sig
nw.finalizeEvent(event, sec)

// verify a nostr event checking its id and its signature against the given pubkey
try {
  nw.verifyEvent(event)
} catch (err) {
  console.log(err)
}
```

Caller is responsible for zero-ing out private keys in the Uint8Array it passes. Library only zeroes out the bytes in the copies it makes.

## Is libsecp256k1 modified?

No, the library is imported as a git submodule directly from upstream.

## Building from source

Prerequisites:

- [Podman](https://podman.io/)
- [Bun](https://bun.sh/)
- [Just](https://just.systems/)

```sh
git clone --recurse-submodules https://github.com/fiatjaf/nostr-wasm
cd nostr-wasm
bun install
just
```

The WASM binary will be output to `public/out/secp256k1.wasm`.

The Emscripten-generated js file at `public/out/secp256k1.js` is not needed for production if you are using the provided wrapper.
