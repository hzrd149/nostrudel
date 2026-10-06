---
phase: 06
slug: close-type-safety-escape-hatches
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-10-06
---

# Phase 06 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: **authored at plan time.** All ten PLAN files (06-01 … 06-10) carry a parseable
`<threat_model>` block. Together they declare 33 distinct IDs (T-06-01 … T-06-33) with no ID shared
between plans, so no merge was needed. Verification depth is ASVS L1 (grep-level presence of each
mitigation) and the block threshold is `high`.

Evidence basis: every check below was run against the current tree (HEAD `c47ad5801`). Nothing was
copied from a SUMMARY. The phase range is `517adf069..HEAD` (47 `src/` files, +305/-206). This audit
ran these measurements itself:

- `tsc --noEmit` exits 0 on HEAD.
- `vitest run` passes 4 files and 29 tests.
- A production `vite build` into a scratch `outDir` exits 0, and its bundle was grepped.
- A live `aislop scan` of HEAD.
- An `aislop scan` of the exported pre-phase tree `517adf069`.
- A scratch tsc probe of the IndexedDB schema types, with a negative control.
- `gsd-tools roadmap validate`.

Implementation files were not modified, and the scratch artifacts were deleted.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| planning docs → downstream executors | Plans 06-02 … 06-10 read the baseline and the ROADMAP entry as fact (06-01) | Verification record |
| aislop scan output → baseline table | Tool output transcribed into markdown (06-01) | Verification record |
| development build → production bundle | `import.meta.env.DEV` becomes `false` in production and the guarded block is dropped (06-02) | Service handles (event store, pool, accounts DB, wallets) |
| user setting → window global | `enableDebugApi` decides whether the `noStrudel` debug handle is on `window` (06-03) | Service handles |
| app code → IndexedDB `storage` database | Cache clear and v5 migration write persistent browser storage (06-04) | Accounts, caches |
| napplet iframe → kehto shell → relay pool | Sandboxed napplets supply filters and publish requests the shell forwards (06-05) | Filters, signed events |
| browser extension → `window.webln` | An injected WebLN provider makes invoices and sends payments (06-05) | Payments, balance |
| webxdc iframe → parent `message` event | Untrusted app code posts arbitrary structured-cloneable data (06-06) | JSON-RPC envelopes |
| relays → `useWebxdc` | Kind 4932/20932 events are untrusted content (06-06) | Nostr events |
| user input → composer components | Pasted files and typed text flow into publishing (06-07) | Files, note text |
| user-typed date strings → event console / publisher | Relative dates become `since`/`until`/`created_at` (06-08) | Filters, event timestamps |
| stored preference → Vertex API request | A free-string preference is sent to the Vertex DVM as the sort method (06-08) | Search parameter |
| app startup → IndexedDB `storage` database | `openDB` runs at module load via top-level await, so a migration failure blocks boot (06-09) | App availability |
| migration code → persisted user data | Migrations rewrite stored accounts and caches for upgrading users (06-09) | Accounts (high sensitivity) |
| scan output and grep → closing record | The closed 68 → 0 table is what a later reader trusts (06-10) | Verification record |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-06-01 | Tampering | `.planning/ROADMAP.md` (06-01) | high | mitigate | Verified: `git log 517adf069..HEAD -- .planning/ROADMAP.md` lists 5 commits. Every diff hunk in each one lies inside the Phase 6 entry. For `cc10e3a98` the hunks are at 280 and 282-289, and Phase 6 spans 271-320 in the parent. The tracking and 06-10 hunks fall at 278 and 305-323, inside 271-328. `grep -c '^### Phase '` is 14 at `517adf069`, at `cc10e3a98`, at `36d457bd7` and at HEAD. `gsd-tools roadmap validate` returns `{"warnings": []}` on HEAD. | closed |
| T-06-02 | Repudiation (false record) | `06-BASELINE.md` counts (06-01) | medium | mitigate | Verified independently. The exported pre-phase tree (`517adf069`, whose `src/` is identical to `5884dac0a`) scans at 35 / 20 / 13 = 68 with score 85. Its 68 `rule file:line` locations are byte-identical (`diff`) to the BASELINE table. The table has exactly 68 rows, and the per-plan tally 19+9+1+6+4+8+5+16 = 68. The pre-phase escape-hatch grep returns 70 lines, matching the recorded grep baseline. | closed |
| T-06-03 | Information Disclosure | n/a (06-01) | low | accept | Accepted as R-06-01. Verified: `db09be9a0` and `cc10e3a98` touch only `06-BASELINE.md` and `ROADMAP.md`. | closed — accepted (R-06-01) |
| T-06-04 | Information Disclosure | 19 DEV debug blocks (06-02) | medium | mitigate | Verified: `src/` has 20 `Reflect.set(window, ` calls. A brace-depth awk containment check puts 19 of them inside `if (import.meta.env.DEV) {` blocks. The 20th is the pre-existing, setting-gated `debug-api.ts:51`. Numstat matches the plan: `loaders.ts` 5/10, `wallets/index.ts` 2/3, every other file 1/2. No `@ts-` directive remains in any DEV block. Boundary check: the production bundle contains 0 of the 19 DEV globals. Its only `Reflect.set/deleteProperty(window, …)` calls are the 2 `noStrudel` ones. | closed |
| T-06-05 | Tampering | `window` property names (06-02) | low | mitigate | Verified: the 19 removed `window.X = Y` lines and the 19 added `Reflect.set(window, "X", Y)` lines produce identical sorted NAME/VALUE lists (`diff` clean). That includes `addressLoader → replaceableLoader` (`loaders.ts:110`) and `socialGraph → socialGraph$` (`social-graph.ts:201`). | closed |
| T-06-06 | Denial of Service | build (06-02) | low | mitigate | Verified: `tsc --noEmit` exits 0 and the production `vite build` exits 0 on HEAD. | closed |
| T-06-07 | Information Disclosure | `services/debug-api.ts` disable path (06-03) | low | mitigate | Verified: `debug-api.ts:52` `else Reflect.deleteProperty(window, "noStrudel");` is the else branch of the `enableDebugApi` subscription (line 51). The production bundle keeps both branches: `e?Reflect.set(window,\`noStrudel\`,…):Reflect.deleteProperty(window,\`noStrudel\`)`. | closed |
| T-06-08 | Denial of Service | `vite-env.d.ts` declaration removal (06-03) | low | mitigate | Verified: `src/vite-env.d.ts` is 3 reference lines. The only `pwa-register` import in `src/` is `virtual:pwa-register` (`services/worker.ts:2`), typed by `vite-plugin-pwa/client`. `tsc` and `vite build` exit 0. | closed |
| T-06-09 | Tampering | scroll restoration (06-03) | low | accept | Accepted as R-06-02. Verified: the `use-scroll-restore.ts` diff changes only the callback parameter type (`ScrollableList`, line 8, used at line 80) and drops the `FixedSizeList` import. The six notification views drop only `as any`. The 10 consumers type-check. | closed — accepted (R-06-02) |
| T-06-10 | Denial of Service | `clearCacheData()` (06-04) | medium | mitigate | Verified: `database/index.ts:232-246` clears `userSearch`, `relayInfo`, `identities` (line 240) and `relayScoreboardStats`, then calls `window.location.reload()` (line 245). Fix commit `f37f7fbe6` is its own commit (+2/-2, one file). The scratch tsc probe confirms `db.clear("dnsIdentifiers")` is now a compile error. Runtime: `06-UAT.md` test 1 `pass` (human-attested). | closed |
| T-06-11 | Tampering (data integrity) | v5 accounts migration (06-04) | medium | mitigate | Verified: `46d2dd113` replaces spread + `delete` with `const { useExtension, ...rest } = account;` (`database/index.ts:126`). `connectionType: useExtension ? "extension" : undefined` (line 129) and `objectStore.put(newAccount)` (line 132) are unchanged. The commit touches one file and nothing else. The result has the same keys in the same order. | closed |
| T-06-12 | Information Disclosure | `identities` cache clear (06-04) | low | accept | Accepted as R-06-03. Verified: `identities` is written only by `DnsIdentityLoader.save` (`dns-identity-loader.ts:6-11`) with applesauce `Identity` values. These are re-fetchable NIP-05 lookups. | closed — accepted (R-06-03) |
| T-06-13 | Elevation of Privilege | `poolLike` handed to kehto (06-05) | medium | mitigate | Verified: `napplet-shell/adapter.ts:80-86` is the only `RelayPoolLike` object in `src/`. It is returned from `getRelayPool` (line 92) and has exactly `subscription`, `request` and `publish`, with no `count`. The raw `pool` is no longer handed to kehto. The other importer (`common-actions.ts:110`) uses it shell-side only. kehto's `createRelayPoolAdapter` (`@kehto/shell/dist/index.js:21-62`) calls only `subscription` and `publish`. | closed |
| T-06-14 | Tampering | napplet filters → `pool.subscription` (06-05) | medium | mitigate | Verified: `toRelayFilters` (`adapter.ts:54-56`) is `filters.map((f) => ({ ...f }))`, a shallow copy with no filtering or validation. It is used at lines 164 and 239. `poolLike.subscription`/`request` forward filters untouched. `selectRelayTier` (line 88) is unchanged diff context. | closed |
| T-06-15 | Repudiation | napplet publish result (06-05) | low | mitigate | Verified: `adapter.ts:83-85` `publish: async (…) => { await pool.publish(relayUrls, event); }` resolves and rejects with `pool.publish`. kehto's `publishSignedRelayEvent` (`@kehto/runtime/dist/index.js:812-818`) settles from `Promise.resolve(publishResult).then(() => settle(true), err => settle(false, …))` and never reads the resolved value. Runtime: `06-UAT.md` test 3 `pass`. | closed |
| T-06-16 | Spoofing | `window.webln` provider (06-05) | low | accept | Accepted as R-06-04. Verified: `wallets/webln.ts:51,55` read `window.webln` through the global augmentation (`types/webln.d.ts:9` adds `getBalance?`). The runtime expressions match the removed casts. | closed — accepted (R-06-04) |
| T-06-17 | Tampering | `webxdc.tsx` `onMessage` (06-06) | medium | mitigate | Verified: `webxdc.tsx:110` origin check, then `:111` source check, then `:113` `const msg: unknown = event.data;`, then `:114` `if (!isWebxdcMessage(msg)) return;`. No `event.data` read precedes the checks, and no `as any` remains. The guard (`webxdc/jsonrpc.ts:5-7`) is pinned by `jsonrpc.test.ts`, which passes. | closed |
| T-06-18 | Tampering | request `id`/`method` of unexpected type (06-06) | low | mitigate | Verified: `handleRequest(id: unknown, method: unknown, …)` (`webxdc.tsx:261`), and `handleUpdateRequest`/`handleRealtimeRequest` take `method: unknown`. An unmatched method falls through to `respondError(-32601, …)` (line 270). The test pins `{ id: null, method: 5 }` as accepted. | closed |
| T-06-19 | Denial of Service | over-strict guard (06-06) | medium | mitigate | Verified: the guard is `typeof data === "object" && data !== null && "jsonrpc" in data && data.jsonrpc === "2.0"`, with no `Array.isArray` and no id/method type checks. `jsonrpc.test.ts` pins arrays carrying `jsonrpc` and prototype-inherited `jsonrpc` as accepted. It pins null, undefined, primitives, `[]`, `{}`, `"1.0"` and `2` as rejected. | closed |
| T-06-20 | Spoofing | own-echo check in `useWebxdcRealtimeChannel` (06-06) | low | accept | Accepted as R-06-05. Verified: `use-webxdc.ts:172` `if (event.pubkey === activePubkey) return;` is the same comparison without the cast. | closed — accepted (R-06-05) |
| T-06-21 | Tampering | `useTextAreaUploadFile().onPaste` (06-07) | low | mitigate | Verified: `8cd1fcfb4` changes only the `useCallback` generic (`use-textarea-upload-file.ts:83`). The handler body (lines 84-86: read `clipboardData.files`, upload the first image) is unchanged. All 13 call sites (the plan says twelve) type-check under `tsc`. Runtime: `06-UAT.md` test 7 `pass`. | closed |
| T-06-22 | Denial of Service | `magic-textarea.tsx` ref wiring (06-07) | low | mitigate | Verified: `magic-textarea.tsx:184-188` yields `undefined` for a missing ref. The library only tests truthiness: `_this2.props.innerRef && _this2.props.innerRef(ref)` (`react-textarea-autocomplete.es.js:1358`). `innerRef` is also on its prop-strip list (line 1070). `tsc` exits 0. Runtime: `06-UAT.md` test 6 `pass`. | closed |
| T-06-23 | Repudiation (untracked suppression) | surviving MagicInput directive (06-07) | low | mitigate | Verified: `magic-textarea.tsx:201` holds `aislop-ignore-next-line ai-slop/ts-directive -- <reason>` and the line directly below it (202) holds `@ts-expect-error -- TS2344: …`. Both reasons are non-empty. `tsc` exits 0, so the expect-error is still needed. The directive is inventoried as surviving ignore 2 in `06-BASELINE.md`. | closed |
| T-06-24 | Tampering | `processDateString` unit mapping (06-08) | low | mitigate | Verified: `process.test.ts` pins all five letters in both cases through `parseTimeUnit`. It pins `processDateString` under `vi.setSystemTime(2024-03-15T12:00:00Z)` for both cases, the no-unit hour default, and the error paths (`"tomorrow"`, `"n*5"`). D-18 is its own commit (`83221af05`), and the tests pass. | closed |
| T-06-25 | Tampering | `processEvent` id (06-08) | low | mitigate | Verified: `event-publisher/process.ts:87` `return { ...event, id: getEventHash(event) };` hashes the same object the old mutate-then-return hashed. The return type is `UnsignedEvent & { id: string }`. The 3 callers type-check. | closed |
| T-06-26 | Tampering | Vertex sort method sent to the DVM (06-08) | low | accept | Accepted as R-06-06. Verified: `83a2b9d65` is +1 line, the ignore comment (`vertex.ts:36`). Line 37 (`as any`) and the `userSearch` call are unchanged. The deferred Open-Ranking replacement is in `06-CONTEXT.md:229`. | closed — accepted (R-06-06) |
| T-06-27 | Denial of Service | `upgrade()` on the startup path (06-09) | high | mitigate | Verified: in `c70b83e80` the 17 removed `index.ts` lines are the `idb` import plus 16 `as unknown as` cast declarations, and nothing else. There are 16 `at<SchemaV…>()` reads. `atSchema` (`database/index.ts:24-30`) returns the same `db`/`transaction` references. The commit touches only `schema.ts` and `index.ts`. `tsc` and `vite build` exit 0. Runtime: `06-UAT.md` test 2 `pass` (human-attested): a fresh profile boots v0 → v13 and an existing profile keeps its accounts. | closed |
| T-06-28 | Tampering (data integrity) | v5/v7/v11 account migrations (06-09) | high | mitigate | Verified: the same diff audit as T-06-27 shows no migration statement changed. At HEAD, after `c70b83e80`, the D-08 destructure (`index.ts:126`) and the D-07 `db.clear("identities")` (`index.ts:240`) are both present. Runtime: `06-UAT.md` test 2 `pass` (accounts intact). | closed |
| T-06-29 | Repudiation (untracked suppression) | the `atSchema` cast (06-09) | low | mitigate | Verified: `grep -c 'as unknown as'` on `database/index.ts` returns 1. `grep -B1` shows line 28 `aislop-ignore-next-line ai-slop/double-type-assertion -- <reason>` directly above the cast on line 29. It is inventoried as surviving ignore 1 in `06-BASELINE.md`. | closed |
| T-06-30 | Tampering | consumers' store access (06-09) | low | mitigate | Verified by an independent scratch tsc probe against the real `schema.ts`. `SchemaV13` and `SchemaV5 extends DBSchema` hold, and `StoreNames<SchemaV13>` is not `string`. `"identities"`/`"kv"` (V13) and `"dnsIdentifiers"` (V11) compile. `"dnsIdentifiers"` and `"totally-not-a-store"` at V13, and `db.clear("dnsIdentifiers")`, are errors. The probe exits 0, and removing one `@ts-expect-error` fails with TS2322, so the probe is live. No consumer file was edited and no cast was added outside `atSchema`. | closed |
| T-06-31 | Repudiation (false record) | `06-BASELINE.md` After column (06-10) | medium | mitigate | Verified independently. A live HEAD scan gives 0 / 0 / 0 for the three rules under `src/`, score 86. Pre-phase 672 minus HEAD 604 is exactly 68. The ignore grep returns exactly 3 lines (`database/index.ts:28`, `magic-textarea.tsx:201`, `vertex.ts:36`). The escape-hatch grep returns 4 lines, the same 4 the BASELINE records. `@ts-ignore` count is 0. The 06-10 verify gate (`06-10-PLAN.md:101`) contains both the scan and the grep. | closed |
| T-06-32 | Tampering | `.planning/ROADMAP.md` (06-10) | high | mitigate | Verified: the `36d457bd7` hunks are at 278 and 323, inside Phase 6 (271-328). Phase-heading count is 14 and `roadmap validate` is clean on HEAD (see T-06-01). | closed |
| T-06-33 | Repudiation | unverified browser behaviors (06-10) | medium | mitigate | Verified: `06-BASELINE.md` "Manual verification outstanding" lists all 7 browser-only checks with steps and `outstanding` status. `06-VERIFICATION.md` routes them to `human_verification` instead of marking them verified from the build. The maintainer later ran them as `06-UAT.md` 7/7 `pass` (commit `512d4ee5c`, 2026-10-06). | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (`high`) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

