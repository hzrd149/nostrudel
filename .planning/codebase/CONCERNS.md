# Codebase Concerns

**Analysis Date:** 2026-07-01

## Tech Debt

**Prerelease/nightly dependency pinning (`applesauce-*` packages):**
- Issue: Several core `applesauce-*` packages are pinned to dated prerelease tags instead of semver ranges: `applesauce-accounts`, `applesauce-actions`, `applesauce-common`, `applesauce-content`, `applesauce-extra`, `applesauce-loaders`, `applesauce-react`, `applesauce-signers`, `applesauce-wallet`, `applesauce-wallet-connect` are all `"0.0.0-next-20260617211338"` in `package.json`. Only `applesauce-core`, `applesauce-relay`, and `applesauce-sqlite` use semver ranges.
- Files: `package.json`
- Impact: The app depends on unpublished/unstable nightly builds of its most central library (nostr event store, signers, wallet, accounts). Any upstream nightly regression breaks the whole app, and there is no way to safely bump one package without bumping all others to a matching nightly snapshot.
- Fix approach: Track upstream `applesauce` release milestones and migrate to stable semver ranges once available; until then, pin exact versions (already effectively pinned) and add a documented upgrade process for bumping all `applesauce-*` packages together.

**`event-zap-modal` complexity:**
- Issue: Self-documented as overly complex; combines invoice fetching, relay hint resolution, zap splits, LNURL metadata, and UI stepping in one entry point.
- Files: `src/components/event-zap-modal/index.tsx` (see inline `// TODO: this is way to complicated, it needs to be broken into multiple parts / hooks`, line 30), `src/components/event-zap-modal/pay-step.tsx`, `src/components/event-zap-modal/input-step.tsx`
- Impact: Hard to modify safely; zap flow bugs are likely to hide in this file. Signing is coupled to invoice-fetch flow (`// TODO: move this out to a separate step so the user can choose when to sign`, line 102) meaning users cannot review a zap before it's signed.
- Fix approach: Extract invoice resolution, relay-hint resolution, and signing into separate hooks/services; add a distinct "review" step before signing.

**NIP-60 wallet setup flow incomplete:**
- Issue: `SUGGESTED_MINTS` / `DEFAULT_WALLET_RELAYS` constants exist for a "brand new NIP-60 wallet" creation flow that is explicitly marked as not built.
- Files: `src/services/wallets.ts:32` (`// ... setup flow, not built yet`)
- Impact: Users cannot currently create a new NIP-60 (nut) wallet from scratch through the intended guided flow; likely relies on manual configuration elsewhere.
- Fix approach: Build the guided creation flow using the existing suggested mints/relays constants, or remove the dead constants if abandoned.

**Large, monolithic files:**
- Issue: Several files exceed 300-600 lines and mix concerns (state, network I/O, UI rendering, formatting logic).
- Files: `src/services/wallets.ts` (596 lines - manages webln/nwc/nutwallet backends, transactions, and balances all together), `src/views/lists/components/list-history-modal.tsx` (563 lines), `src/views/messages/chat/components/direct-message-form.tsx` (432 lines), `src/views/new/poll/poll-form.tsx` (381 lines), `src/const.ts` (363 lines)
- Impact: High cognitive load for changes; higher risk of regressions when touching wallet or messaging code since backend-specific logic is interleaved.
- Fix approach: Split `wallets.ts` by backend type (webln/nwc/nutwallet) behind a common interface; extract list-history diffing/rendering logic in `list-history-modal.tsx` into helpers.

**Scattered `TODO` markers indicating incomplete or unpolished features:**
- Files (representative sample):
  - `src/services/authentication-signer.ts:51` - unclear error-handling decision (`// TODO: maybe throw here?`)
  - `src/services/notifications/zaps.ts:78` - workaround for `isValidZap` throwing instead of returning
  - `src/helpers/nostr/list-history.ts:92` - hidden/private list tags not merged, decryption incomplete
  - `src/views/settings/mutes/muted-hashtags.tsx:34` - missing auto-creation of mute list
  - `src/hooks/use-cache-form.ts:7` - form cache does not support `File`/`Blob` persistence, only text (see also `src/views/new/picture/picture-post-form.tsx:40`)
  - `src/views/new/note/short-text-form.tsx:193` and `src/components/post-modal/index.tsx:180` - forms not wrapped in native `<form>` (impacts accessibility/enter-to-submit/browser autofill)
  - `src/components/timeline/note/components/share-modal.tsx:90` - dead code flagged for removal but still present
- Impact: Each represents a known incomplete feature or workaround; low individual impact but cumulative maintenance burden.
- Fix approach: Triage TODOs into backlog items; remove dead code flagged for removal.

## Known Bugs

**`isValidZap` throws instead of returning a validation result:**
- Symptoms: Zap notification processing must wrap validation in try/catch as a workaround rather than checking a boolean/result.
- Files: `src/services/notifications/zaps.ts:78`
- Trigger: Any malformed or edge-case zap receipt event during notification processing.
- Workaround: Currently swallowed via try/catch (see `// TODO: remove when isValidZap does not throw`).

