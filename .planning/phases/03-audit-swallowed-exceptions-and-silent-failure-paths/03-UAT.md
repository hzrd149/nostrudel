---
status: partial
phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
source: [03-VERIFICATION.md]
started: 2026-09-15T15:42:57Z
updated: "2026-09-15T16:10:27Z"
---

## Current Test

[testing paused — 1 item outstanding]

## Tests

### 1. useAsyncAction loading state and failure toast on the three converted controls (D-09)

expected: Run `pnpm dev`, then click Remove Mint (wallet mint list), Remove Relay (Settings → Relays), and Clear Database (Settings → Cache → "More options"). Each button shows the same spinner/disabled behavior as before the conversion; a forced failure raises a toast. Clear Database additionally wipes the database and reloads the page; its Enable/menu spinners are parent-prop driven and should be unchanged.
result: pass

### 2. decrypt-placeholder.tsx renders the existing error Alert on a real legacy-DM decryption failure (D-11)

expected: Trigger a legacy-DM decryption failure in a running app (e.g. an undecryptable legacy DM). The `if (error)` branch renders the Chakra Alert with `error.message`, a DebugEventButton, and a working "Try again" button — unchanged from before, now driven solely by `useLegacyMessagePlaintext`'s own error state.
result: pass

### 3. native-scanner.ts barcode-install promise still settles after the async-executor refactor (D-13)

expected: In a Capacitor native build, trigger the Google Barcode Scanner module install flow and exercise the COMPLETED, FAILED and CANCELED paths. All three terminal states settle the promise and remove the listener exactly as before the refactor.
result: blocked
blocked_by: release-build
reason: Native-only Capacitor plugin code; cannot be exercised in the web dev server or by `pnpm build`. Explicitly accepted as residual risk by the maintainer on 2026-09-15, a disposition 03-VALIDATION.md's Manual-Only Verifications row 3 already sanctions ("or accept as residual risk and rely on `pnpm build` typecheck"). Carries a known, accepted, non-regressive unhandled-rejection path: `BarcodeScanner.addListener(...).then((handle) => { sub = handle; })` has no `.catch`, so an addListener rejection would leave `installNativeScanner` hanging — the prior async-executor form swallowed this identically, which is why `eslint/no-async-promise-executor` fired on it.

## Summary

total: 3
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 1

## Gaps
