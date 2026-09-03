---
phase: quick-260903-dwf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/views/settings/wallet/add-wallet-modal.tsx
autonomous: true
requirements: [QUICK-260903-NWC-LISTTX]
estimate:
  tokens: 15000
  raw_tokens: 8000
  tasks: 1
  confidence: high

must_haves:
  truths:
    - A wallet connected via the QR auth flow grants noStrudel permission to call list_transactions, so the NWC backend no longer rejects history requests and transactions render in the wallet view.
  artifacts:
    - src/views/settings/wallet/add-wallet-modal.tsx (methods array includes list_transactions)
  key_links:
    - add-wallet-modal.tsx getAuthURI methods array → permissions granted by NWC backend → client.listTransactions({ limit: 50 }) in src/services/wallets.ts refresh()
---

<objective>
Add the missing `list_transactions` permission to the NWC wallet-auth URI so the wallet history view works.

Purpose: The QR connect flow in `add-wallet-modal.tsx` requests only `get_balance`, `get_info`, `make_invoice`, and `pay_invoice` from the NWC wallet. The wallet service (`src/services/wallets.ts`, `createNwcBackend` refresh) calls `client.listTransactions({ limit: 50 })`, which NIP-47 backends (e.g. Alby) reject because that method was never granted — the catch at `wallets.ts:256` swallows the error and the history$ observable never emits, so no transactions are listed in the wallet view.

Output: One-line fix adding `list_transactions` to the `getAuthURI` methods array.
</objective>

<execution_context>
@/home/robert/.config/opencode/gsd-core/workflows/execute-plan.md
@/home/robert/.config/opencode/gsd-core/templates/summary.md
</execution_context>

<context>
@/home/robert/Projects/noStrudel/AGENTS.md
src/views/settings/wallet/add-wallet-modal.tsx (the only getAuthURI call site — verified via grep)
src/services/wallets.ts (consumer: `client.listTransactions({ limit: 50 })` in createNwcBackend)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add list_transactions to NWC auth URI methods</name>
  <files>src/views/settings/wallet/add-wallet-modal.tsx</files>
  <action>
    In `NwcQrConnect`, line 58: change the `getAuthURI` methods array from `["get_balance", "get_info", "make_invoice", "pay_invoice"]` to also include `"list_transactions"`. This is the only `getAuthURI` call site in the codebase (verified by grep), and `list_transactions` is a valid `TWalletMethod` name in applesauce-wallet-connect (`node_modules/applesauce-wallet-connect/dist/helpers/methods.d.ts:155`), matching the snake_case convention of the existing entries. Touch nothing else — the paste-string flow takes whatever permissions the pasted URI carries, and the service-side `listTransactions` call already exists and works once permission is granted.
  </action>
  <verify>
    <automated>grep -c '"list_transactions"' src/views/settings/wallet/add-wallet-modal.tsx && npx tsc --project tsconfig.json --noEmit</automated>
  </verify>
  <done>
    The getAuthURI methods array in add-wallet-modal.tsx contains "list_transactions" alongside get_balance, get_info, make_invoice, and pay_invoice, and the project type-checks cleanly. Note for the SUMMARY: wallets connected before this fix keep their old permission set (permissions are baked into the persisted connection string) — users must reconnect an existing NWC wallet to gain transaction history; newly connected wallets get it automatically.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --project tsconfig.json --noEmit` passes (no type errors from the string-literal change).
- `grep -c '"list_transactions"' src/views/settings/wallet/add-wallet-modal.tsx` returns 1.
- Manual (optional, post-hoc): connect an Alby (or other NIP-47) wallet via the QR flow in Settings → Wallet → Connect a wallet; the wallet view history tab lists transactions instead of staying empty.
</verification>

<success_criteria>
- NWC auth URI requests the list_transactions permission.
- Existing behavior (get_balance, get_info, make_invoice, pay_invoice) unchanged.
- Type-check green; single-line diff in one file.
</success_criteria>

<output>
Create `.planning/quick/260903-dwf-the-nostr-wallet-connect-wallet-is-missi/260903-dwf-SUMMARY.md` when done
</output>