**Silent failures from empty catch blocks (24 occurrences):**
- Symptoms: Errors are caught and discarded with no logging, making failures invisible to users and developers.
- Files: `src/helpers/nip19.ts:11`, `src/helpers/nostr/goal.ts:105`, `src/helpers/parse.ts:4`, `src/helpers/nostr/dms.ts:31`, `src/services/lnurl-metadata.ts:31`, `src/services/event-cache/index.ts:40`, `src/views/streams/stream/components/stream-top-zappers.tsx:19`, `src/views/tools/event-publisher/index.tsx:74`, `src/views/messages/chat/components/decrypt-placeholder.tsx:23`, `src/views/settings/cache/database/components/import-events-button.tsx:22`, `src/views/settings/cache/components/enable-with-delete.tsx:32`, `src/views/settings/relays/components/relay-control.tsx:27`, `src/views/wallet/components/receive-token-modal.tsx:36`, `src/providers/route/invoice-modal-provider.tsx:34`, `src/lib/open-graph-scraper/utils.ts:12`, `src/hooks/use-open-graph-data.ts:34`, `src/hooks/use-cache-form.ts:48`, `src/components/blob-details-modal.tsx:146,153`, `src/components/debug-modal/event-tags.tsx:74`, `src/components/cashu/mint-control.tsx:28`, `src/components/app-handler-modal/index.tsx:134`, `src/components/content/transform/nip-notation.ts:42`, `src/components/content/transform/bip-notation.ts:42`
- Trigger: Any parse/decrypt/network failure in these code paths (includes decryption of direct messages, cashu token receiving, and event caching -- all financially/privacy sensitive).
- Workaround: None currently; failures are invisible.

## Security Considerations

**Custom AES-CBC encrypted key/value store for local secrets:**
- Risk: `src/classes/encrypted-storage.tsx` implements its own PBKDF2 (10,000 iterations, SHA-256) + AES-CBC + manual PKCS#7 padding for encrypting locally-stored secrets (used to protect account keys/nsecs at rest). CBC without a MAC (no HMAC / AEAD such as GCM) is vulnerable to padding-oracle and bit-flipping style attacks if any code path surfaces distinguishable decrypt errors to an attacker-controlled boundary. PBKDF2 iteration count of 10,000 is low by current standards (OWASP recommends 600,000+ for PBKDF2-HMAC-SHA256 as of recent guidance).
- Files: `src/classes/encrypted-storage.tsx`
- Current mitigation: A `TEST_KEY`/`TEST_VALUE` marker pattern is used to verify password correctness before general decryption; unpad validates padding structure strictly and throws on mismatch.
- Recommendations: Migrate to an authenticated cipher (AES-GCM) to get both confidentiality and integrity in one primitive; increase PBKDF2 iterations substantially or move to Argon2/scrypt for password-based key derivation; ensure decrypt error messages/timing don't leak information distinguishing padding failures.

**Widespread use of `@ts-ignore` and loose typing:**
- Risk: 19 `@ts-ignore`/`@ts-nocheck` occurrences and 56 `: any` / `as any` usages bypass TypeScript's type safety, several in security/data-sensitive contexts (event relay parsing, database indexing, event publishing tool).
- Files: `src/helpers/media-upload/nostr-build.ts:44`, `src/services/relay-info.ts:31`, `src/services/database/index.ts:117,246`, `src/services/outbox-cache.ts:54`, `src/views/tools/event-publisher/index.tsx:259`, `src/lib/open-graph-scraper/extract.ts:34,36,38,40,42`, `src/lib/open-graph-scraper/media.ts:218`, `src/components/magic-textarea.tsx:169`, `src/polyfill.ts:3`, `src/hooks/use-route-state-value.ts:29`
- Current mitigation: None beyond code review.
- Recommendations: Audit each `@ts-ignore` to confirm the underlying type mismatch is benign; replace `any` with concrete types incrementally, prioritizing `src/services/database/index.ts` (persisted data layer) and `src/services/wallets.ts`-adjacent code (financial data).

**Signing flow does not have a mandatory review step before invoice signing in the zap modal:**
- Risk: Per the TODO in `src/components/event-zap-modal/index.tsx:102`, signing happens inline as part of the invoice flow rather than as an explicit user-controlled step, increasing risk of unintended signing if flow logic changes.
- Files: `src/components/event-zap-modal/index.tsx`
- Recommendations: Introduce an explicit confirm/sign step decoupled from invoice fetching.

## Performance Bottlenecks

**Large monolithic wallet service recomputes/subscribes across all backend types:**
- Problem: `src/services/wallets.ts` (596 lines) manages `webln`, `nwc`, and `nutwallet` backends together using RxJS combinators (`combineLatest`, `switchMap`, `shareReplay`) in one module; any change to shared observables risks broad re-subscription/re-computation across unrelated wallet backends.
- Files: `src/services/wallets.ts`
- Cause: Lack of per-backend isolation; all backend state flows through shared top-level observables.
- Improvement path: Split into per-backend services combined by a thin coordinator, so a change/update in one backend (e.g., NWC balance polling) doesn't force recomputation of unrelated backend state.

