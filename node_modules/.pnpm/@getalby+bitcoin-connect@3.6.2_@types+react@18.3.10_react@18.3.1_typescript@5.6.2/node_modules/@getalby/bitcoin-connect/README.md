![image](https://github.com/getAlby/bitcoin-connect/assets/33993199/a0eaf887-2ef1-4369-b6bf-7ef977ca2b67)

# Bitcoin Connect

This project includes web components for connecting to Lightning wallets and enabling [WebLN](https://webln.guide). Websites only need to interface with WebLN to connect with multiple wallets, just like the Alby extension. However, no extension is needed to be installed - Bitcoin Connect is provided by the website. Users can connect from both desktop and mobile devices, using their favorite browser. PWAs _just work_. Bitcoin Connect's components work with pure HTML and all Javascript libraries or frameworks, such as React, Angular, Vue, Solid.js, etc.

🆕 Bitcoin Connect also supports a nice invoice payment UI that gives a multitude of options to a user to pay an invoice. Accept payments with a single line of code.

🥇 Bitcoin Connect won the [BOLT FUN Legends of Lightning vol.2](https://bolt.fun/story/legendsoflightning-2023-winners--1444) hackathon on 17 December, 2023.

🍯 Bitcoin Connect has some money for bounties. If you would like to contribute a new feature or add Bitcoin Connect to a popular webapp please contact hello@getalby.com.

## 🛝 Try it out

[Demo](https://bitcoin-connect.com)

## 🧳 Migration Guide

There are multiple breaking changes in **v3**. See our migration guide [here](doc/MIGRATION_v3.md). Click [here](https://github.com/getAlby/bitcoin-connect/tree/v2.4.2-alpha) for v2.

## 🚀 Quick Start

> 🚧WARNING🚧: this package is currently in Alpha. It's got awesome features, but is using new features of protocols such as WebLN and NWC which have not been finalized, and there may be breaking changes or bugs.

### React Package

`npm install @getalby/bitcoin-connect-react` or `yarn add @getalby/bitcoin-connect-react`

### Web Components Package

`npm install @getalby/bitcoin-connect` or `yarn add @getalby/bitcoin-connect`

### HTML (CDN)

You can use Bitcoin Connect without any build tools:

```html
<script type="module">
  import {launchModal} from 'https://esm.sh/@getalby/bitcoin-connect@3.6.1'; // jsdelivr.net, skypack.dev also work

  // use Bitcoin connect API normally...
  launchModal();

  // or if you just want access to the web components:
  import 'https://esm.sh/@getalby/bitcoin-connect@3.6.1';
</script>

<!-- Bitcoin Connect components are now available -->
<bc-button></bc-button>
```

## 🤙 Usage

### Pure JS

```ts
import {
  init,
  launchModal,
  launchPaymentModal,
  requestProvider,
} from '@getalby/bitcoin-connect';

// Initialize Bitcoin Connect
init({
  appName: 'My Lightning App', // your app name
});

// launch modal programmatically
await launchModal();

// launch modal to receive a payment
await launchPaymentModal({
  invoice: 'lnbc...',
  onPaid: ({preimage}) => alert('Paid: ' + preimage), // NOTE: only fired if paid with WebLN - see full api documentation below
});

// or request a WebLN provider to use the full WebLN API
const weblnProvider = await requestProvider();
const {preimage} = await weblnProvider.sendPayment('lnbc...');
```

_Continue further down for the full Bitcoin Connect API._

### React

```jsx
import {Button, PayButton, init, launchModal, launchPaymentModal, closeModal, requestProvider, Connect, SendPayment} from '@getalby/bitcoin-connect-react';

// Initialize Bitcoin Connect
init({
  appName: "My Lightning App", // your app name
})

// render the Bitcoin Connect button
<Button onConnect={(provider) => {
  const {preimage} = await provider.sendPayment("lnbc...");
}}/>

// render a "Pay Now" button
// invoice can be unset initially - using the onClick function is a good time to fetch the invoice
// set the `payment` prop to override the payment status if a payment was made externally
<PayButton invoice={invoice} onClick={() => {
  invoice = fetchInvoice();
  setInvoice(invoice)
}} onPaid={(response) => alert("Paid! " + response.preimage)} payment={{preimage: 'my-preimage'}}/>

// render the connect flow on its own without the modal
<Connect/>

// render the send payment flow on its own without the modal (for E-Commerce flows)
// set the `payment` prop to override the payment status if a payment was made externally
<Payment invoice="lnbc..." onPaid={(response) => alert("Paid! " + response.preimage)} payment={{preimage: 'my-preimage'}}/>

// request a provider
<button onClick={() => {
  // if no WebLN provider exists, it will launch the modal
  const weblnProvider = await requestProvider();
  const { preimage } = await weblnProvider.sendPayment("lnbc...")
}}>
  Request WebLN provider
</button>

// open modal programmatically to connect a wallet
<button onClick={() => launchModal()}>
  Programmatically launch modal
</button>

// open modal programmatically to pay an invoice (for one-off payments)
<button onClick={() => launchPaymentModal({invoice: "lnbc...", onPaid: ({preimage}) => alert("Paid: " + preimage)})}>
  Programmatically launch payment modal
</button>

// close modal programmatically
closeModal();
```

#### NextJS / SSR

Make sure to only import and render the components **client side**. This can be done either by creating a wrapper component with using next/dynamic with `ssr: false` (and add the 'use client' directive when using the NextJS app router), or a dynamic import e.g.

```tsx
"use client"
import dynamic from 'next/dynamic';
const Button = dynamic(
  () => import('@getalby/bitcoin-connect-react').then((mod) => mod.Button),
  {
    ssr: false,
  }
);

// Render the Button normally

<Button />

// or to use the API:

<button
  onClick={async () => {
    const launchModal = await import('@getalby/bitcoin-connect-react').then(
      (mod) => mod.launchModal
    );
    launchModal();
  }}
>
  Launch modal
</button>

// to set the global webln object:

useEffect(() => {
  // init bitcoin connect to provide webln
  const {onConnected} = await import('@getalby/bitcoin-connect-react').then(
    (mod) => mod.onConnected
  );
  const unsub = onConnected((provider) => {
    window.webln = provider;
  });

  return () => {
    unsub();
  };
}, []);

```

See [NextJS](./demos/nextjs/) and [NextJS legacy](./demos/nextjs-legacy/) demos for full examples.

### Other Frameworks

> 💡 The core Bitcoin Connect package works on all frameworks because it is powered by web components. However, a wrapper can simplify usage of Bitcoin Connect.

_Use another popular framework? please let us know or feel free to create a PR for a wrapper. See the React package for an example implementation._

### Pure HTML

#### Components

Bitcoin Connect exposes the following web components for allowing users to connect their desired Lightning wallet:

- `<bc-button/>` - launches the Bitcoin Connect Modal on click
  - Arguments:
    - `title` - (optional) change the title of the button
- `<bc-pay-button/>` - launches the Bitcoin Connect Payment Modal on click
  - Arguments:
    - `invoice` - BOLT11 invoice. Modal will only open if an invoice is set
    - `payment-methods` (optional) "all" | "external" | "internal"
    - `title` - (optional) change the title of the button
    - `preimage` - (optional) set this if you received an external payment
  - Events:
    - `click` - fires when the button is clicked. You can load an invoice here and set it on the button using `setAttribute('invoice', 'lnbc...')` which will then automatically launch the modal
    - `bc:onpaid` - fires event with WebLN payment response in `event.detail` (contains `preimage`)
- `<bc-connect/>` - render connect wallet UI without modal
- `<bc-payment/>` - render a payment request UI without modal
  - Arguments:
    - `invoice` - BOLT11 invoice
    - `payment-methods` (optional) "all" | "external" | "internal"
    - `paid` - **Experimental** set to true to mark payment was made externally (This will change to `preimage` in v4)
  - Events:
    - `bc:onpaid` - fires event with WebLN payment response in `event.detail` (contains `preimage`)

### Bitcoin Connect API

#### Initializing Bitcoin Connect

```ts
import {init} from '@getalby/bitcoin-connect-react';

// Initialize Bitcoin Connect
init({
  appName: 'My Lightning App', // your app name
  // filters: ["nwc"],
  // showBalance: true,
  // providerConfig: {
  //   nwc: {
  //     authorizationUrlOptions: {
  //       requestMethods: ['get_balance', 'make_invoice', 'lookup_invoice'],
  //     },
  //   },
  // }
});
```

- `appName` - Name of the app requesting access to wallet. Currently used for NWC connections (Alby and Mutiny)
- `filters` - Filter the type of connectors you want to show. Example: "nwc" (only show NWC connectors).
- `showBalance` - If false, do not request the connected wallet's balance
- `providerConfig` - **Experimental**: add provider-specific configuration (for NWC, LNC, LNbits etc). Currently only `nwc.authorizationUrlOptions` is supported. `NWCAuthorizationUrlOptions` can be found in the [Alby JS SDK](https://github.com/getAlby/js-sdk).

#### Requesting a provider

With one line of code you can ensure you have a WebLN provider available and ready to use. If one is not available, the Bitcoin connect modal will be launched. This should be called on a user interaction to avoid the modal unexpectedly being shown to the user.

```ts
import {requestProvider} from '@getalby/bitcoin-connect';

const provider = await requestProvider();
await provider.sendPayment('lnbc...');
```

#### Programmatically launching the modal

The modal can then be launched with:

```ts
import {launchModal} from '@getalby/bitcoin-connect';

launchModal(); // A `<bc-modal/>` element will be injected into the DOM
```

#### Programmatically launching the modal to receive a payment

To receive a payment the modal can be programmatically opened with:

```ts
import {launchPaymentModal} from '@getalby/bitcoin-connect';

const {setPaid} = launchPaymentModal({
  invoice: 'lnbc...',
  //paymentMethods: "all" // "all" | "external" | "internal"
  onPaid: (response) => {
    clearInterval(checkPaymentInterval);
    alert('Received payment! ' + response.preimage);
  },
  onCancelled: () => {
    clearInterval(checkPaymentInterval);
    alert('Payment cancelled');
  },
});

// below is an example of LNURL-verify from https://github.com/getAlby/js-lightning-tools
// you can write your own polling function to check if your invoice has been paid
// and then call the `setPaid` function.
const checkPaymentInterval = setInterval(async () => {
  const paid = await invoice.verifyPayment();

  if (paid && invoice.preimage) {
    setPaid({
      preimage: invoice.preimage,
    });
  }
}, 1000);
```

> Note: for P2P payments made externally there is no way for Bitcoin Connect to know when the payment has happened. `launchPaymentModal` is more for simplifying e-commerce usecases where you are able to check the invoice yourself.

#### Programmatically closing the modal

```ts
import {closeModal} from '@getalby/bitcoin-connect';

closeModal();
```

#### Disconnect from wallet

```ts
import {disconnect} from '@getalby/bitcoin-connect';

disconnect();
```

#### Get connector config

Returns the saved configuration of the currently-connected connector (if connected)

```ts
import {getConnectorConfig} from '@getalby/bitcoin-connect';

const connectorConfig = getConnectorConfig();
if (connectorConfig) {
  // can now access e.g. connectorConfig.connectorName
}
```

#### Events

##### onConnected

This event fires when a WebLN provider is made available.

- When a user connects for the first time
- On page reload when a user has previously connected

```ts
import {onConnected} from '@getalby/bitcoin-connect';

const unsub = onConnected(async (provider) => {
  const {preimage} = await provider.sendPayment('lnbc...');
});
unsub();
```

##### onConnecting

This event fires when a WebLN provider is initializing.

- When a user connects for the first time
- On page reload when a user has previously connected

```ts
import {onConnecting} from '@getalby/bitcoin-connect';

const unsub = onConnecting(async () => {
  // do something...
});
unsub();
```

##### onDisconnected

This event fires when the user manually disconnects from Bitcoin Connect.

```ts
import {onDisconnected} from '@getalby/bitcoin-connect';

const unsub = onDisconnected(async () => {
  // do something...
});
unsub();
```

##### onModalOpened

This event fires when the Bitcoin Connect modal opens.

```ts
import {onModalOpened} from '@getalby/bitcoin-connect';

const unsub = onModalOpened(async () => {
  // do something...
});
unsub();
```

##### onModalClosed

This event fires when the Bitcoin Connect modal closes.

```ts
import {onModalClosed} from '@getalby/bitcoin-connect';

const unsub = onModalClosed(async () => {
  // do something...
});
unsub();
```

### WebLN global object

> WARNING: webln is no longer injected into the window object by default. If you need this, execute the following code:

```ts
import {onConnected} from '@getalby/bitcoin-connect';

onConnected((provider) => {
  window.webln = provider;
});
```

_More methods coming soon. Is something missing that you'd need? let us know!_

#### WebLN events

Providers also should fire a `webln:connected` event. See `webln.guide`.

### Styling

These variables must be set at the root or on a container element wrapping any bitcoin connect components.

```css
html {
  --bc-color-brand: #196ce7;
  --bc-color-brand-dark: #3994ff; /* use a different brand color in dark mode */
  --bc-brand-mix: 100%; /* how much to mix the brand color with default foreground color */
  --bc-color-brand-button-text: #ffffff; /* override text color for primary button. Normally this is based on the luminance of the brand color */
  --bc-color-brand-button-text-dark: #ffffff; /* override text color for primary button in dark mode. Normally this is based on the luminance of the brand color in dark mode */
}
```

> 💡 using near-white or black brand colors? either set a lower `bc-brand-mix` or make sure to use an off-white for `bc-color-brand` and off-black for `bc-color-brand-dark` to avoid conflicts with the modal background color.

### Fonts

By default Bitcoin Connect does not use custom fonts for reduced footprint and privacy, however custom fonts can be used by providing CSS for the `Inter` (sans serif) and `Roboto Mono` (monospace) families. For example in the head section of your HTML:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
<link
  href="https://fonts.googleapis.com/css2?family=Roboto Mono:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### Dark mode

#### Automatic (Recommended)

Bitcoin Connect uses `prefers-color-scheme` to automatically detect light/dark mode.

#### Manual

In case your site uses a manual theme switcher, you can force a theme by following these steps:

> see an example [here](./dev/vite/index.html)

1. set `globalThis.bcDarkMode = "class"` **before** any bitcoin connect components are rendered
2. `"dark"` must be added as a classname to the document to enable dark mode (e.g. `<html class="dark">` or `document.documentElement.classList.add('dark')`) otherwise light mode will be forced.

## Access to underlying providers (NWC, LNC etc.)

```ts
import { WebLNProviders, requestProvider } from "@getalby/bitcoin-connect";

const provider = await requestProvider();

if (provider instanceof WebLNProviders.NostrWebLNProvider) {
  provider.nostrWalletConnectUrl;
}

if (provider instanceof WebLNProviders.LNCWebLNProvider) {
  provider.lnc.lnd.lightning.listInvoices(...);
}

if (provider instanceof WebLNProviders.LnbitsWebLNProvider) {
  provider.requestLnbits('GET', '/api/v1/wallet');
}
```

## Demos

### Pure HTML Demo

See [Pure HTML](./demos/html/README.md)

> [Example codepen](https://codepen.io/rolznz/pen/VwgNajr)

### React Demo

See [React](./demos/react/README.md)

#### Example Replits

> [Request Payment Modal](https://bitcoin-connect-request-payment-modal.rolznz.repl.co/)

> [Pay invoice to a Lightning Address](https://replit.com/@getalby/Bitcoin-Connect-Donation-Demo)

> [Pay on an E-Commerce](https://replit.com/@getalby/Bitcoin-Connect-ECommerce-Demo)

> [Chatbot UI + Bitcoin Connect](https://chatbot-ui-bitcoin-connect.vercel.app) - [source](https://github.com/Alan-AC7/chatbot-ui-bitcoin-connect)

#### NextJS (App Router)

See [NextJS](./demos/nextjs/README.md)

#### NextJS Legacy (Pages Directory)

See [NextJS Legacy](./demos/nextjs-legacy/README.md)

### More demos

Open [demos](demos/README.md)

## 🛠️ Development

### Install

Run `yarn install && (cd dev/vite && yarn install)`

### Run Vite

Run `yarn dev`

### Other dev options

Open [dev](dev/README.md)

### Production Build

`yarn build`

### Testing

`yarn test`

## Need help?

We are happy to help, please contact us or create an issue.

- [Twitter: @getAlby](https://twitter.com/getAlby)
- [Telegram group](https://t.me/getAlby)
- support at getalby.com
- [bitcoin.design](https://bitcoin.design/) Discord community (find us on the #alby channel)
- Read the [Alby developer guide](https://guides.getalby.com/overall-guide/alby-for-developers/getting-started) to better understand how Alby packages and APIs can be used to power your app.

## FAQ

### How does it work?

Bitcoin Connect provides multiple options to the user to connect to a lightning wallet, each compatible with WebLN. Any already-existing providers of WebLN (such as an installed WebLN extension like Alby) are detected and offered, as well as options to create a new WebLN provider through protocols such as NWC. No matter which option you choose, a WebLN provider will become available for the website to use to interact with your lightning wallet. Similar to the Alby extension, new options (called Connectors) can be easily added as they all follow a common, simple interface. As long as there is a way to connect to a lightning wallet through Javascript, a connector can be created for it in Bitcoin Connect. We welcome any and all contributions for new connectors!

### Does this work on mobile browsers and mobile PWAs, or desktop browsers without a WebLN extension?

Yes! that's the main benefit.

### Does it work with a desktop extension enabled?

Yes. It will use the desktop extension as the default connector if it exists.

### Can I connect it to my mobile wallet?

That depends. The connection to your lightning node / wallet needs to be asynchronous so that you can use Bitcoin Connect natively on mobile websites or PWAs.

### Can a user connect any lightning wallet?

It will only work for the connectors that are shown in the modal. Some of these connectors (e.g. the Alby Browser Extension) allow to connect multiple wallets themselves. Feel free to contribute to add a new connector.

### Does it "remember" the user if they leave the page or close the browser?

Yes. Your connection is saved to localStorage

### Is this safe?

You should have a certain level of trust on the website you decide to connect your wallet with, and that they ensure there is no malicious third-party scripts which would intend to read the wallet connection configuration, either from memory or storage. We heavily recommend to add [CSP rules](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) to your site and follow [best practices](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) to prevent XSS.

Connectors with budget controls or confirmation dialogs (Alby extension or NWC) are recommended so you have full control over your connection.

### What are the high level things I need to do to add this to my site?

1. add the "Connect Wallet" button
2. wait for a connection event (using window.addEventListener) and then request to pay the invoice with window.webln

### What connectors are supported?

- [Alby Browser extension](https://getalby.com)
- [Alby NWC](https://nwc.getalby.com)
- [LNC](https://github.com/lightninglabs/lightning-node-connect)
- [LNbits](https://lnbits.com/)
- [Mutiny NWC URL](https://www.mutinywallet.com/)
- [Generic NWC URL](https://github.com/nostr-protocol/nips/blob/master/47.md)

### If a user pays with another wallet why does the modal stay open?

Bitcoin Connect cannot detect payments made externally. It's up to your app to detect the payment and then programmatically close the modal using the exposed `closeModal` function.

### Why is window.webln not set after connecting?

The global `window.webln` object can be overridden if there are multiple providers, leading to unexpected behaviour. We recommend using the `requestProvider` function to obtain a WebLN provider instead of relying on the global window object.

### Why does Bitcoin Connect not work on some pages?

Bitcoin Connect must be imported at the root component or on every component that requires webln to ensure webln is available. If you only import the button in your settings page, you'll still need to import the library where you want to make a lightning payment. We recommend using the `requestProvider` function.

## Known Issues

- NWC connectors do not work on iOS in non-secure contexts because window.crypto.subtle is unavailable. If testing on your phone, please run an https server or use an https tunnel.

## 🔥 Lit

This project is powered by Lit.

See [Get started](https://lit.dev/docs/getting-started/) on the Lit site for more information.

## BOLT FUN

Bitcoin Connect is a BOLT FUN Legends of Lightning vol.2 finalist. [Follow our project and journey](https://bolt.fun/project/bitcoin-connect).

## License

[MIT](./LICENSE)
