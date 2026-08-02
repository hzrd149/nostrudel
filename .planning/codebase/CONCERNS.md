# Codebase Concerns

**Analysis Date:** 2026-07-29

## Tech Debt

**TypeScript suppression and loose typing hotspots:**

- Issue: Strict TypeScript is enabled in `tsconfig.json`, but multiple core paths rely on `any`, `@ts-ignore`, and `@ts-expect-error` to bypass type safety.
- Files: `src/services/database/index.ts`, `src/services/preferences.ts`, `src/services/outbox-cache.ts`, `src/services/loaders.ts`, `src/lib/open-graph-scraper/extract.ts`, `src/lib/open-graph-scraper/media.ts`, `src/services/notifications/zaps.ts`, `src/sw/common/interface.ts`
- Impact: API drift and dependency upgrades surface as runtime bugs instead of compile-time failures. The current `pnpm build` fails on unchecked type mismatches in Webxdc and nostr-idb code.
- Fix approach: Replace suppressions with typed adapter functions at dependency boundaries. Treat external library return types as `unknown`, validate/normalize them once, and export project-owned typed values.

**Build-breaking type errors:**

- Issue: `pnpm build` fails during `tsc --project tsconfig.json`.
- Files: `src/components/webxdc/webxdc.tsx`, `src/services/event-cache/nostr-idb.ts`, `src/views/settings/cache/database/internal.tsx`
- Impact: Production builds cannot complete until these compile errors are fixed. The Webxdc realtime channel API is called as mandatory even though the type marks it optional, and nostr-idb returns `StoredEvent` values that may not satisfy `NostrEvent` because `sig` can be missing.
- Fix approach: Guard optional Webxdc methods before invocation in `src/components/webxdc/webxdc.tsx`; filter or assert only signed events from nostr-idb in `src/services/event-cache/nostr-idb.ts`; update export typing in `src/views/settings/cache/database/internal.tsx` to return only valid `NostrEvent[]`.

**Oversized provider module:**

- Issue: `src/providers/global/napplet-shell-provider.tsx` is 1174 lines and owns consent UI, resource permission persistence, relay/upload adapters, shell bridge lifecycle, identity, follows, profiles, reactions, reports, intent routing, and modals.
- Files: `src/providers/global/napplet-shell-provider.tsx`
- Impact: Changes to napplet permissions or service adapters are high-risk because UI state, security policy, and bridge side effects are coupled in one component.
- Fix approach: Split into `src/services/napplet-shell/*` adapter modules, a small `NappletShellProvider`, and separate modal components. Keep permission storage and grant decisions in pure functions with unit tests.

**Vendored/embedded library code in `src/lib`:**

- Issue: Large third-party-like modules are committed directly in application source.
- Files: `src/lib/qrcodegen.ts`, `src/lib/open-graph-scraper/fields.ts`, `src/lib/open-graph-scraper/extract.ts`, `src/lib/open-graph-scraper/media.ts`, `src/lib/bencode/encode.ts`
- Impact: These files increase maintenance burden, are weakly typed, and are easy to accidentally modify without upstream test coverage.
- Fix approach: Prefer package dependencies where possible. If vendoring is required, isolate under `src/lib/vendor/`, document source/version/license, and avoid application-specific edits in vendor files.

**Database migrations perform asynchronous writes inside the upgrade callback without awaiting transaction completion:**

- Issue: Migrations schedule `getAll().then(...)` work inside the IndexedDB upgrade callback.
- Files: `src/services/database/index.ts`
- Impact: Account migrations from schema v4/v6 can race transaction lifetime, especially across browsers, risking partial migration or lost account metadata.
- Fix approach: Use `await`-compatible migration helpers where supported by `idb`, or keep migration operations strictly transaction-bound and return/chain all promises from upgrade logic.

## Known Bugs

**Cache clear calls a deleted object store:**

- Symptoms: Clicking the internal cache clear action can fail on current schema databases because `clearCacheData()` clears `dnsIdentifiers` even schema v12 deletes that store and replaces it with `identities`.
- Files: `src/services/database/index.ts`, `src/services/database/schema.ts`, `src/views/settings/cache/database/internal.tsx`
- Trigger: Navigate to the internal database cache settings and click **Clear cache** on a database at version 13.
- Workaround: Use **Delete database** instead of **Clear cache** when the clear action fails.

