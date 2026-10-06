---
phase: 06-close-type-safety-escape-hatches
verified: 2026-10-05T17:10:00Z
status: passed
score: 8/8 must-haves verified (2 behavior items confirmed by human UAT 2026-10-06)
behavior_unverified: 0
overrides_applied: 0
behavior_unverified_items:
  - truth: "D-07: clearCacheData() now clears the live `identities` store instead of the deleted `dnsIdentifiers` store, so the clear completes and the page reloads"
    test: "Settings > Cache > Database > Clear cache data"
    expected: "Button stops spinning, page reloads, no NotFoundError in the console"
    why_human: "IndexedDB only runs in a browser (no fake-indexeddb in the repo). tsc proves `identities` is a valid store and `dnsIdentifiers` is now a compile error, but not that the transaction resolves and window.location.reload() runs."
  - truth: "D-05/D-06/D-08/D-15: the v0 -> v13 migration chain runs identically after the atSchema() collapse and the v5 destructure"
    test: "Clear site data and load the app; then load an existing profile"
    expected: "Fresh profile boots with no console errors; existing profile boots and its accounts are intact"
    why_human: "Diff review shows migration bodies are runtime-identical (same calls, same order, same key sets), but an upgrade() run needs a real browser IndexedDB. The startup path uses top-level-await openDB, so a failure would break boot."
human_verification:
  - test: "Clear cache data completes (D-07)"
    expected: "Settings > Cache > Database > Clear cache data: spinner stops, page reloads, no NotFoundError"
    why_human: "Browser-only IndexedDB"
  - test: "IndexedDB migrations still run (D-05/D-06/D-08)"
    expected: "Fresh profile boots with no console errors (v0 -> v13); existing profile boots with accounts intact"
    why_human: "Browser-only IndexedDB upgrade path on the startup path"
  - test: "Napplet subscribe and publish (D-11)"
    expected: "Inside a napplet, subscribe returns events and publish reports success. The explicit RelayPoolLike adapter now returns void from publish, where the old cast passed through pool.publish's response array."
    why_human: "Needs a running napplet shell and relays"
  - test: "WebLN wallet balance (D-11)"
    expected: "With a WebLN provider connected, the wallet view still shows the balance"
    why_human: "Needs a browser extension provider"
  - test: "webxdc app lifecycle (D-11/D-14/D-15)"
    expected: "A webxdc app receives webxdc.init and can send and receive a state update"
    why_human: "Needs an iframe app and relays. The guard itself is unit-tested."
  - test: "@-mention autocomplete (D-11/D-12)"
    expected: "Typing @ in a note composer (MagicTextArea) and in stream chat (MagicInput) opens the autocomplete"
    why_human: "Interactive UI behavior"
  - test: "Paste-to-upload in stream chat (D-11)"
    expected: "Pasting an image into the stream chat input uploads it"
    why_human: "Interactive UI behavior and upload service"
---

# Phase 6: Close type-safety escape hatches - Verification Report

**Phase Goal:** The two clusters that account for most of the `any` / `as unknown as` / `@ts-ignore` usage (the IndexedDB wrapper and the copy-pasted notification casts) are replaced by properly typed helpers, and each remaining directive states why the type system cannot express it.
**Verified:** 2026-10-05
**Status:** passed (human_needed at automated verification; the 7 human items passed in 06-UAT.md on 2026-10-06)
**Re-verification:** No, initial verification

## Goal Achievement

The goal is achieved at the static and automated level. Every automated check was measured live, not taken from SUMMARY.md. The remaining items are seven browser-only checks that BASELINE.md already records as outstanding, and two of them cover truths whose correctness is a runtime invariant.

### Observable Truths