All 33 threats are `closed`: 27 mitigated and verified in code, git history or an independent
measurement, and 6 accepted and logged below. None is transferred and none is open at any severity.
By severity the register holds 4 `high` (T-06-01, T-06-27, T-06-28, T-06-32), 10 `medium` and 19
`low`. All high threats are mitigated and verified. All accepted threats are `low`.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-06-01 | T-06-03 | 06-01 reads and writes planning documents only, with no secrets, keys or user data. The audit confirmed both 06-01 commits touch only `.planning/` files. | hzrd149 (06-01-PLAN.md) | 2026-10-05 |
| R-06-02 | T-06-09 | The scroll-restore change is type-only. The callback body and its `scrollTo` call are untouched, and `tsc` checks every consumer. | hzrd149 (06-03-PLAN.md) | 2026-10-05 |
| R-06-03 | T-06-12 | `identities` holds re-fetchable NIP-05 lookups written by `DnsIdentityLoader`, not secrets or account data. Clearing it is what "Clear cache data" is meant to do. | hzrd149 (06-04-PLAN.md) | 2026-10-05 |
| R-06-04 | T-06-16 | Trust in the injected WebLN provider is unchanged. Only the way its type is expressed changed (global `Window.webln` augmentation instead of casts). | hzrd149 (06-05-PLAN.md) | 2026-10-05 |
| R-06-05 | T-06-20 | The own-echo check is the same pubkey comparison without the cast. | hzrd149 (06-06-PLAN.md) | 2026-10-05 |
| R-06-06 | T-06-26 | D-17: Vertex sort-method values outside `SortMethod` reach Vertex exactly as before. The integration is slated for replacement by the Open-Ranking protocol API (06-CONTEXT.md deferred ideas). The cast keeps a rule-scoped ignore with that reason. | hzrd149 (06-08-PLAN.md, D-17) | 2026-10-05 |

