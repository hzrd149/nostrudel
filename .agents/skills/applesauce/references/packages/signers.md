# applesauce-signer

A collection of signer classes for applesauce that are compatible with the [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) API.

## Documentation

For detailed documentation and API reference, see:

- [Signers Documentation](https://applesauce.build/signers/signers.html)
- [Nostr Connect Documentation](https://applesauce.build/signers/nostr-connect.html)
- [API Reference](https://applesauce.build/typedoc/modules/applesauce-signers.html)

## Available Signers

### Password Signer (NIP-49)

A secure signer that encrypts private keys using [NIP-49](https://github.com/nostr-protocol/nips/blob/master/49.md).

```ts
// Create a new password signer
const signer = new PasswordSigner();

// Set up with a new key and password
const randomBytes = new Uint8Array(64);
window.crypto.getRandomValues(randomBytes);

signer.key = randomBytes;
signer.setPassword("your-password");

// Unlock the signer when needed
await signer.unlock("your-password");
```

### Simple Signer

A basic signer that holds the secret key in memory with NIP-04 and NIP-44 encryption support.

```ts
// Create new signer with random key
const signer = new PrivateKeySigner();

// Or import existing key
const key = new Uint8Array(32);
window.crypto.getRandomValues(key);
const signer = new PrivateKeySigner(key);
```

### Nostr Connect Signer (NIP-46)

A client-side implementation for remote signing using [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md).

```ts
// First, set up the required relay communication methods
import { Observable } from "rxjs";

// Define subscription method for receiving events
const subscriptionMethod = (filters, relays) => {
  return new Observable((observer) => {
    // Create subscription to relays
    const cleanup = subscribeToRelays(relays, filters, (event) => {
      observer.next(event);
    });
    return () => cleanup();
  });
};

// Define publish method for sending events
const publishMethod = async (event, relays) => {
  for (const relay of relays) await publishToRelay(relay, event);
};

// You can set these methods globally at app initialization
NostrConnectSigner.subscriptionMethod = subscriptionMethod;
NostrConnectSigner.publishMethod = publishMethod;

// Now create and use the signer
const signer = new NostrConnectSigner({
  remote: "<remote signer pubkey>",
  relays: ["wss://relay.example.com"],
  // Or pass methods directly to the constructor
  subscriptionMethod,
  publishMethod,
});

// Create a connection URI for your app
const uri = signer.getNostrConnectURI({
  name: "My App",
  url: "https://example.com",
  permissions: NostrConnectSigner.buildSigningPermissions([0, 1, 3]),
});

// Connect using bunker URI
const bunkerSigner = await NostrConnectSigner.fromBunkerURI("bunker://...your-uri-here...", {
  permissions: NostrConnectSigner.buildSigningPermissions([0, 1, 3]),
});
```

### Other Signers

- **Serial Port Signer**: For hardware signing devices (Chrome browsers only)
- **Amber Clipboard Signer**: Integration with Amber wallet's web API