ROADMAP has no separate success-criteria list for Phase 6 and no requirement IDs (`Requirements: TBD`). The truths below are derived from the goal and the locked decisions D-01..D-18.

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | IndexedDB wrapper is genuinely type-checked and its 16 migration casts collapse into one reasoned helper (D-05, D-06) | VERIFIED | `schema.ts` now uses `type` aliases. A tsc probe against the real schema confirmed `SchemaV13 extends DBSchema` and `SchemaV5 extends DBSchema` hold, that `StoreNames<SchemaV13>` no longer widens to `string`, and that `db.clear("dnsIdentifiers")` and `db.clear("totally-not-a-store")` are both compile errors. `services/database/index.ts` has one `as unknown as` (in `atSchema()`, line 29) behind a rule-scoped ignore. Zero `as unknown as` remain at migration sites. |
| 2 | The six notification `ref as any` casts are removed at the shared cause (D-10) | VERIFIED | `use-scroll-restore.ts` types the callback with `ScrollableList = { scrollTo(offset: number): void }`. `grep "as any"` finds no match in `views/notifications/`. `pnpm build` (tsc) passes, so the other consumers (`lists/following`, `files`, `lists/muted`, `articles`) still type-check. |
| 3 | Every remaining escape hatch carries a rule-scoped ignore whose reason states why the type system cannot express it (D-01, D-12, D-17) | VERIFIED | Live grep finds exactly 3 `aislop-ignore-next-line ai-slop/<rule> -- <reason>` lines (`database/index.ts:28`, `magic-textarea.tsx:201`, `vertex.ts:36`). The only surviving directive is `@ts-expect-error -- TS2344 ...` with its own reason. `@ts-ignore` count outside `src/lib` is 0. The vertex reason matches D-17. The one other `as unknown as` match is a test-double cast in `permissions.test.ts:32`, not a finding and out of scope. |
| 3b | The 19 DEV-only debug globals and `debug-api.ts:52` use `Reflect.set` / `Reflect.deleteProperty` (D-04, D-09) | VERIFIED | 20 `Reflect.set(window, ...)` sites. The diff shows the 19 removed `window.X = X` lines map one-to-one to the added lines, with the same names and values. `debug-api.ts` uses `Reflect.deleteProperty`. All sit inside the existing DEV or `enableDebugApi` blocks. |
| 4 | Library-boundary casts fixed with real types where the mismatch is ours; dead directives deleted (D-11, D-12) | VERIFIED | Adapter: explicit `RelayPoolLike` object plus `toRelayFilters()` (no cast). webln uses the global `Window["webln"]` augmentation. webxdc uses an `unknown` plus `isWebxdcMessage` guard. `use-webxdc` state is `NostrEvent[]`. `common-actions` drops both casts. `nostr-build`, `polyfill` and `vite-env.d.ts` dead directives are deleted (build still passes, no `virtual:pwa-register/react` consumer). `magic-textarea` was reduced from 3 directives to 1 via an `Omit<TextareaProps,"color">` alias. |
| 5 | Scoped rescan shows the 68 -> 0 table (D-13) | VERIFIED | Live `pnpm exec aislop scan --json .`: exit 1 as designed, score 86, 597 diagnostics, 0 findings for each of `ts-directive`, `double-type-assertion` and `unsafe-type-assertion` (35/20/13 -> 0/0/0). The 665 -> 597 drop is exactly 68. Matches BASELINE.md. |
| 6 | `pnpm build` and `pnpm test` pass; new runtime guards and parsers have tests (D-13, D-14) | VERIFIED | `pnpm build` (tsc then vite build) exit 0. `pnpm test` exit 0 with 4 files and 29 tests. These include `jsonrpc.test.ts` (accept and reject sets) and `process.test.ts` (every unit letter in both cases, the unknown-letter throw). |
| 7 | D-07 latent bug fixed in its own commit: `clearCacheData` clears `identities`, not the deleted `dnsIdentifiers` | PRESENT_BEHAVIOR_UNVERIFIED | Code is present and the compile-time guard now exists. Commit `f37f7fbe6` touches only `database/index.ts` (2 lines). The runtime outcome (reload happens, no `NotFoundError`) is browser-only. See behavior_unverified_items. |
| 8 | D-15 / D-08: migration bodies stay runtime-identical; the v5 destructure stores the same shape | PRESENT_BEHAVIOR_UNVERIFIED | Diff `5884dac0a..HEAD` on `database/index.ts` shows only cast-to-`at<>()` substitutions, the destructure, and the D-07 line. Order and calls are unchanged. A real IndexedDB upgrade has not been exercised. See behavior_unverified_items. |