**Event verification can be called before verifier initialization finishes:**

- Symptoms: `eventStore.verifyEvent` delegates to `verifyEventMethod` before `updateVerifyMethod()` has necessarily loaded wasm or selected the internal verifier.
- Files: `src/services/verify-event.ts`, `src/services/event-store.ts`
- Trigger: Insert a non-cache event very early during startup while `nostr-wasm` initialization is still pending.
- Workaround: Set `verify-event-method` to `internal` or ensure event ingestion starts only after verifier initialization resolves.

**Webxdc realtime channel support is assumed even when absent:**

- Symptoms: TypeScript reports `api.joinRealtimeChannel` may be undefined, and runtime calls can throw for Webxdc API implementations that do not support realtime channels.
- Files: `src/components/webxdc/webxdc.tsx`
- Trigger: A Webxdc iframe calls `webxdc.joinRealtimeChannel` while the provided `WebxdcAPI` object lacks that method.
- Workaround: Avoid Webxdc apps that require realtime channels until the method is guarded.

**NWC wallet secrets are stored as preference values:**

- Symptoms: Nostr Wallet Connect URIs are persisted as plain `StoredNwcWallet.uri` values.
- Files: `src/services/preferences.ts`, `src/services/wallets.ts`, `src/services/wallet-migration.ts`
- Trigger: Add or migrate a NWC wallet.
- Workaround: Remove NWC wallets from settings on shared devices; prefer wallets with external permission prompts.

## Security Considerations

**Encrypted decryption cache uses AES-CBC without authentication and a low PBKDF2 work factor:**

- Risk: CBC encryption does not provide integrity; tampered ciphertext is detected indirectly through padding/UTF-8 errors only. PBKDF2 uses 10,000 iterations, which is low for user PIN/password-derived keys.
- Files: `src/classes/encrypted-storage.tsx`, `src/services/decryption-cache.ts`, `src/services/preferences.ts`
- Current mitigation: Random IV per item, PKCS#7 padding validation, and optional encrypted cache enabled by default.
- Recommendations: Use an authenticated encryption mode such as AES-GCM or XChaCha20-Poly1305. Increase KDF cost and store KDF parameters with cache metadata for migration.

**Third-party pages are embedded without sandboxing:**

- Risk: Relay and Blossom homepage iframes load arbitrary remote origins without a `sandbox` attribute.
- Files: `src/views/relays/relay/tabs/homepage.tsx`, `src/views/blossom/server/tabs/homepage.tsx`
- Current mitigation: Browser same-origin policy limits direct DOM access.
- Recommendations: Add restrictive `sandbox` and `referrerPolicy` attributes, or open untrusted relay/server homepages in a new tab instead of embedding them.

**Napplet persistent grants are stored in localStorage and keyed only by event identity/hash:**

- Risk: Users can permanently grant capabilities or resource origins to napplets, and those decisions persist in localStorage without an expiration or centralized revocation UI in the provider.
- Files: `src/providers/global/napplet-shell-provider.tsx`, `src/components/napplets/napplet-frame.tsx`
- Current mitigation: Initial consent modal, per-origin resource prompts, sandboxed napplet iframe with `sandbox="allow-scripts"`.
- Recommendations: Add a settings screen to review/revoke grants, include grant timestamps, and require re-consent when capability sets change.

**Debug globals expose powerful internals in development builds:**

- Risk: Development sessions attach database, relay/cache, social graph, settings, and wallet internals to `window`.
- Files: `src/services/database/index.ts`, `src/services/event-store.ts`, `src/services/preferences.ts`, `src/services/social-graph.ts`, `src/services/wallets.ts`, `src/services/event-cache/index.ts`
- Current mitigation: Most globals are gated by `import.meta.env.DEV`.
- Recommendations: Keep debug exposure dev-only and avoid enabling development builds for real accounts or production-like deployments.

## Performance Bottlenecks

**Social graph sync runs heavy recalculation and persistence on the main thread:**

