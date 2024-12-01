<p align="center">
  <img width="100%" src="docs/Header.png">
</p>

# Lightning Web SDK

An npm package that provides useful and common tools and helpers to build lightning web applications.

## 🚀 Quick Start

```
npm install @getalby/lightning-tools
```

or

```
yarn add @getalby/lightning-tools
```

or for use without any build tools:

```html
<script type="module">
  import { LightningAddress } from "https://esm.sh/@getalby/lightning-tools@5.0.0"; // jsdelivr.net, skypack.dev also work

  // use LightningAddress normally...
  (async () => {
    const ln = new LightningAddress("hello@getalby.com");
    // fetch the LNURL data
    await ln.fetch();
    // get the LNURL-pay data:
    console.log(ln.lnurlpData);
  })();
</script>
```

**This library relies on a global `fetch()` function which will work in [browsers](https://caniuse.com/?search=fetch) and node v18 or newer.** (In older versions you have to use a polyfill.)

## 🤙 Usage

### Lightning Address

The `LightningAddress` class provides helpers to work with lightning addresses

```js
import { LightningAddress } from "@getalby/lightning-tools";

const ln = new LightningAddress("hello@getalby.com");

// fetch the LNURL data
await ln.fetch();

// get the LNURL-pay data:
console.log(ln.lnurlpData); // returns a [LNURLPayResponse](https://github.com/getAlby/js-lightning-tools/blob/master/src/types.ts#L1-L15)
// get the keysend data:
console.log(ln.keysendData);
```

#### Get an invoice:

```js
import { LightningAddress } from "@getalby/lightning-tools";

const ln = new LightningAddress("hello@getalby.com");

await ln.fetch();
// request an invoice for 1000 satoshis
// this returns a new `Invoice` class that can also be used to validate the payment
const invoice = await ln.requestInvoice({ satoshi: 1000 });

console.log(invoice.paymentRequest); // print the payment request
console.log(invoice.paymentHash); // print the payment hash
```

#### Verify a payment

```js
import { LightningAddress } from "@getalby/lightning-tools";
const ln = new LightningAddress("hello@getalby.com");
await ln.fetch();

const invoice = await ln.requestInvoice({ satoshi: 1000 });

// if the LNURL providers supports LNURL-verify:
const paid = await invoice.verifyPayment(); // returns true of false
if (paid) {
  console.log(invoice.preimage);
}

// if you have the preimage for example in a WebLN context
await window.webln.enable();
const response = await window.webln.sendPayment(invoice.paymentRequest);
const paid = invoice.validatePreimage(response.preimage); // returns true or false
if (paid) {
  console.log("paid");
}

// or use the convenenice method:
await invoice.isPaid();
```

It is also possible to manually initialize the `Invoice`

```js
const { Invoice } = require("alby-tools");

const invoice = new Invoice({ pr: pr, preimage: preimage });
await invoice.isPaid();
```

#### Boost a LN address:

You can also attach additional metadata information like app name, version, name of the podcast which is boosted etc. to the keysend payment.

```js
import { LightningAddress } from "@getalby/lightning-tools";
const ln = new LightningAddress("hello@getalby.com");
await ln.fetch();

const boost = {
  action: "boost",
  value_msat: 21000,
  value_msat_total: 21000,
  app_name: "Podcastr",
  app_version: "v2.1",
  feedId: "21",
  podcast: "random podcast",
  episode: "1",
  ts: 2121,
  name: "Satoshi",
  sender_name: "Alby",
};
await ln.boost(boost);
```

#### Zapping a LN address on Nostr:

Nostr is a simple, open protocol that enables truly censorship-resistant and global value-for-value publishing on the web. Nostr integrates deeply with Lightning. [more info](https://nostr.how/)

This librarys provides helpers to create [zaps](https://github.com/nostr-protocol/nips/blob/master/57.md).

```js
import { LightningAddress } from "@getalby/lightning-tools";
const ln = new LightningAddress("hello@getalby.com");
await ln.fetch();

const response = await ln.zap({
  satoshi: 1000,
  comment: "Awesome post",
  relays: ["wss://relay.damus.io"],
  e: "44e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
});
console.log(response.preimage); // print the preimage
```

For a full example see [examples/zaps](examples/zaps.js)

#### Zapping a LN address on Nostr using Nostr Wallet Connect:

Native zaps without a browser extension are possible by using a Nostr Wallet Connect WebLN provider.

See [examples/zaps-nwc](examples/zaps-nwc.js)

### L402

L402 is a protocol standard based on the HTTP 402 Payment Required error code
designed to support the use case of charging for services and
authenticating users in distributed networks.

This library includes a `fetchWithL402` function to consume L402 protected resources.

#### fetchWithL402(url: string, fetchArgs, options)

- url: the L402 protected URL
- fetchArgs: arguments are passed to the underlying `fetch()` function used to do the HTTP request
- options:
  - webln: the webln object used to call `sendPayment()` defaults to globalThis.webln
  - store: a key/value store object to persiste the l402 for each URL. The store must implement a `getItem()`/`setItem()` function as the browser's localStorage. By default a memory storage is used.
  - headerKey: defaults to L402 but if you need to consume an old LSAT API set this to LSAT

##### Examples

```js
import { fetchWithL402 } from "@getalby/lightning-tools";

// this will fetch the resource and pay the invoice with window.webln.
// the tokens/preimage data will be stored in the browser's localStorage and used for any following request
await fetchWithL402(
  "https://lsat-weather-api.getalby.repl.co/kigali",
  {},
  { store: window.localStorage }
)
  .then((res) => res.json())
  .then(console.log);
```

```js
import { fetchWithL402 } from "@getalby/lightning-tools";
import { webln } from "alby-js-sdk";

// use a NWC WebLN provide to do the payments
const nwc = new webln.NostrWebLNProvider({
  nostrWalletConnectUrl: loadNWCUrl(),
});

// this will fetch the resource and pay the invoice with a NWC webln object
await fetchWithL402(
  "https://lsat-weather-api.getalby.repl.co/kigali",
  {},
  { webln: nwc }
)
  .then((res) => res.json())
  .then(console.log);
```

```js
import { l402 } from "@getalby/lightning-tools";

// do not store the tokens
await l402.fetchWithL402(
  "https://lsat-weather-api.getalby.repl.co/kigali",
  {},
  { store: new l402.storage.NoStorage() }
);
```

### Basic invoice decoding

You can initialize an `Invoice` to decode a payment request.

```js
const { Invoice } = require("alby-tools");

const invoice = new Invoice({ pr });

const { paymentHash, satoshi, description, createdDate, expiryDate } = invoice;
```

> If you need more details about the invoice, use a dedicated BOLT11 decoding library.

### 💵 Fiat conversions

Helpers to convert sats values to fiat and fiat values to sats.

##### getFiatValue(satoshi: number, currency: string): number

Returns the fiat value for a specified currency of a satoshi amount

##### getSatoshiValue(amount: number, currency: string): number

Returns the satoshi value for a specified amount (in the smallest denomination) and currency

##### getFormattedFiatValue(satoshi: number, currency: string, locale: string): string

Like `getFiatValue` but returns a formatted string for a given locale using JavaScript's `toLocaleString`

#### Examples

```js
await getFiatValue(satoshi: 2100, currency: 'eur');
await getSatoshiValue(amount: 100, currency: 'eur'); // for 1 EUR
await getFormattedFiatValue(satoshi: 2100, currency: 'usd', locale: 'en')
```

### 🤖 Lightning Address Proxy

This library uses a [proxy](https://github.com/getAlby/lightning-address-details-proxy) to simplify requests to lightning providers.

- Many ln addresses don't support CORS, which means fetching the data directly in a browser environment will not always work.
- Two requests are required to retrieve lnurlp and keysend data for a lightning address. The proxy will do these for you with a single request.

You can disable the proxy by explicitly setting the proxy to false when initializing a lightning address:

```js
const lightningAddress = new LightningAddress("hello@getalby.com", {
  proxy: false,
});
```

## crypto dependency

If you get an `crypto is not defined` in NodeJS error you have to import it first:

```js
import * as crypto from 'crypto'; // or 'node:crypto'
globalThis.crypto = crypto as any;
//or: global.crypto = require('crypto');
```

## fetch() dependency

This library relies on a global fetch object which will work in browsers and node v18.x or newer. In old version you can manually install a global fetch option or polyfill if needed.

For example:

```js
import fetch from "cross-fetch"; // or "@inrupt/universal-fetch"
globalThis.fetch = fetch;

// or as a polyfill:
import "cross-fetch/polyfill";
```

## 🛠 Development

```
yarn install
yarn run build
```

## Need help?

We are happy to help, please contact us or create an issue.

- [Twitter: @getAlby](https://twitter.com/getAlby)
- [Telegram group](https://t.me/getAlby)
- support at getalby.com
- [bitcoin.design](https://bitcoin.design/) Discord community (find us on the #alby channel)
- Read the [Alby developer guide](https://guides.getalby.com/overall-guide/alby-for-developers/getting-started) to better understand how Alby packages and APIs can be used to power your app.

## License

MIT