**Score:** 6/8 truths verified (2 present and wired, behavior unverified, human checks listed below).

D-18 (case-insensitive time units, own commit `83221af05`) is covered under truth 6: the named behavior is pinned by passing tests, and WR-01 (strict unknown-letter throw) was fixed in `5e92a0b5b` and is tested.

### Decision Coverage (D-01..D-18)

| D | Status | Evidence |
|---|---|---|
| D-01 | Satisfied | Scan 0/0/0 plus 3 reasoned ignores |
| D-02 | Satisfied | Baseline re-measured live in 06-01 (68, identical `file:line`) |
| D-03 | Satisfied | ROADMAP Phase 6 entry now names `napplet-shell/*`, `wallets/*`, the 19 debug globals and the hook-level cause (git diff on ROADMAP.md). Whether it went through the gsd-tools handler cannot be verified from the tree. |
| D-04 | Satisfied | `debug-api.ts:52` handled, `src/lib` untouched, no sweep of `: any` annotations |
| D-05 | Satisfied | Probe-confirmed genuine typing (truth 1) |
| D-06 | Satisfied | One `atSchema()` helper |
| D-07 | Present, behavior unverified | Truth 7 |
| D-08 | Satisfied statically | Destructure present, no directive. Runtime part is in human item 2. |
| D-09 | Satisfied | Truth 3b |
| D-10 | Satisfied | Truth 2 |
| D-11 | Satisfied statically | Truth 4. Runtime parts are in human items 3 to 7. |
| D-12 | Satisfied | Truths 3 and 4 |
| D-13 | Satisfied | Truths 5 and 6 |
| D-14 | Satisfied | Guard and parser tests exist and pass |
| D-15 | Satisfied statically | Guard test pins the old accept and reject set. Migrations are runtime-identical by diff. |
| D-16 | Satisfied | Git log shows wave order. D-07 (`f37f7fbe6`) and D-18 (`83221af05`) are separate commits, and the schema conversion plus all 16 cast removals are in one commit (`c70b83e80`). |
| D-17 | Satisfied | Vertex `as any` kept with the specified reason |
| D-18 | Satisfied | Truth 6 |

All 18 IDs appear in at least one PLAN's `requirements:` field. No orphaned IDs.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/services/database/schema.ts` | DBSchema-assignable aliases | VERIFIED | Probe-confirmed. V6 also gained the missing `indexes: { created }` that real typing exposed. |
| `src/services/database/index.ts` | `atSchema()` helper, no per-site casts | VERIFIED | Wired into all 11 migration blocks. |
| `src/components/webxdc/jsonrpc.ts` and `.test.ts` | Guard and tests | VERIFIED | Imported by `webxdc.tsx`. Tests pass. |
| `src/views/tools/event-console/process.ts` and `.test.ts` | `parseTimeUnit` and tests | VERIFIED | Used by both subtract and add branches. |
| `src/hooks/use-scroll-restore.ts` | Shared-surface ref type | VERIFIED | Six notification views consume it without casts. |
| `src/services/napplet-shell/adapter.ts` | Typed pool adapter and filter conversion | VERIFIED | Explicit subscription, request and publish only. kehto's optional `count` is not forwarded, which avoids the Observable vs number clash the old cast hid. |
| `06-BASELINE.md` | 68 -> N table and ignore inventory | VERIFIED | Matches live measurements. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `database/index.ts` upgrade callback | `atSchema()` | `at<SchemaVn>()` | WIRED | 11 call sites |
| `webxdc.tsx` message handler | `isWebxdcMessage` | import and early return | WIRED | |
| `process.ts` date parsing | `parseTimeUnit` | direct call | WIRED | |
| Notification views | `useVirtualListScrollRestore` | `ref={scroll.ref}` | WIRED | |
| `wallets/webln.ts` | `Window.webln` | `src/types/webln.d.ts` | WIRED | `getBalance?` was added to the augmentation |
| `clearCacheData` | `identities` store | `db.clear("identities")` | WIRED | Compile-checked |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Build and typecheck | `pnpm build` | exit 0 | PASS |
| Unit tests | `pnpm test` | 4 files, 29 tests passed | PASS |
| Schema genuinely typed | scratch tsc probe (assertions on `DBSchema` extension and `StoreNames`) | assertions hold; the two deliberately wrong `db.clear` calls error | PASS |
| aislop bucket E | `pnpm exec aislop scan --json .` | 0 / 0 / 0, score 86 | PASS |