*Accepted risks do not resurface in future audit runs.*

---

## Residual Items (non-blocking)

None of these is an open threat. They are notes on verification quality, scope notes and record drift.

| Ref | Note | Tracked in |
|-----|------|------------|
| T-06-10, T-06-15, T-06-21, T-06-22, T-06-27, T-06-28 | Runtime evidence is human-attested. `06-UAT.md` records 7/7 `pass` (commit `512d4ee5c`) with result lines only. This audit verified the code, the bundle and the type probe independently, but did not run a browser or a real IndexedDB upgrade. | `06-UAT.md` |
| T-06-30 | The store names are now checked at compile time. The values of `relayInfo`, `kv` and `misc`/`settings` are still `any` because of their existing `value: any` annotations, which D-04 leaves out of scope. | `06-REVIEW.md` summary, D-04 |
| T-06-24 | WR-01 fix `5e92a0b5b` came after the plans: exported `parseTimeUnit` now throws for unknown letters instead of silently returning `"hour"`. No threat model covers it, but it falls in T-06-24's component. The regex in `processDateString` captures only `[hwmsd]` (`/i`), so no reachable input behaves differently. `process.test.ts` covers the throw. | `06-REVIEW-FIX.md` |
| T-06-19 | The prototype-inherited `jsonrpc` test case is defensive only. Structured clone does not preserve prototypes, so `postMessage` cannot deliver such a value. For every cloneable input the guard matches the old check. | `jsonrpc.test.ts` |
| T-06-23, T-06-29 | Whether an ignore reason meets the P4 D-08 "why not fixed" bar is a judgment about the prose. This audit verified rule-scoping, adjacency and non-empty reasons. It relied on the 06-10 re-read for adequacy. | `06-BASELINE.md` "Surviving rule-scoped ignores" |
| — | REVIEW IN-01: `isSetter` (`use-route-state-value.ts:10`) is an unchecked type predicate, so it works like an inline escape hatch that aislop does not flag or inventory. Runtime behavior is the same as the `@ts-ignore` it replaced. | `06-REVIEW.md` IN-01 |
| Scan totals | Today's scan totals are 672 (pre-phase) and 604 (HEAD). The records say 665 and 597. The +7 offset appears in both trees. No dependency manifest or `.aislop/` file changed in the phase, and the files changed after close-out (`process.ts`, `process.test.ts`) have 0 diagnostics. So the offset comes from the environment (tool or advisory data), not from phase code. The −68 delta and the 0/0/0 bucket-E result hold. | `06-BASELINE.md`, `06-VERIFICATION.md` |
| Record drift | `06-BASELINE.md` "Manual verification outstanding" still lists all 7 rows as `outstanding`. The `06-VERIFICATION.md` body still reads `Status: human_needed`, while its frontmatter says `passed`. UAT resolved all of these. This is stale documentation, not a security gap. | `06-BASELINE.md`, `06-VERIFICATION.md` |

Unregistered threat flags: none. Seven SUMMARYs (06-02, 06-03, 06-05, 06-06, 06-07, 06-08, 06-09)
have a `## Threat Flags` section that reads "None.". 06-01, 06-04 and 06-10 have no such section.
`git diff 517adf069..HEAD` touches no `package.json`, `pnpm-lock.yaml`, `.aislop/` or
`vite.config.ts`, so no dependency or build configuration was added or changed. The new runtime
surfaces (the `isWebxdcMessage` guard, the three-method `poolLike` adapter, `toRelayFilters`,
`atSchema`, `parseTimeUnit`) each map to a registered threat (T-06-17/19, T-06-13/15, T-06-14,
T-06-27/29, T-06-24).

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-06 | 33 | 33 | 0 | /gsd-secure-phase (ASVS L1, block_on: high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-06
