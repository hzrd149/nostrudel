# Alby JS SDK

## Introduction

This JavaScript SDK for the Alby OAuth2 Wallet API and the Nostr Wallet Connect API.

## Installing

```bash
npm install @getalby/sdk
```

or

```bash
yarn add @getalby/sdk
```

or for use without any build tools:

```html
<script type="module">
  import { nwc, webln } from "https://esm.sh/@getalby/sdk@3.7.0"; // jsdelivr.net, skypack.dev also work

  // ... then use nwc.NWCClient or webln.NWC (see documentation below)
</script>
```

### NodeJS

**This library relies on a global fetch() function which will work in browsers and node v18.x or newer.** (In older versions you have to use a polyfill.)

## Content

- [Nostr Wallet Connect](#nostr-wallet-connect-documentation)
- [Alby OAuth API](#oauth-api-documentation)
- [Need help?](#need-help)

## Nostr Wallet Connect Documentation

[Nostr Wallet Connect](https://nwc.dev) is an open protocol enabling applications to interact with bitcoin lightning wallets. It allows users to connect their existing wallets to your application allowing developers to easily integrate bitcoin lightning functionality.

The Alby JS SDK allows you to easily integrate Nostr Wallet Connect into any JavaScript based application.

There are two interfaces you can use to access NWC:

- The `NWCClient` exposes the [NWC](https://nwc.dev/) interface directly, which is more powerful than the WebLN interface and is recommended if you plan to create an application outside of the web (e.g. native mobile/command line/server backend etc.). You can explore all the examples [here](./examples/nwc/client/).
- The `NostrWebLNProvider` exposes the [WebLN](https://webln.guide/) interface to execute lightning wallet functionality through Nostr Wallet Connect, such as sending payments, making invoices and getting the node balance. You can explore all the examples [here](./examples/nwc/). See also [Bitcoin Connect](https://github.com/getAlby/bitcoin-connect/) if you are developing a frontend web application.

### NWCClient

#### Initialization Options

- `providerName`: name of the provider to load the default options. currently `alby` (default)
- `nostrWalletConnectUrl`: full Nostr Wallet Connect URL as defined by the [spec](https://github.com/getAlby/nips/blob/master/47.md)
- `relayUrl`: URL of the Nostr relay to be used (e.g. wss://nostr-relay.getalby.com)
- `walletPubkey`: pubkey of the Nostr Wallet Connect app
- `secret`: secret key to sign the request event (if not available window.nostr will be used)
- `authorizationUrl`: URL to the NWC interface for the user to and the app connection

#### Quick start example

```js
import { nwc } from "@getalby/sdk";
const nwc = new nwc.NWCClient({
  nostrWalletConnectUrl: loadNWCUrl(),
}); // loadNWCUrl is some function to get the NWC URL from some (encrypted) storage

// now you can send payments by passing in the invoice in an object
const response = await nwc.payInvoice({ invoice });
```

See [the NWC client examples directory](./examples/nwc/client) for a full list of examples.

### NostrWebLNProvider (aliased as NWC) Options

- `providerName`: name of the provider to load the default options. currently `alby` (default)
- `nostrWalletConnectUrl`: full Nostr Wallet Connect URL as defined by the [spec](https://github.com/getAlby/nips/blob/master/47.md)
- `relayUrl`: URL of the Nostr relay to be used (e.g. wss://nostr-relay.getalby.com)
- `walletPubkey`: pubkey of the Nostr Wallet Connect app
- `secret`: secret key to sign the request event (if not available window.nostr will be used)
- `authorizationUrl`: URL to the NWC interface for the user to and the app connection

### Quick start example

```js
import { webln } from "@getalby/sdk";
const nwc = new webln.NostrWebLNProvider({
  nostrWalletConnectUrl: loadNWCUrl(),
}); // loadNWCUrl is some function to get the NWC URL from some (encrypted) storage
// or use the short version
const nwc = new webln.NWC({ nostrWalletConnectUrl: loadNWCUrl });

// connect to the relay
await nwc.enable();

// now you can send payments by passing in the invoice
const response = await nwc.sendPayment(invoice);
```

You can use NWC as a webln compatible object in your web app:

```js
// you can set the window.webln object to use the universal API to send payments:
if (!window.webln) {
  // prompt the user to connect to NWC
  window.webln = new webln.NostrWebLNProvider({
    nostrWalletConnectUrl: loadNWCUrl,
  });
  // now use any webln code
}
```

### NostrWebLNProvider Functions

The goal of the Nostr Wallet Connect provider is to be API compatible with [webln](https://www.webln.guide/). Currently not all methods are supported - see the examples/nwc directory for a list of supported methods.

#### `static withNewSecret()`

Initialized a new `NostrWebLNProvider` instance but generates a new random secret. The pubkey of that secret then needs to be authorized by the user (this can be initiated by redirecting the user to the `getAuthorizationUrl()` URL or calling `initNWC()` to open an authorization popup.

##### Example

```js
const nwc = NostrWebLNProvider.withNewSecret();
await nwc.initNWC();
```

#### sendPayment(invice: string)

Takes a bolt11 invoice and calls the NWC `pay_invoice` function.
It returns a promise object that is resolved with an object with the preimage or is rejected with an error

##### Example

```js
const nwc = new NostrWebLNProvider({ nostrWalletConnectUrl: loadNWCUrl });
await nwc.enable();
const response = await nwc.sendPayment(invoice);
console.log(response);
```

#### getNostrWalletConnectUrl()

Returns the `nostr+walletconnect://` URL which includes all the connection information (`walletPubkey`, `relayUrl`, `secret`)
This can be used to get and persist the string for later use.

#### initNWC({name: string})

Opens a new window prompt with the `getAuthorizationUrl()` (the user's NWC UI) to ask the user to authorize the app connection.
The promise resolves when the connection is authorized and the popup sends a `nwc:success` message or rejects when the prompt is closed.
Pass a `name` to the NWC provider describing the application.

```js
const nwc = NostrWebLNProvider.withNewSecret();
try {
  await nwc.initNWC({name: 'ACME app' );
} catch(e) {
  console.warn("Prompt closed");
}
await nwc.enable();
let response;
try {
  response = await nwc.sendPayment(invoice);
  // if success then the response.preimage will be only
  console.info(`payment successful, the preimage is ${response.preimage}`);
}
catch (e) {
  console.error(e.error || e);
}
```

#### React Native (Expo)

Look at our [NWC React Native Expo Demo app](https://github.com/getAlby/nwc-react-native-expo) for how to use NWC in a React Native expo project.

#### For Node.js

To use this on Node.js you first must install `websocket-polyfill` and import it:

```js
import "websocket-polyfill";
// or: require('websocket-polyfill');
```

if you get an `crypto is not defined` error, either upgrade to node.js 20 or above, or import it manually:

```js
import * as crypto from 'crypto'; // or 'node:crypto'
globalThis.crypto = crypto as any;
//or: global.crypto = require('crypto');
```

### Examples

#### Defaults

```js
import { NostrWebLNProvider } from "@getalby/sdk";

const webln = new NostrWebLNProvider(); // use defaults (connects to Alby's relay, will use window.nostr to sign the request)
await webln.enable(); // connect to the relay
const response = await webln.sendPayment(invoice);
console.log(response.preimage);

webln.close(); // close the websocket connection
```

#### Use a custom, user provided Nostr Wallet Connect URL

```js
import { NostrWebLNProvider } from '@getalby/sdk';

const webln = new NostrWebLNProvider({ nostrWalletConnectUrl: 'nostr+walletconnect://69effe7b49a6dd5cf525bd0905917a5005ffe480b58eeb8e861418cf3ae760d9?relay=wss://nostr.bitcoiner.social&secret=c60320b3ecb6c15557510d1518ef41194e9f9337c82621ddef3f979f668bfebd'); // use defaults
await webln.enable(); // connect to the relay
const response = await webln.sendPayment(invoice);
console.log(response.preimage);

webln.close(); // close the websocket connection
```

#### Generate a new NWC connect url using a locally-generated secret

```js
// same options can be provided to .withNewSecret() as creating a new NostrWebLNProvider()
const webln = webln.NostrWebLNProvider.withNewSecret();

// get the connect URL to the interface where the user has to enable the connection
webln.getConnectUrl({ name: `My app name` });
// an optional return_to parameter can be passed in
webln.getConnectUrl({
  name: `My app name`,
  returnTo: document.location.toString(),
});

// or use the `initNWC` helper which opens a popup to initiate the connection flow.
// the promise resolves once the NWC app returned.
await webln.initNWC("alby", {
  name: `My app name`,
});

// ... enable and send a payment

// if you want to get the connect url with the secret:
// const nostrWalletConnectUrl nwc.getNostrWalletConnectUrl(true)
```

## OAuth API Documentation

Please have a look a the Alby OAuth2 Wallet API:

[https://guides.getalby.com/alby-wallet-api/reference/getting-started](https://guides.getalby.com/alby-wallet-api/reference/getting-started)

### Avalilable methods

- accountBalance
- accountSummary
- accountInformation
- accountValue4Value
- invoices
- incomingInvoices
- outgoingInvoices
- getInvoice
- createInvoice
- decodeInvoice
- keysend
- sendPayment
- sendBoostagram
- sendBoostagramToAlbyAccount
- createWebhookEndpoint
- deleteWebhookEndpoint

### Examples

#### Full OAuth Authentication flow

```js
const authClient = new auth.OAuth2User({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  callback: "http://localhost:8080/callback",
  scopes: [
    "invoices:read",
    "account:read",
    "balance:read",
    "invoices:create",
    "invoices:read",
    "payments:send",
  ],
  token: {
    access_token: undefined,
    refresh_token: undefined,
    expires_at: undefined,
  }, // initialize with existing token
});

const authUrl = await authClient.generateAuthURL({
  code_challenge_method: "S256",
  // authorizeUrl: "https://getalby.com/oauth"  endpoint for authorization (replace with the appropriate URL based on the environment)
});
// open auth URL
// `code` is passed as a query parameter when the user is redirected back after authorization
await authClient.requestAccessToken(code);

// access the token response. You can store this securely for future client initializations
console.log(authClient.token);

// initialize a client
const client = new Client(authClient);

const result = await client.accountBalance();
```

#### Initialize a client from existing token details

```js
const token = loadTokenForUser(); // {access_token: string, refresh_token: string, expires_at: number}
const authClient = new auth.OAuth2User({
  client_id: process.env.CLIENT_ID,
  callback: "http://localhost:8080/callback",
  scopes: [
    "invoices:read",
    "account:read",
    "balance:read",
    "invoices:create",
    "invoices:read",
    "payments:send",
  ],
  token: token,
});

const client = new Client(authClient);
// the authClient will automatically refresh the access token if expired using the refresh token
const result = await client.createInvoice({ amount: 1000 });
```

#### Handling refresh token

Access tokens do expire. If an access token is about to expire, this library will automatically use a refresh token to retrieve a fresh one. Utilising the _tokenRefreshed_ event is a simple approach to guarantee that you always save the most recent tokens.

If token refresh fails, you can restart the OAuth Authentication flow or log the error by listening for the _tokenRefreshFailed_ event.

(Note: To prevent losing access to the user's token, only initialize one instance of the client per token pair at a time)

```js
const token = loadTokenForUser(); // {access_token: string, refresh_token: string, expires_at: number}
const authClient = new auth.OAuth2User({
  client_id: process.env.CLIENT_ID,
  callback: "http://localhost:8080/callback",
  scopes: [
    "invoices:read",
    "account:read",
    "balance:read",
    "invoices:create",
    "invoices:read",
    "payments:send",
  ],
  token: token,
});

// listen to the tokenRefreshed event
authClient.on("tokenRefreshed", (tokens) => {
  // store the tokens in database
  console.log(tokens);
});

// Listen to the tokenRefreshFailed event
authClient.on("tokenRefreshFailed", (error) => {
  // Handle the token refresh failure, for example, log the error or launch OAuth authentication flow
  console.error("Token refresh failed:", error.message);
});
```

#### Sending payments

```js
const token = loadTokenForUser(); // {access_token: string, refresh_token: string, expires_at: number}
const authClient = new auth.OAuth2User({
  client_id: process.env.CLIENT_ID,
  callback: "http://localhost:8080/callback",
  scopes: [
    "invoices:read",
    "account:read",
    "balance:read",
    "invoices:create",
    "invoices:read",
    "payments:send",
  ],
  token: token,
});

const client = new Client(authClient);
// the authClient will automatically refresh the access token if expired using the refresh token

await client.sendPayment({ invoice: bolt11 });

await client.keysend({
  destination: nodekey,
  amount: 10,
  memo: memo,
});
```

#### Send a boostagram

refer also to the boostagram spec: https://github.com/lightning/blips/blob/master/blip-0010.md

```js
const token = loadTokenForUser(); // {access_token: string, refresh_token: string, expires_at: number}
const authClient = new auth.OAuth2User({
  client_id: process.env.CLIENT_ID,
  callback: "http://localhost:8080/callback",
  scopes: ["payments:send"],
  token: token,
});

const client = new Client(authClient);
// the authClient will automatically refresh the access token if expired using the refresh token

// pass in an array if you want to send multiple boostagrams with one call
await client.sendBoostagram({
  recipient: {
    address:
      "030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3",
    customKey: "696969",
    customValue: "bNVHj0WZ0aLPPAesnn9M",
  },
  amount: 10,
  // spec: https://github.com/lightning/blips/blob/master/blip-0010.md
  boostagram: {
    app_name: "Alby SDK Demo",
    value_msat_total: 49960, // TOTAL Number of millisats for the payment (all splits together, before fees. The actual number someone entered in their player, for numerology purposes.)
    value_msat: 2121, // Number of millisats for this split payment
    url: "https://feeds.buzzsprout.com/xxx.rss",
    podcast: "Podcast title",
    action: "boost",
    episode: "The episode title",
    episode_guid: "Buzzsprout-xxx",
    ts: 574,
    name: "Podcaster - the recipient name",
    sender_name: "Satoshi - the sender/listener name",
  },
});

// or manually through the keysend:

// pass in an array if you want to do multiple keysend payments with one call
await client.keysend({
  destination: nodekey,
  amount: 10,
  customRecords: {
    7629169: JSON.stringify(boostagram),
    696969: "user",
  },
});
```

#### Send multiple boostagrams

You often want to send a boostagram for multiple splits. You can do this with one API call. Simply pass in an array of boostagrams. See example above.

```js
const response = await client.sendBoostagram([
  boostagram1,
  boostagram2,
  boostagram3,
]);

console.log(response.keysends);
```

`response.keysends` is an array of objects that either has an `error` key if a payment faild or the `keysend` key if everything succeeded.

```json
{
  "keysends": [
    {
      "keysend": {
        "amount": 10,
        "fee": 0,
        "destination": "xx",
        "payment_preimage": "xx",
        "payment_hash": "xx"
      }
    },
    {
      "keysend": {
        "amount": 10,
        "fee": 0,
        "destination": "xxx",
        "payment_preimage": "xxx",
        "payment_hash": "xxx"
      }
    }
  ]
}
```

#### Decoding an invoice

For quick invoice decoding without an API request please see Alby's [Lightning Tools package](https://github.com/getAlby/js-lightning-tools#basic-invoice-decoding).

For more invoice details you can use the Alby Wallet API:

```js
const decodedInvoice = await client.decodeInvoice(paymentRequest);
const {payment_hash, amount, description, ...} = decodedInvoice;
```

## fetch() dependency

This library relies on a global `fetch()` function which will only work in browsers and node v18.x or newer. In older versions you can manually install a global fetch option or polyfill if needed.

For example:

```js
import fetch from "cross-fetch"; // or "@inrupt/universal-fetch"
globalThis.fetch = fetch;

// or as a polyfill:
import "cross-fetch/polyfill";
```

## Full usage examples

You can find examples in the [examples/](examples/) directory.

## Need help?

We are happy to help, please contact us or create an issue.

- [Twitter: @getAlby](https://twitter.com/getAlby)
- [Telegram Community Chat](https://t.me/getAlby)
- e-mail to support@getalby.com
- [bitcoin.design](https://bitcoin.design/) Slack community [#lightning-browser-extension](https://bitcoindesign.slack.com/archives/C02591ADXM2)
- Read the [Alby developer guide](https://guides.getalby.com/developer-guide) to better understand how Alby packages and APIs can be used to power your app.

## Thanks

The client and the setup is inspired and based on the [twitter-api-typescript-sdk](https://github.com/twitterdev/twitter-api-typescript-sdk).

## License

MIT