### Probe Execution

SKIPPED: the phase declares no `probe-*.sh` scripts.

### Requirements Coverage

No `REQUIREMENTS.md` exists and the ROADMAP lists none. The locked decisions D-01..D-18 serve as the requirement set (see Decision Coverage above).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `src/hooks/use-route-state-value.ts` | 9-12 | `isSetter` doc comment overstates what the unchecked predicate does (REVIEW IN-01) | Info | Behavior unchanged from the removed `@ts-ignore` |
| `src/views/tools/event-console/process.ts` | 19-22 | `startsWith("n")` is still case-sensitive (REVIEW IN-02) | Info | Pre-existing, not made worse |
| `src/views/groups/components/group-message-form.tsx` | 26 | Form shape repeated in `useCacheForm` generic (REVIEW IN-03) | Info | Drift risk only |

There are no `TBD`, `FIXME` or `XXX` markers in any source file changed by this phase. REVIEW WR-01 was fixed in `5e92a0b5b` and is covered by tests. IN-01 to IN-03 are unfixed and non-blocking.

Process notes, non-blocking: SUMMARYs 06-02, 06-03 and 06-04 carry no `requirements-completed` frontmatter, though the PLANs declare the IDs. Commit `83a2b9d65` is typed `chore` where `refactor` was intended.

### Human Verification Required

These seven browser-only checks are the same ones listed in `06-BASELINE.md` "Manual verification outstanding". None can be run here, so none is marked verified.

1. **Clear cache data completes (D-07).** Settings > Cache > Database > Clear cache data. Expect the spinner to stop, the page to reload, and no `NotFoundError`. Why human: browser-only IndexedDB.
2. **IndexedDB migrations still run (D-05/D-06/D-08).** Clear site data and load the app: it should boot cleanly. Then load an existing profile: it should boot with accounts intact. Why human: the upgrade path is browser-only, and it runs on the startup path through top-level-await `openDB`.
3. **Napplet subscribe and publish (D-11).** Subscribe and publish through the shell. Note that `publish` now resolves to `void`, where it used to forward the pool's response array. kehto's declared type is `void | Promise<void>`, so this is expected to be fine, but it is unexercised.
4. **WebLN wallet balance (D-11).** With a provider connected, the wallet view should show the balance.
5. **webxdc lifecycle (D-11/D-14/D-15).** The app should receive `webxdc.init` and send and receive a state update.
6. **@-mention autocomplete (D-11/D-12).** `@` should open autocomplete in both MagicTextArea and MagicInput.
7. **Stream chat paste upload (D-11).** Pasting an image should upload it.

### Gaps Summary

No gaps. No truth failed and no artifact is missing, stubbed or unwired. The code evidence supports the phase goal:

- The IndexedDB wrapper is now genuinely typed, and a probe confirms that wrong store names are compile errors.
- The notification casts are gone at their shared cause.
- The scan shows 68 -> 0 findings.
- Only three reasoned ignores remain, and they match the inventory in BASELINE.md and D-17.
- Build and tests are green.

The phase is `human_needed` rather than `passed` because two truths are runtime invariants of IndexedDB. These are the D-07 bug fix and migration equivalence, and they cannot be exercised without a browser. The other five manual items are interaction-level regressions for refactors that touched typed boundaries.

---

_Verified: 2026-10-05_
_Verifier: Claude (gsd-verifier)_
