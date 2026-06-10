# applesauce-wallet-connect

NIP-47 Nostr Wallet Connect implementation for both clients and services.

## Features

- **WalletConnect**: Client-side implementation for connecting to NIP-47 wallet services
- **WalletService**: Service-side implementation for creating NIP-47 wallet services
- Full support for all NIP-47 methods
- TypeScript support with full type safety
- RxJS-based reactive architecture
- Support for both NIP-04 and NIP-44 encryption

## Installation

```bash
npm install applesauce-wallet-connect
```

## WalletConnect (Client)

Connect to a wallet service using a connection string:

```typescript
import { WalletConnect } from "applesauce-wallet-connect";

const wallet = WalletConnect.fromConnectURI("nostr+walletconnect://relay.example.com?secret=...&pubkey=...");

// Pay an invoice
const result = await wallet.payInvoice("lnbc1...");
console.log("Payment preimage:", result.preimage);

// Get wallet balance
const balance = await wallet.getBalance();
console.log("Balance:", balance.balance, "msats");
```

## WalletService (Service)

Create a wallet service that handles NIP-47 requests:

```typescript
import { WalletService } from "applesauce-wallet-connect";
import { PrivateKeySigner } from "applesauce-signers";

// Create a signer for the service
const signer = new PrivateKeySigner();

// Define method handlers
const handlers = {
  get_info: async () => ({
    alias: "My Wallet",
    color: "#ff0000",
    pubkey: await signer.getPublicKey(),
    network: "mainnet" as const,
    block_height: 800000,
    block_hash: "0000...0000",
    methods: ["get_info", "get_balance", "pay_invoice"],
  }),

  get_balance: async () => ({
    balance: 100000, // 100 sats in msats
  }),

  pay_invoice: async (params) => {
    // Implement your payment logic here
    console.log("Paying invoice:", params.invoice);
    return {
      preimage: "payment_preimage_here",
      fees_paid: 1000,
    };
  },
};

// Create the service
const service = new WalletService({
  subscriptionMethod: mySubscriptionMethod,
  publishMethod: myPublishMethod,
  relays: ["wss://relay.example.com"],
  signer,
  handlers,
  // Supported encryption methods will be set based on the signer
});

// Start the service
await service.start();
console.log("Wallet service started");

// Get the connection string for the wallet service
console.log(service.getConnectURI());

// Stop the service when done
service.stop();
```

## Supported Methods

Both WalletConnect and WalletService support all NIP-47 methods:

- `get_info` - Get wallet information
- `get_balance` - Get wallet balance
- `pay_invoice` - Pay a Lightning invoice
- `multi_pay_invoice` - Pay multiple invoices
- `pay_keysend` - Send a keysend payment
- `multi_pay_keysend` - Send multiple keysend payments
- `make_invoice` - Create a new invoice
- `lookup_invoice` - Look up an invoice
- `list_transactions` - List transactions

## Documentation

For more detailed documentation, visit [the docs](https://applesauce.build/).
