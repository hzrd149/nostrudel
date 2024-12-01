# Version 1.0.0 Migration guide

⚠️ Upgrading to version 1.0.0 will come with breaking changes! Please follow the migration guide for a smooth transition to the new version.

## Context

In Version 1.0.0 the api version of mints has been upgraded to `v1`. Please read the `v1` [v1 cleanup PR](https://github.com/cashubtc/nuts/pull/55) to understand more about how the API has changed.

## Breaking changes

### ⚠️ Important! When upgrading to this version, the `hash2curve` function and the `default secret format` have changed. This means deterministic secret derivation will produce NOT THE SAME SECRETS as before. When upgrading to this version, wallets that have been using deterministic secrets (seed phrase) must reset counters and then `self spend`/`refresh` all proofs, so that the backups continue working.

---

### Decoding LN invoices

**Removed LN invoice decode:**
Decoding LN invoices is no longer used inside the lib.

**How to fix:** If you need to decode LN invoices, you can use

> npm i [@gandlaf21/bolt11-decode](https://www.npmjs.com/package/@gandlaf21/bolt11-decode)

---

### `CashuWallet` interface changes

**`receive()` no longer supports multi-token tokens**

To reduce complexity, simplify error handling and to prepare for token V4, this feature has been removed. only the first token inside a token will be processed

**optional function AND constructor parameters are now in an onpional `options?` Object**

Utility functions now have an `options` object for optional parameters, instead of passing them directly

**`requestMint(amount: number)` --> `createMintQuote(amount: number)`**
Now returns the following:

```typescript
type MintQuoteResponse = {
	request: string;
	quote: string;
	paid: boolean;
	expiry: number;
	state: MintQuoteState;
};
```

where `request` is the invoice to be paid, and `quote` is the identifier used to pass to `mintTokens()`.

**`requestTokens()` --> `mintTokens()`**

---

**`createMeltQuote(invoice: string)`** is now used to get fee estimation and conversion quotes instead of `getFee()` and returns:

```typescript
type MeltQuoteResponse = {
	quote: string;
	amount: number;
	fee_reserve: number;
	paid: boolean;
	expiry: number;
	payment_preimage: string;
	state: MeltQuoteState;
	change?: Array<SerializedBlindedSignature>;
};
```

where `quote` is the identifier to pass to `meltTokens()`

---

**`receive()`** and **`receiveTokenEntry()`** now return `Array<Proofs>`

where `Proofs` are the newly created `Proofs` from the received token. Will now throw an error instead of returning `proofsWithError`

---

### Model changes

**`MintKeys`--> `Keys`**:
`MintKeys` now include the `keys`, `id` and `unit`

```typescript
type MintKeys = {
	id: string;
	unit: string;
	keys: Keys;
};

type Keys = { [amount: number]: string };
```

---

**`MintKeyset`**:
Used to be a string array, but now contains the additional fields `active` and `unit`

```typescript
type MintKeyset = {
	id: string;
	unit: string;
	active: boolean;
};
```

---

**`BlindedMessages`:** now include the field `id`, corresponding with the mints `keysetId`

```typescript
type BlindedMessage {
	amount: number;
	B_: ProjPointType<bigint>;
	id: string;
}
```

---

### Pattern changes

**removed `newKeys` from returns**: Functions no longer return `newKeys`. Wallets now specify the keyset they use in the BlindedMessage via the `id` field.