- Problem: Social graph loading, follow-distance recalculation, binary serialization, and IndexedDB persistence run from app services.
- Files: `src/services/social-graph.ts`, `src/services/cron.ts`
- Cause: `recalculateFollowDistances()` and `graph.toBinary()` operate on potentially large social graphs; a code comment notes the graph is disabled on Android because it is likely too much data on the JS thread.
- Improvement path: Move graph crawling/recalculation/persistence to a worker, cap sync distance aggressively, and persist incremental deltas instead of full graph blobs.

**Relay score persistence rewrites all known relay stats every 30 seconds:**

- Problem: `saveStats()` writes every relay score record on an interval regardless of whether scores changed.
- Files: `src/services/relay-scoreboard.ts`
- Cause: Module-level `setInterval` calls `saveStats()` every 30 seconds and iterates all relay maps.
- Improvement path: Track dirty relays, debounce saves after score changes, and flush on page visibility/background lifecycle events.

**Read-status cache prunes IndexedDB every 30 seconds:**

- Problem: Expired read-status keys are scanned and deleted frequently.
- Files: `src/services/read-status.ts`
- Cause: Module-level `setInterval(readStatusService.prune.bind(readStatusService), 30_000)` runs for every app session.
- Improvement path: Prune on startup and then at a longer interval, or schedule by nearest TTL expiration.

**Webxdc file transfer serializes files through base64 strings:**

- Problem: Imported files are converted to base64 using a byte-by-byte string loop.
- Files: `src/components/webxdc/webxdc.tsx`
- Cause: `bufToBase64()` builds a binary string in JavaScript before calling `btoa`, which is memory-heavy for large files.
- Improvement path: Transfer `ArrayBuffer` values directly where the protocol allows, or stream/chunk large files.

## Fragile Areas

**Local account and preference migration:**

- Files: `src/services/accounts.ts`, `src/services/preferences.ts`, `src/services/database/index.ts`, `src/services/wallet-migration.ts`
- Why fragile: Migration code runs at module top level and mutates persistent storage immediately on import. Account migration clears old stores after copying, while preference migration iterates all `localStorage` entries and removes matching keys.
- Safe modification: Add migration version markers, make migrations idempotent, and test migrations from each historical schema/key format.
- Test coverage: No `*.test.*` or `*.spec.*` files detected in the repo.

**Event cache backend selection and fallback:**

- Files: `src/services/event-cache/index.ts`, `src/services/event-cache/wasm-worker.ts`, `src/services/event-cache/nostr-idb.ts`, `src/services/event-cache/native-sqlite.ts`, `src/services/event-cache/hosted-relay.ts`
- Why fragile: Cache backend selection is asynchronous at module load, falls back through multiple implementations, and writes are buffered without surfacing write failures to callers.
- Safe modification: Keep `EventCache` behavior consistent across backends; add explicit health state and error reporting before changing fallback order.
- Test coverage: No automated tests detected for cache fallback, write buffering, or backend switching.

**Nostr event parsing/validation in notification grouping:**

- Files: `src/services/notifications/zaps.ts`, `src/services/notifications/reposts.ts`, `src/services/notifications/threads.ts`, `src/helpers/nostr/zaps.ts`
- Why fragile: Zap validation currently wraps `isValidZap(event)` in try/catch due to known throwing behavior, and address pointer coordinate helpers are duplicated inline with `any`.
- Safe modification: Centralize pointer-to-coordinate helpers in `src/helpers/nostr/`, normalize invalid zap events once, and keep grouping functions pure.
- Test coverage: No automated tests detected for malformed zap events or grouping edge cases.

**Shell and iframe message routing:**

- Files: `src/providers/global/napplet-shell-provider.tsx`, `src/components/napplets/napplet-frame.tsx`, `src/components/webxdc/webxdc.tsx`, `src/services/napplet-intent-delivery.ts`
- Why fragile: Message routing depends on iframe `contentWindow`, origin/window registries, local refs, and cleanup ordering. Small lifecycle changes can leak sessions or route a message to the wrong handler.
- Safe modification: Keep origin/source checks mandatory, unregister frames before reload/unmount, and test reload plus close flows manually after any changes.
- Test coverage: No automated tests detected for iframe messaging or permission grants.

