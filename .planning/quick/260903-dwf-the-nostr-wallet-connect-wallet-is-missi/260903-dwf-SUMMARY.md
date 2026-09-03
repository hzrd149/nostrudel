---
phase: quick-260903-dwf
plan: 01
subsystem: wallet
tags: [nwc, nip-47, wallet, permissions]
requires:
  - "NWC QR connect flow (add-wallet-modal.tsx NwcQrConnect)"
  - "createNwcBackend listTransactions consumer (src/services/wallets.ts)"
provides:
  - "list_transactions permission granted by NWC backends for newly connected wallets via QR flow"
affects:
  - "Wallet view history tab (transactions render instead of staying empty)"
tech-stack:
  added: []
  patterns:
    - "NIP-47 method grant via getAuthURI methods array (snake_case literals)"
key-files:
  created: []
  modified:
    - src/views/settings/wallet/add-wallet-modal.tsx
decisions:
  - "Only the QR flow's getAuthURI was changed; the paste-string flow inherits whatever permissions the pasted URI carries, and the service-side listTransactions call already worked once permission is granted"
metrics:
  duration: 5 min
  completed: 2026-09-03
status: complete
actuals:
  tokens: 38
  tasks: 1
  commits: 1
estimate:
  tokens: 15000
---

# Quick Task 260903-dwf: Add list_transactions to NWC wallet-auth URI Summary

**One-liner:** Added `list_transactions` to the NIP-47 permissions requested by noStrudel's NWC QR connect flow so wallet history loads.

## What Was Done

- `src/views/settings/wallet/add-wallet-modal.tsx` (line 58): the `getAuthURI` methods array changed from
  `["get_balance", "get_info", "make_invoice", "pay_invoice"]` to
  `["get_balance", "get_info", "list_transactions", "make_invoice", "pay_invoice"]`.
- Verified `"list_transactions"` is a valid `TWalletMethod` name in the installed applesauce-wallet-connect (`node_modules/applesauce-wallet-connect/dist/helpers/methods.d.ts:155`), matching the snake_case convention of the existing entries.
- Single-line diff in one file; no other behavior touched.

## Why

`src/services/wallets.ts` (`createNwcBackend` refresh) calls `client.listTransactions({ limit: 50 })`, which NIP-47 backends (e.g. Alby) reject when that method was never granted. The catch in `wallets.ts` swallowed the error and the `history$` observable never emitted, so the wallet view showed no transactions.

## Verification

- `grep -c '"list_transactions"' src/views/settings/wallet/add-wallet-modal.tsx` → **1** ✅
- `npx tsc --project tsconfig.json --noEmit` → **zero errors in `add-wallet-modal.tsx`** ✅ (see Deviations for pre-existing unrelated failures)
- Manual (optional, post-hoc): connect an Alby (or other NIP-47) wallet via Settings → Wallet → Connect a wallet → QR; the wallet view history tab lists transactions.

## Important Note for Users

Wallets connected **before** this fix keep their old permission set — permissions are baked into the persisted connection string. Users must **reconnect an existing NWC wallet** to gain transaction history; newly connected wallets get it automatically.

## Deviations from Plan

None for the task itself — plan executed exactly as written (one-line diff).

**Out-of-scope discovery (pre-existing):** `npx tsc --noEmit` fails with ~44 errors in napplet files (`napplet-frame.tsx`, `napplets.ts`, `napplet-shell-provider.tsx`) because `@kehto/*` and `@napplet/*` are declared in package.json but not installed in this environment's node_modules. Not caused by this change (the changed file type-checks clean); logged to `deferred-items.md` per scope-boundary rules. Not fixed: package installs are excluded from auto-fix.

## Known Stubs

None.

## Self-Check: PASSED

- File check: `src/views/settings/wallet/add-wallet-modal.tsx` modified and committed — FOUND
- Commit check: `774a08dfc` on branch `next` — FOUND
