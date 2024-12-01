# @lightninglabs/lnc-web

## A npm module for Lightning Node Connect

## Install

`npm i @lightninglabs/lnc-web`

## API Design

#### Set-up and connection

The constructor for the LNC object takes a parameters object with the three following fields:

-   `pairingPhrase` (string): Your LNC pairing phrase
-   `serverHost` (string): Specify a custom Lightning Node Connect proxy server. If not specified we'll default to `mailbox.terminal.lightning.today:443`.
-   `wasmClientCode` (string): Custom location for the WASM client code. Can be remote or local. If not specified we’ll default to our instance on our CDN.
-   `namespace` (string): JavaScript namespace used for the main WASM calls. You can maintain multiple connections if you use different namespaces. If not specified we'll default to `default`.
-   `password` (string): By default, this module will handle storage of your local and remote keys for you in local storage. We highly recommend encrypting that data with a password you set here.

```typescript
import LNC from ‘@lightninglabs/lnc-web’;

const pairingPhrase = ‘artefact morning piano photo consider light’;
const password = 'u*E0F?gU\d($N&Ckh8u)tLm';

// default connection using WASM from CDN
// WASM loaded on object creation
// default host: mailbox.terminal.lightning.today:443
// password used for encrypting credentials
const lnc = new LNC({
   pairingPhrase,
   password
});

// using custom Lightning Node Connect proxy server
const lnc = new LNC({
   pairingPhrase,
   serverHost: ‘custom.lnd-server.host:443’
});

// using WASM pulled into app
const lnc = new LNC({
   pairingPhrase,
   wasmClientCode: ‘/path/to/​​wasm-client.wasm’
});

// using WASM from external link
const lnc = new LNC({
   pairingPhrase,
   wasmClientCode: ‘https://dev.example/wasm-client.wasm’
});

// check ready status
lnc.isReady();

// connect
lnc.connect();

// check connection status
lnc.isConnected();

// disconnect
lnc.disconnect();
```

#### Base functions

All of the services (lnd, loop, pool, faraday) will be objects under the main lnc object. Each services’ sub-services will be underneath each service object, and each sub-service function below that (except in the case of faraday which only has one service - its functions will live directly under it). All service, function, and param names will be camel-cased.

```typescript
const { lnd, loop, pool, faraday } = lnc;

// all functions on the base object should have proper types
// sub-servers exist as objects on each main service
lnd.lightning.listInvoices();
lnd.lightning.connectPeer({ addr: ‘03aa49c1e98ff4f216d886c09da9961c516aca22812c108af1b187896ded89807e@m3keajflswtfq3bw4kzvxtbru7r4z4cp5stlreppdllhp5a7vuvjzqyd.onion:9735’ });

const signature = lnd.signer.signMessage({...params});

const swaps = await loop.swapClient.listSwaps();
const poolAccount = await pool.trader.initAccount({
   accountValue: 100000000,
   relativeHeight: 1000
 });

const insights = await faraday.channelInsights();
```

#### Subscriptions

```typescript
const { lnd } = lnc;

// handle subscriptions
lnd.lightning.subscribeTransactions(
   params,
   transaction => handleNewData(transaction),
   error => handleError(error),
);

lnd.lightning.subscribeChannelEvents(
   params,
   event => handleNewChannelEventData(event),
   error => handleError(error),
);
```

## Further documentation

- https://docs.lightning.engineering/lightning-network-tools/lightning-terminal/lnc-npm