**Large `list-history-modal.tsx` (563 lines) diffing UI:**
- Problem: Computes and renders list/mute-list history diffs in a single large component.
- Files: `src/views/lists/components/list-history-modal.tsx`
- Cause: Diff computation and rendering logic co-located instead of memoized/extracted.
- Improvement path: Extract diff computation into a pure helper/hook with memoization to avoid recomputation on unrelated re-renders.

## Fragile Areas

**`event-zap-modal` (zap payment flow):**
- Files: `src/components/event-zap-modal/index.tsx`, `input-step.tsx`, `pay-step.tsx`
- Why fragile: Explicitly flagged by the author as "way too complicated" and needing to be broken into multiple parts/hooks; combines relay-hint resolution, outbox/inbox relay merging, zap splits, LNURL metadata fetch, and signing in one flow.
- Safe modification: Add tests/manual QA around zap-splitting and multi-relay hint merging before making changes; avoid changing signing timing without also addressing the "sign as separate step" TODO.
- Test coverage: None (no test suite exists in this repository at all).

**Wallet service (`wallets.ts`) covering three distinct backend types:**
- Files: `src/services/wallets.ts`
- Why fragile: Single 596-line file mixes `webln`, `nwc` (Nostr Wallet Connect), and `nutwallet` (NIP-60/Cashu) logic; changes to shared types or observables can silently affect unrelated backends.
- Safe modification: Confirm changes don't alter shared `WalletBackendType`/`WalletTransaction` interfaces used across all three backends; manually test each backend type after any shared-code change.
- Test coverage: None.

**Encrypted local storage (`encrypted-storage.tsx`):**
- Files: `src/classes/encrypted-storage.tsx`
- Why fragile: Hand-rolled cryptographic padding/encryption code; any subtle bug in `pad`/`unpad` or key derivation could corrupt or expose locally stored secrets (account keys).
- Safe modification: Do not modify padding/encryption logic without cryptographic review; consider replacing with a vetted AEAD scheme rather than patching in place.
- Test coverage: None (no automated tests exist for cryptographic correctness of padding/unpadding edge cases).

## Scaling Limits

**Not applicable** - noStrudel is a client-side Nostr web/mobile application (Vite + Capacitor); there is no server-side infrastructure in this repository to reach conventional scaling limits. Client-side concerns are instead performance/memory related (see Performance Bottlenecks).

## Dependencies at Risk

**`applesauce-*` prerelease packages (10 of 13 packages on nightly tags):**
- Risk: Depends on unpublished nightly snapshots (`0.0.0-next-20260617211338`) rather than stable releases for core Nostr primitives (event store, actions, signers, accounts, wallet, wallet-connect, content parsing, loaders, react bindings, extras).
- Impact: No guaranteed backward compatibility between nightly builds; upgrading any single feature may require bumping all ten packages simultaneously to a compatible nightly snapshot, and there's no semver contract to rely on.
- Migration plan: Coordinate with the `applesauce` project's release cadence; move to first-class semver releases as they become available (already true for `applesauce-core`, `applesauce-relay`, `applesauce-sqlite`).

**`@noble/secp256k1` alongside `@noble/curves`:**
- Risk: Both `@noble/secp256k1` (older/legacy standalone package) and `@noble/curves` (newer, includes secp256k1) are listed as dependencies, suggesting overlapping cryptographic libraries in use.
- Files: `package.json`
- Impact: Potential for inconsistent crypto primitive usage/version drift across the codebase if both are actively imported in different places.
- Migration plan: Audit imports to confirm which package is authoritative and remove the redundant one if only one is truly needed.

## Missing Critical Features

**No automated test suite:**
- Problem: No `*.test.*` or `*.spec.*` files exist anywhere under `src/`, and no test runner (`vitest`, `jest`, etc.) is present in `package.json` dependencies or devDependencies.
- Blocks: Safe refactoring of fragile areas (wallet service, zap modal, encrypted storage) without manual regression testing; CI cannot catch regressions before release.

**No linter configuration detected:**
- Problem: No `.eslintrc*` or `eslint.config.*` file found in the repository root; only `prettier` is configured for formatting (`format` script in `package.json`).
- Blocks: Automated enforcement of code quality/conventions (e.g., catching unused variables, unsafe `any` usage, or empty catch blocks) prior to commit/CI.

## Test Coverage Gaps

**Entire codebase (no tests exist):**
- What's not tested: Everything - wallet backends (`src/services/wallets.ts`), encrypted local storage (`src/classes/encrypted-storage.tsx`), zap flow (`src/components/event-zap-modal/`), Nostr event parsing/caching (`src/services/event-cache/`, `src/services/database/index.ts`), and all UI components/views.
- Files: entire `src/` tree
- Risk: Regressions in financially sensitive code (wallet balances, Cashu tokens, zap payments) and cryptographically sensitive code (encrypted key storage) can ship undetected.
- Priority: High - especially for `src/services/wallets.ts`, `src/classes/encrypted-storage.tsx`, and `src/components/event-zap-modal/`.

---

*Concerns audit: 2026-07-01*