## Scaling Limits

**Event cache size defaults to 10,000 events for nostr-idb:**

- Current capacity: `localSettings.idbMaxEvents` defaults to `10_000`.
- Limit: Large feeds or long-lived use will prune older cached events, and export/import paths assume signed `NostrEvent` values.
- Scaling path: Make cache capacity visible per backend, add storage usage warnings, and use typed event validation during import/export.

**Outbox map cache holds 30 list observables:**

- Current capacity: `MAX_CACHE = 30`.
- Limit: Users switching among many people lists can evict outbox maps and recompute relay selections repeatedly.
- Scaling path: Tune cache size from observed usage and dispose shared observables when evicted if upstream subscriptions stay active.

## Dependencies at Risk

**React type/runtime version mismatch:**

- Risk: Runtime dependencies use React `^19.2.8`, while dev types use `@types/react` `^18.3.31` and `@types/react-dom` `^18.3.7`.
- Impact: Type coverage may not match runtime behavior and can hide or introduce React 19-specific typing issues.
- Migration plan: Align React type packages with the installed React major version or confirm React 19 bundles its own compatible types for this setup.

**nostr-idb typed event drift:**

- Risk: `nostr-idb` returns `StoredEvent` values that include unsigned events, while project cache interfaces expect `NostrEvent`.
- Impact: Compile errors and possible runtime assumptions that `sig` exists on cached events.
- Migration plan: Add a project adapter that filters `StoredEvent` to signed events, or widen `EventCache` read types and verify/normalize before insertion into `eventStore`.

## Missing Critical Features

**Automated test suite is not detected:**

- Problem: No `*.test.*` or `*.spec.*` files were found, and `package.json` has no `test` script.
- Blocks: Safe refactors of migrations, wallet flows, event cache backends, napplet permissions, and notification grouping.

**Lint script is not detected:**

- Problem: `package.json` includes formatting and build scripts but no lint script.
- Blocks: Systematic enforcement of hook dependency rules, import consistency, unsafe `any`, and iframe security attributes.

## Test Coverage Gaps

**Database migrations:**

- What's not tested: Schema upgrades from v1 through v13, account migration, deleted object-store handling, and cache clear/delete actions.
- Files: `src/services/database/index.ts`, `src/services/database/schema.ts`, `src/views/settings/cache/database/internal.tsx`
- Risk: Users can lose accounts/settings or hit storage exceptions after upgrades.
- Priority: High

**Wallet backends:**

- What's not tested: WebLN balance polling, NWC notifications, NIP-60 unlock/cleanup, NWC URI migration, and active wallet reconciliation.
- Files: `src/services/wallets.ts`, `src/services/wallet-migration.ts`, `src/views/wallet/components/create-wallet-modal.tsx`, `src/views/wallet/components/send-lightning-modal.tsx`
- Risk: Wallet UI can show stale balances, miss paid invoices, or mishandle wallet secrets.
- Priority: High

**Napplet/Webxdc sandbox and permissions:**

- What's not tested: Consent prompts, persistent grants, resource-origin prompts, iframe reload cleanup, message origin checks, and unsupported Webxdc APIs.
- Files: `src/providers/global/napplet-shell-provider.tsx`, `src/components/napplets/napplet-frame.tsx`, `src/components/webxdc/webxdc.tsx`, `src/views/webxdc/components/webxdc-player.tsx`
- Risk: Capability regressions can become security issues or break embedded app execution.
- Priority: High

**Event cache and verification startup:**

- What's not tested: Event insertion before verifier initialization, wasm timeout fallback, cache backend fallback, write buffering, and cache read timeout behavior.
- Files: `src/services/verify-event.ts`, `src/services/event-store.ts`, `src/services/event-cache/index.ts`, `src/services/event-cache/wasm-worker.ts`, `src/services/event-cache/nostr-idb.ts`
- Risk: Valid events can be rejected, invalid events can be accepted, or cache writes can disappear silently.
- Priority: High

---

_Concerns audit: 2026-07-29_
