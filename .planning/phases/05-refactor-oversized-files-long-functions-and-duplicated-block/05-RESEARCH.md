# Phase 5: Refactor oversized files, long functions, and duplicated blocks - Research

**Researched:** 2026-09-24
**Domain:** Internal refactor (file/function splitting, duplicate-block extraction, dead-code
deletion, first test harness) on a React/TypeScript/Vite/pnpm codebase, gated by a committed
aislop lint config
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Done means every bucket-H finding is either fixed or carries a rule-scoped
  `aislop-ignore-*` with a reason. No finding is left un-triaged. Every bucket-H rule is
  warning severity, so unlike Phase 3 nothing in this phase gates CI on its own; the gate fails
  only on error-severity findings in touched files.
- **D-02:** All 33 findings are in scope, including the 14 in files the ROADMAP never names. The
  phase is defined by the bucket, not by the ROADMAP's illustration of it.
- **D-03:** The measured starting point is 33 findings at repo score 85/100 (694 total findings),
  not the ROADMAP's 2026-09-11 numbers. Per-rule counts are unchanged except `function-too-long`
  7 → 8; which files carry them has drifted. The planner must re-measure rather than trust either
  number.
- **D-04:** The ROADMAP.md Phase 5 entry is corrected as part of this phase, before planning
  completes. Stale in three ways: leads with `torrents.ts` as a real target (it's a static data
  table, D-06); describes `napplet-shell-provider.tsx` as ">600 lines" when it is 1162; frames
  `relay-stats.ts` as a thin wrapper to "inline or justify" when `getRelayURL` is dead code
  (D-13). Use the `gsd-tools` roadmap handler — never a direct Write/Edit to ROADMAP.md.
- **D-05:** Default for a borderline `duplicate-block` is ignore-with-reason; extract only the
  clear wins. Extract: `cached-files-card.tsx:95,122` + `service-worker-status-card.tsx:97`
  (see D-07), `magic-textarea.tsx:202`, `direct-message-form.tsx:240`, `error-logger.ts:56`,
  `notifications/common.ts:91,118`, `article-reader.tsx:286,304`, `notifications/index.tsx:77,98`.
  Ignore-with-reason: `code.tsx:40`/`youtube.tsx:58` (coincidental shape), `groups/index.tsx:184`,
  `list-history-modal.tsx:279`.
- **D-06:** `torrents.ts`'s five findings get one file-level ignore
  (`// aislop-ignore-file code-quality/duplicate-block -- torrentCatagories is a static taxonomy;
  repeated {name,tag} entries are independent data, not extractable code`). Explicitly rejected:
  five adjacent line-ignores, hoisting leaves into shared constants.
- **D-07:** The three try/catch+toast handlers in `cached-files-card.tsx` and
  `service-worker-status-card.tsx` are `useAsyncAction` convention violations first; converting
  them is the remedy, clearing `duplicate-block` is a side effect. Verify by rescan that the
  conversion actually clears the finding before assuming it.
- **D-08:** `napplet-shell-provider.tsx` (1162 lines, threshold 600 for `.tsx`) gets the full
  split CONCERNS.md prescribes: adapters promoted into `src/services/napplet-shell/*`, a thin
  provider left behind, modals moved out (D-09). Consumer surface is exactly three sites. Named
  region table (see Code Context below). Watch `windowIdentities`, `approvedCapabilities`,
  `ALWAYS_ALLOW_STORAGE_KEY` — shared across regions, must land in one owning module. Explicitly
  rejected: splitting in place under `providers/global/`, minimum-to-clear-threshold.
- **D-09:** The consent modal (`:1085-1117`) and intent-choice modal (`:1118-1153`) move to
  `components/napplets/`, beside `napplet-frame.tsx`, `napplet-info-drawer.tsx`,
  `napplet-menu.tsx`. Explicitly rejected: JSX under `services/`, a third napplet UI location.
- **D-10:** `services/wallets.ts` (591 lines, threshold 400 for `.ts`) becomes a directory module
  split by backend: `services/wallets/{types,webln,nwc,nutwallet,index}.ts`. Zero-churn for all
  ~13 import sites (Bundler moduleResolution, bare-path consumers, `event-cache`/`database`/
  `sqlite` precedent). Seams: WebLN 137–193, NWC 194–283 (+ `waitForNwcPaid`/
  `fromNwcTransaction`), NutWallet 284–330; shared types into `types.ts`; state/reconciliation/
  21-export public API stay in `index.ts`. No import cycle. Explicitly rejected: types+backends
  only, arbitrary minimum-to-clear-400 seam.
- **D-11:** `installed-napplets.ts`, `napplet-intent-delivery.ts`, `recent-napplets.ts` stay where
  they are — no bucket-H findings, moving them is pure churn. `services/napplet-shell/` holds only
  what comes out of the provider.
- **D-12:** The eight `function-too-long` findings split by kind. Extract (non-component, over
  80): `use-webxdc.ts:22` `useWebxdc` (234, +154), `post-modal/index.tsx:160` `renderBody` (146,
  +66), `webxdc.tsx:138` `handleRequest` (102, +22). `useWebxdc` has clean seams: kind-4932
  subscription effect (40–58), `updates` memo (60–86), two listener effects (87–109), identity
  derivation (110–117), five `useCallback` API methods (118–169). Ignore-with-reason (page
  components, over 160): `poll-form.tsx:72` `PollFormInner` (302), `about.tsx:47` `RelayPage`
  (229), `event-publisher/index.tsx:40` `EventPublisherPage` (216) — reason is inherent JSX
  composition, splitting risks silent regressions with no test coverage. The two
  `napplet-shell-provider.tsx` hits (`:610`, `:962`) are resolved by D-08's split, not separately.
  Explicitly rejected: extracting all eight, fixing only the worst two.
- **D-13:** `relay-stats.ts` is half-dead, dead symbols deleted: `getRelayURL`, `getRTT`,
  `getRTTTag`, `MONITOR_METADATA_KIND`. Kept: `MONITOR_STATS_KIND`, `getNetwork`,
  `getSupportedNIPs`. Resolves the `getRTTTag(stats, _name)` bug Phase 4 deferred here (always
  matches `t[1] === "open"`, so `getRTT`'s read/write are silent duplicates of open) by deleting
  the only code it lives in. Explicitly rejected: fixing and keeping `getRTT`, deferring the bug
  again.
- **D-14:** `services/verify-event.ts`'s `verifyEvent` is kept and ignored-with-reason — genuinely
  load-bearing, indirects over module-level `verifyEventMethod` swapped at runtime by
  `updateVerifyMethod` (wasm/internal/fake). Two real consumers: `event-store.ts:3`,
  `napplet-shell-provider.tsx:81`. The `-- reason` must state the late-binding requirement.
- **D-15:** Add vitest, scoped to the pure functions this phase creates (permission/grant
  decisions, identity keying, wallet backend factories). Overturns P3 D-04. Repo pins vite ^8.1.5
  and typescript ^5.9.3; the vitest major must match vite 8 — researcher must confirm, do not
  assume; pin exactly per P2 D-14; `pnpm-workspace.yaml`'s `minimumReleaseAge` may need a
  `minimumReleaseAgeExclude` entry; P2 D-14's precedent is a blocking package-legitimacy
  checkpoint before install. A `test` script must be added to `package.json` (currently none);
  `.planning/config.json`'s `test_command` is presently `pnpm build`.
- **D-16:** Pure-move commits are separated from behavior-touching edits. Each relocation lands
  as a move-only commit; any adjustment follows in its own commit. Where a move cannot be pure
  (import paths must change), say so in the commit message.
- **D-17:** Waves run low-risk first, big splits last. Wave 1: D-06 file-level ignore, D-13
  deletions, D-05 borderline ignores. Wave 2: small extractions (D-07 conversions,
  magic-textarea, direct-message-form, error-logger, notifications, article-reader). Wave 3: the
  vitest harness (D-15) and the two big splits (D-08, D-10).
- **D-18:** Latent bugs found mid-refactor are fixed if trivial and recorded if not — never
  dropped. A small, provable fix lands in its own commit; anything larger is promoted to a
  tracked backlog item before the phase closes.
- **D-19:** Verification is a scoped rescan with a per-rule before/after table (33 → N) plus an
  explicit list of every site left standing behind an ignore with its reason, backed by the D-15
  test suite. `pnpm build` must pass after every task.

### Claude's Discretion

- The exact module boundaries and file names within `services/napplet-shell/*` and
  `services/wallets/*`, subject to D-08's and D-10's named seams.
- How `useWebxdc` divides into sub-hooks, and the shape of the `renderBody` / `handleRequest`
  extractions.
- The exact wording of every `-- reason` string, subject to D-08's justification bar.
- Which specific pure functions get vitest coverage under D-15's scope boundary.
- Plan-to-wave assignment within the D-17 ordering.

### Deferred Ideas (OUT OF SCOPE)

- Splitting the three oversized page components (`PollFormInner`, `RelayPage`,
  `EventPublisherPage`) — ignored-with-reason under D-12.
- Consolidating the three sibling napplet services under `services/napplet-shell/` — no
  findings, pure churn, excluded by D-11.
- A general testing initiative — D-15 is scoped to the pure functions this phase creates only.
- A shared embed component for `code.tsx`/`youtube.tsx` — rejected under D-05 as coincidental
  shape.
- Restructuring `torrentCatagories` — rejected under D-06 as harmful to readability.
- `react-hooks/exhaustive-deps` (backlog 999.5) and `rules-of-hooks` (999.2) — must not be swept
  in even where they sit in a file this phase restructures.
- Setting `workflow.ui_safety_gate: false` in `.planning/config.json` — deliberately left
  unchanged; still unaddressed.

</user_constraints>

## Project Constraints (from CLAUDE.md / AGENTS.md)

- `.aislop/config.yml` / `.aislop/rules.yml` are the real filenames (not `.yaml`); this project
  has no `.aislop/rules.yml` today (only `.aislop/config.yml`), so no architecture-rule file
  exists to consult.
- aislop hook findings are feedback only (not blocking); fix findings your own change introduces,
  do not sweep pre-existing findings in touched files outside this phase's named buckets.
- Rule-scoped `aislop-ignore-*` directives must name the rule and end with `-- reason`
  (`AGENTS.md` §"Inline ignores"). Bare directives are not acceptable.
- Where `.claude/CLAUDE.md`/`AISLOP.md` differ from `AGENTS.md`, `AGENTS.md` wins.
- `useAsyncAction` (REQUIRED) for async actions/callbacks in components instead of raw try/catch
  (`AGENTS.md` §"useAsyncAction Hook").
- Relative imports preferred; `~/` alias configured but rarely used — new modules should follow
  the relative-import convention, not introduce `~/` imports.
- `pnpm lint` always exits non-zero — never chain with `&&`; `pnpm lint:ci` is the actual gate,
  scored from `git merge-base origin/next HEAD`.
- Commits: pure-move commits separated from behavior-touching edits (D-16, extends P4 D-04).

## Summary

CONTEXT.md for this phase is unusually complete: 19 locked decisions with measured line numbers,
named split seams, and a wave ordering already exist. This research's job was to close the two
gaps CONTEXT.md explicitly leaves open (re-measure the findings; confirm the vitest version) and
to de-risk the two large relocations (D-08, D-10) with a line-by-line trace of shared mutable
state. **Every measurement in CONTEXT.md checked out exactly against a fresh rescan and a full
read of both large target files — there is no drift and no CONTEXT CONFLICT to report.** The one
genuinely open question CONTEXT.md flagged (D-15's vitest version) is now resolved: **vitest 5.0.1
is peer-compatible with vite ^8.1.5 and Node 24 (CI's pinned version)**, and no
`minimumReleaseAgeExclude` entry is needed because the exact-pinned version is already 9 days
old (pnpm 11's default `minimumReleaseAge` is 1440 minutes = 1 day). The package-legitimacy
checkpoint will still return **SUS** ("too-new") on the bare `vitest` name — this is expected and
required to be gated behind `checkpoint:human-verify`, per the package-legitimacy protocol, not a
sign of a hallucinated package (73.8M weekly downloads, `github.com/vitest-dev/vitest`).

Two small, concrete corrections to CONTEXT.md's discretionary areas surfaced during the file
reads (both are refinements within "Claude's Discretion," not conflicts with locked decisions):
`useWebxdc` has a sixth `useCallback` (`joinRealtimeChannel`, 68 lines) not named in D-12's
breakdown, sharing state with the unmount-cleanup effect; and the D-08 region table's boundaries
are approximate — several intent-service helper functions (`getSigner` through
`handlerMatchesPreference`, lines 179–238) and the `getReadRelays`/`getWriteRelays` pair
(773–779, used by **both** the common-actions region and the adapter region) sit just outside the
table's line ranges and need explicit ownership assignment.

**Primary recommendation:** Plan exactly as CONTEXT.md prescribes (D-05 through D-19, in the D-17
wave order); pin `vitest` at `5.0.1` exactly behind a `checkpoint:human-verify` task; give
`getReadRelays`/`getWriteRelays` and the permission-state helpers (`identityKey`,
`hasApprovedCapability`, `approvedCapabilities`, `grantCapabilities`, the always-allow trio) their
own small owning module in `services/napplet-shell/` rather than folding them into
`adapter.ts`/`common-actions.ts`, since both are genuinely cross-region.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Napplet permission storage & grant decisions (`approvedCapabilities`, always-allow list) | Services (`services/napplet-shell/`) | Frontend Provider (consent UI) | Pure decision logic belongs in a services module per CONCERNS.md; the provider only renders the consent modal and calls into it |
| Napplet window/session identity tracking (`windowIdentities`) | Services (`services/napplet-shell/`) | Frontend Provider (register/unregister on mount/unmount) | Read by the resource-fetch service, written by the provider's frame lifecycle callbacks — the map itself must live where both can reach it without a circular import |
| Napplet resource fetch gating | Services (`services/napplet-shell/resource-service.ts`) | — | Pure request/response handling, no React dependency |
| Napplet common actions (profile/follow/react/report) | Services (`services/napplet-shell/common-actions.ts`) | — | Talks to `event-store`/`pool`/`actions`, no React dependency |
| Napplet shell adapter wiring (`ShellAdapter`) | Services (`services/napplet-shell/adapter.ts`) | — | Glue between `@kehto/shell` and noStrudel services; still no React dependency |
| Napplet consent / intent-choice modals | Frontend Provider → Component (`components/napplets/`) | — | JSX belongs beside existing napplet UI, not under `services/` (D-09) |
| Wallet backends (WebLN/NWC/NIP-60) | Services (`services/wallets/`) | — | Singleton reactive services; consumed by `hooks/use-wallets.ts` and views, never own JSX |
| `useWebxdc` sub-hooks | React Hooks (`hooks/`) | — | Stays a hook; internal split is hook composition, not a tier change |
| Duplicate-block extractions (toast handlers, slider triples, nav-box metadata) | Component / View | — | All in-tier extractions — no capability crosses a tier boundary |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 5.0.1 (exact pin) | Unit-test runner for the pure functions this phase creates | Peer-compatible with the repo's pinned `vite ^8.1.5` (`vite: "^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0"`) and Node 24 (`engines.node: "^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0"`, CI pins Node 24) — verified via `npm view vitest peerDependencies` / `engines` `[VERIFIED: npm registry]` |

**Version verification:** `npm view vitest version` → `5.0.1`, published 2026-09-15 (`npm view
vitest time --json`). `npm view vitest peerDependencies --json` confirms
`"vite": "^6.4.0 || ^7.0.0 || ^8.0.0"` and `"@types/node": "^22.0.0 || >=24.0.0"` (this repo
already resolves `@types/node@26.1.2` via vite's own dependency tree — no new install needed).
`npm view vitest engines --json` confirms `"node": "^22.12.0 || ^24.0.0 || >=26.0.0"` — CI's
`node-version: 24` (all four workflows) satisfies this. `[VERIFIED: npm registry]`

**Do NOT use vitest's `^` or `~` range** — pin the literal string `"vitest": "5.0.1"` in
`devDependencies`, per P2 D-14's exact-pin precedent (same pattern as `"aislop": "0.16.1"`
already in `package.json`).

**Alternative considered:** `vitest@4.1.11` (published 2026-08-18, also peer-compatible with vite
8 since 4.1.1: `"vite": "^6.0.0 || ^7.0.0 || ^8.0.0"`). Vitest 4 is a fully mature, previously
"latest" major; picking it instead of 5.0.1 would not materially change the package-legitimacy
check's outcome (the checker evaluates the bare package name against its `latest` dist-tag,
which is 5.0.1, regardless of which version is actually pinned) but would trade "current major"
for "one release behind." No functional reason favors 4.x for this phase's narrow scope
(pure-function unit tests, no browser-mode/coverage features used from either major). Recommend
**5.0.1** to match this project's general pattern of tracking current majors (`vite ^8.1.5`,
`typescript ^5.9.3`, `react ^19.2.8`), but 4.1.11 is a safe fallback if the checkpoint reviewer
wants a more battle-tested option. `[CITED: npm registry version history]`

**Installation:**
```bash
pnpm add -D vitest@5.0.1 --save-exact
```

**`pnpm-workspace.yaml` change: NONE required.** pnpm 11 defaults `minimumReleaseAge` to 1440
minutes (1 day) even though this repo's `pnpm-workspace.yaml` carries no explicit
`minimumReleaseAge:` key — only a `minimumReleaseAgeExclude` list `[CITED: pnpm.io/blog/releases/11.0,
pnpm.io/settings/dependency-resolution]`. `vitest@5.0.1` was published 2026-09-15; as of this
research (2026-09-24) it is 9 days old, already past the 1-day default threshold. Because D-15
requires an **exact pin** (no `^`/`~`), pnpm will only ever attempt to resolve the literal string
`5.0.1` — it cannot silently jump to a newer, possibly-too-recent patch — so no
`minimumReleaseAgeExclude` entry is needed now or later for this dependency. If the executor pins
a *different*, more-recently-published patch at plan time, re-check its age with
`npm view vitest@<version> time.created` before assuming the same holds.

**`allowBuilds` change: NONE required.** `npm view vitest dependencies --json` shows vitest 5.0.1's
runtime deps (`chai`, `std-env`, `tinyexec`, `picomatch`, `tinybench`, `tinyglobby`, `magic-string`,
`@vitest/mocker`, `es-module-lexer`, `why-is-node-running`, `expect-type`, `obug`) are all pure JS
with no postinstall/native build step. `npm view vitest scripts.postinstall` returns nothing
(confirmed via the package-legitimacy check's `postinstall: null` signal). `[VERIFIED: npm registry]`

**`test` script for `package.json` (none exists today):**
```json
"test": "vitest run"
```
Non-watch, CI-safe single run. A `"test:watch": "vitest"` script is optional and not required by
D-15's narrow scope.

**`.planning/config.json`'s `test_command`:** change from `"pnpm build"` to `"pnpm test"` **only
in the same commit that adds the first `*.test.ts` file** (Wave 3), not before — `pnpm test` will
fail with "no test files found" if flipped earlier. `build_command` stays `"pnpm build"`
unchanged; it remains the separate, always-applicable type-check gate D-19 requires after every
task.

### Vitest config: minimal, standalone `vitest.config.ts` — do NOT extend `vite.config.ts`

`vite.config.ts` wires `@vitejs/plugin-react`, `vite-plugin-pwa` (`injectManifest` strategy
scanning `src/sw/worker`), and `vite-tsconfig-paths`. None of these are needed to run unit tests
against pure functions, and `vite-plugin-pwa`'s manifest injection is unnecessary overhead (and a
plausible source of flakiness) in a test-collection run. A separate root-level `vitest.config.ts`
keeps the test runner fully decoupled from the app build config — consistent with D-16's "a
reviewer can verify mechanically" ethos.

```typescript
// vitest.config.ts — minimal, no app plugins
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // targets are pure functions; no DOM API needed
  },
});
```

- **Environment:** `node`, not `jsdom`/`happy-dom`. D-15's named targets (permission/grant
  decisions, identity keying, wallet backend factories) don't touch the DOM. Adding jsdom would
  be an unjustified extra devDependency for this phase's scope.
- **No `globals: true`:** tests import `describe`/`it`/`expect` explicitly from `"vitest"`. This
  avoids touching `tsconfig.json`'s `types` (which doesn't exist today) just to add vitest's
  global type declarations — keeps the diff minimal per D-16.
- **No `include` override needed:** vitest's default test-file glob
  (`**/*.{test,spec}.?(c|m)[jt]s?(x)`) already matches the repo's existing kebab-case-with-suffix
  convention if new test files are named `permissions.test.ts` etc.
- **Test file location:** colocate `*.test.ts` beside the module under test (e.g.
  `services/napplet-shell/permissions.test.ts` next to `permissions.ts`), matching common vitest
  convention; the repo has no prior test-location precedent to follow or violate.
- **`tsconfig.json` change: none required.** `pnpm build`'s `tsc --project tsconfig.json` only
  type-checks `include: ["src"]`; `vitest.config.ts` at the repo root is already outside that
  scope, exactly like the existing (untouched) `vite.config.ts`. New `*.test.ts` files under
  `src/` **will** be type-checked by `pnpm build` since they're inside `src/` — this is a feature
  (catches type errors in tests) not a gap, and requires no config change since vitest ships its
  own TypeScript types as part of the package.

### Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `vitest` | npm | latest (`5.0.1`) published 9 days ago (2026-09-15) | 73,825,000/wk | `github.com/vitest-dev/vitest` | **SUS** (`too-new`) | Keep — gate behind `checkpoint:human-verify` before `pnpm add -D vitest@5.0.1 --save-exact` |

**Packages removed due to SLOP verdict:** none.
**Packages flagged as suspicious [SUS]:** `vitest` — the `gsd-tools query package-legitimacy
check --ecosystem npm vitest` seam returns `SUS`/`too-new` because it evaluates the bare package
name against its current `latest` dist-tag (`5.0.1`, 9 days old at research time), not against
whichever exact version is ultimately pinned. This is expected for any devDependency added
shortly after a major-version GA and is **not** evidence of a hallucinated or slopsquatted
package: 73.8M weekly downloads and a matching official GitHub org confirm this is the real,
well-known `vitest`. Per the package-legitimacy protocol, the planner must still insert a
`checkpoint:human-verify` task immediately before the install task. The seam's `check` subcommand
takes a bare package name only — `vitest@5.0.1` or `vitest@4.1.11` both return `SLOP`/
`does-not-exist` because they're treated as literal (invalid) package names, not
name+version-constraint queries; do not pass a version suffix to this seam.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │      providers/global/napplet-shell-        │
                    │      provider.tsx  (thinned, ~200 lines)     │
                    │  - useState(consent), useState(intentChoice) │
                    │  - registerFrame / unregisterFrame           │
                    │  - requestConsent / respond                  │
                    └──────────────┬────────────────────────────────┘
                                   │ calls into (no more inline logic)
                                   ▼
   ┌───────────────────────────────────────────────────────────────────┐
   │                    src/services/napplet-shell/                     │
   │                                                                     │
   │  permissions.ts  ── identityKey, hasApprovedCapability,             │
   │      (NEW, pure)     grantCapabilities/revokeCapabilities,          │
   │                      getAlwaysAllowed/addAlwaysAllowed/             │
   │                      isAlwaysAllowed, approvedCapabilities Map      │
   │           ▲                              ▲                         │
   │           │ read                         │ read/write              │
   │  resource-service.ts            (provider's requestConsent/respond)│
   │      windowIdentities.get()              │                         │
   │           ▲                                                        │
   │           │ write (registerFrame/unregisterFrame)                  │
   │  window-identities.ts (or folded into permissions.ts)               │
   │      windowIdentities Map                                          │
   │                                                                     │
   │  intent-service.ts ── createNappletIntentService + its helpers      │
   │      (getSigner..handlerMatchesPreference, lines 179–320)           │
   │  common-actions.ts ── getIdentityProfile/Follows, publishCommonEvent,│
   │      changeCommonFollow, reactCommon, report* (337–504)             │
   │  upload-service.ts ── blobToFile, createBlossomUploadService         │
   │  resource-service.ts ── fetchOne/handleMessage (565–772)             │
   │  relay-tiers.ts ── getReadRelays/getWriteRelays (SHARED by           │
   │      common-actions.ts AND adapter.ts — needs its own module)        │
   │  adapter.ts ── createAdapter (781–960), calls into all of the above  │
   └───────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    components/napplets/{consent-modal,intent-choice-modal}.tsx
                    (new files, JSX moved verbatim out of the provider, D-09)


   src/services/wallets/                       consumers (13 import sites,
   ├── types.ts     (WalletBackend, WalletTransaction,     unchanged, bare
   │                 WalletBackendType — 6+ files already    "services/wallets"
   │                 import these as types)                  path resolves via
   ├── webln.ts     (createWeblnBackend, hasWebln)            moduleResolution:
   ├── nwc.ts       (createNwcBackend, waitForNwcPaid,        "Bundler")
   │                 fromNwcTransaction)
   ├── nutwallet.ts (nutWalletBackend)
   └── index.ts     (state, reconciliation, wallets$,
                      activeWallet$, the 21-export public API)
```

### Recommended Project Structure

```
src/
├── services/
│   ├── napplet-shell/
│   │   ├── permissions.ts       # identityKey, approvedCapabilities, grant/revoke, always-allow
│   │   ├── window-identities.ts # windowIdentities Map + register/unregister (or fold into permissions.ts)
│   │   ├── intent-service.ts    # createNappletIntentService + its private helpers
│   │   ├── common-actions.ts    # NAP-COMMON: profile/follows/react/report
│   │   ├── upload-service.ts    # NAP-UPLOAD: blossom upload
│   │   ├── resource-service.ts  # NAP-RESOURCE: fetch gating
│   │   ├── relay-tiers.ts       # getReadRelays/getWriteRelays (shared)
│   │   └── adapter.ts           # createAdapter — composition root
│   └── wallets/
│       ├── types.ts
│       ├── webln.ts
│       ├── nwc.ts
│       ├── nutwallet.ts
│       └── index.ts
├── providers/global/
│   └── napplet-shell-provider.tsx  # thinned: state + modal rendering only
└── components/napplets/
    ├── consent-modal.tsx           # moved from provider :1085-1117
    ├── intent-choice-modal.tsx     # moved from provider :1118-1153
    ├── napplet-frame.tsx           # existing, unchanged
    ├── napplet-info-drawer.tsx     # existing, unchanged
    └── napplet-menu.tsx            # existing, unchanged
```

### Pattern 1: Directory module with `index.ts` re-export surface (D-10's model)

**What:** Convert a single oversized `.ts` service file into a directory of the same base name,
with `index.ts` holding the public API and internal files split by concern.
**When to use:** A `.ts` (non-component) service file over `maxFileLoc` with clean internal seams
and consumers that only import from the bare module path (never `/index` explicitly).
**Example (existing in-repo precedent, not hypothetical):**
```typescript
// src/services/event-cache/index.ts — the model D-10 follows
import { EventCache } from "./interface";
// ... loads one of several backend modules (hosted-relay.ts, local-relay.ts,
// native-sqlite.ts, nostr-idb.ts, wasm-worker.ts) at runtime, exposes a single
// reactive surface. Every consumer imports "../services/event-cache", never
// "../services/event-cache/index".
```
Verified: all 13 of `services/wallets.ts`'s current consumers use the bare relative path (e.g.
`from "../../../services/wallets"`), never an explicit `/index` suffix — confirmed via
`grep -n 'from ".*wallets"'` across every consumer file. `tsconfig.json`'s
`"moduleResolution": "Bundler"` resolves a bare directory import to `index.ts` automatically, so
this conversion requires zero import-statement edits at any of the 13 sites.
`[VERIFIED: repo grep]`

### Pattern 2: Cross-region shared mutable state gets its own owning module, not either caller

**What:** When two regions of a to-be-split file both read/write the same module-level `Map`/
`Set` or the same pair of helper functions, neither region "owns" it — it needs a small dedicated
module both import.
**When to use:** D-08's split, specifically.
**Concrete instances found by tracing every read/write site in `napplet-shell-provider.tsx`:**

| Shared state | Declared | Written by | Read by |
|---|---|---|---|
| `windowIdentities` (Map) | line 138 | `registerFrame`/`unregisterFrame` (provider, 1034–1047) | `createResourceService`'s `fetchOne`/`isAllowed` (resource-service region, line 645) |
| `approvedCapabilities` (Map) | line 144 | `grantCapabilities` (called from provider's `requestConsent`/`respond`); **also written directly** via `approvedCapabilities.delete(...)` inside `respond` (line 1065) — this bypasses `grantCapabilities`'s own encapsulation | `hasApprovedCapability` (resource-service's `isAllowed`, line 614–615) |
| `ALWAYS_ALLOW_STORAGE_KEY` + `getAlwaysAllowed`/`addAlwaysAllowed`/`isAlwaysAllowed` (121–170) | line 121 | `addAlwaysAllowed` (provider's `respond`, line 1063) | `isAlwaysAllowed` (provider's `requestConsent`, line 1024) |
| `getReadRelays`/`getWriteRelays` (773–779) | — | — (pure reads of `localSettings`) | `publishCommonEvent` (common-actions region, line 409) **and** `createAdapter` (adapter region, lines 792, 810, 900, 949) |

**Recommendation:** Put `identityKey`, `hasApprovedCapability`, `approvedCapabilities`,
`grantCapabilities`, and a new `revokeCapabilities(identity)` (replacing the direct
`approvedCapabilities.delete(...)` call in `respond` — this is a small **behavior-preserving but
not byte-identical** change, so it must land in its own commit per D-16, not folded into the
move) plus the always-allow trio into one `permissions.ts`. `windowIdentities` can live in the
same file (it's small and conceptually adjacent — "who is this napplet, what have we granted
it") or a sibling `window-identities.ts`; either is within D-08's "Claude's Discretion" for exact
module boundaries. `getReadRelays`/`getWriteRelays` need their own tiny `relay-tiers.ts` (or move
into `adapter.ts` and have `common-actions.ts` import them from there) since they're consumed by
two different regions that otherwise have no reason to import from each other.

### Pattern 3: Region boundaries in the D-08 table are approximate — verify the actual call graph before drawing file boundaries

The named region table (240–322, 337–504, 512–556, 565–772, 781–960, 962–1157) is accurate as a
starting map but every boundary has a few lines of "spillover" that belong logically with the
following/preceding region rather than the raw line range:

- Lines 179–238 (`getSigner`, `asIntentPayload`, `installedHandlersFor`, `candidateFor`,
  `availabilityFor`, `failed`, `handlerMatchesPreference`) sit **before** the table's "intent
  service" row (240–322) but are used **exclusively** by `createNappletIntentService` — they
  belong in `intent-service.ts`, not left orphaned at module scope. Exception: `getSigner`
  (179–189) is also used by `createAdapter`'s `auth.getSigner` (line 818) and by
  `services.identity`'s `getSigner` option (line 912) — it is genuinely shared between
  intent-service and adapter/common-actions, and should live in its own small file (or in
  `adapter.ts`, since that's the composition root) rather than inside `intent-service.ts`.
- `blobToFile` (505–510) precedes the table's "blossom upload service" row (512–556) by 7 lines
  but is called only from `createBlossomUploadService` — belongs in `upload-service.ts`.
- `arrayBufferToBase64` (557–563) precedes the "resource service" row (565–772) by 8 lines but is
  called only from `createResourceService`'s `fetchOne` — belongs in `resource-service.ts`.
- `firstOrUndefined` (322–333) is fully self-contained within the "identity/profile/follows"
  region (337–504) — all four call sites (`getIdentityProfile`, `getIdentityFollows`,
  `getCommonProfile`, `reactCommon`) are in that region. No cross-region sharing here, unlike the
  three items above.

### Anti-Patterns to Avoid

- **Converting `loadCachedFiles` in `cached-files-card.tsx` "for consistency" with D-07's three
  target handlers:** `loadCachedFiles` (lines 44–61) has the same try/catch+toast+finally shape
  as the three flagged handlers but was **not** flagged by aislop's duplicate-block detector (its
  catch also calls `setCacheInfos([])` before the toast, a slightly different shape) and is not
  named in D-05/D-07. Converting it is scope creep under D-02's discipline — leave it untouched.
  Confirmed via the raw diagnostic `detail` field: the two flagged findings in this file
  (`L95`→matches`L70`, `L122`→matches`L71`) both anchor inside `handleClearCache` (64–87), never
  inside `loadCachedFiles`.
- **Assuming the `service-worker-status-card.tsx:97` finding is inside `checkForUpdate`:** the
  raw line (97) and its `detail` (`"10 lines duplicate block at L69"`) land closer to
  `applyUpdate` (85–108) than to `checkForUpdate` (37–82) when checked against the file's actual
  line contents — see Common Pitfalls below. Convert `checkForUpdate` first (it has the clear
  D-07 shape: hand-rolled `isCheckingForUpdate` state, matching the cached-files-card pattern
  exactly) and **verify by rescan** per D-07 rather than assuming which function the finding
  targets; extend to `applyUpdate` if the finding persists.
- **Extending `vite.config.ts` with a `test:` block instead of a standalone `vitest.config.ts`:**
  pulls in `vite-plugin-pwa`'s manifest-injection machinery for a test run that never needs it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Async action loading state + error toast | A new `isX`/`setIsX` boolean plus manual try/catch/finally per handler | `useAsyncAction` (`src/hooks/use-async-action.ts`) | Already exists, already the documented convention (`AGENTS.md` §"useAsyncAction Hook"), and is exactly what D-07 requires |
| Directory-module backend selection | A hand-written dynamic `import()` switch inside `wallets/index.ts` | The existing `wallets$`/`nutWalletState$` reactive composition pattern already in the file — just relocate it, don't redesign it | D-10 is explicitly a relocation, not a redesign; `services/event-cache/` already demonstrates the backend-selection pattern this file should mirror structurally |
| Test runner config | A custom Vite plugin or manual `esbuild-register` harness for running `*.test.ts` | `vitest` (peer-compatible with the pinned vite 8) | Vitest is purpose-built to share the project's existing Vite/esbuild pipeline; hand-rolling a runner would duplicate that machinery for no benefit |

**Key insight:** Every "Don't Hand-Roll" item in this phase is really "don't hand-roll a *second*
version of something the codebase already has one of" — `useAsyncAction`, the reactive
backend-selection pattern, and the Vite toolchain itself. This phase moves and tests existing
logic; it does not need any new abstraction library.

## Runtime State Inventory

> Not applicable — this is a code-structure refactor (file/function splitting, dead-code
> deletion), not a rename/rebrand/migration. No stored data, live-service config, OS-registered
> state, secrets, or build artifacts reference any of the symbols being moved or deleted by name
> in a way that survives outside the source tree:

- **Stored data:** `ALWAYS_ALLOW_STORAGE_KEY` (`"nostrudel:napplet:always-allow"`) is a
  `localStorage` key — the *string value* is unchanged by D-08's split (only the code that reads/
  writes it moves files), so no user's existing `localStorage` entry is invalidated. **Action:
  none** — this is a pure code relocation, not a rename of the storage key itself.
- **Live service config:** None. No n8n/Datadog/Tailscale/Cloudflare-style external config
  references any symbol this phase touches.
- **OS-registered state:** None.
- **Secrets/env vars:** None. `localSettings.verifyEventMethod` (used by `verify-event.ts`,
  D-14) is a `PreferenceSubject`-backed value, not an env var or secret, and D-14 keeps
  `verify-event.ts` unmodified (ignore-with-reason only).
- **Build artifacts / installed packages:** `vitest` is a *new* devDependency being installed by
  this phase (see Standard Stack), not a stale artifact from a prior rename — not applicable to
  this inventory category.

## Common Pitfalls

### Pitfall 1: Trusting the aislop `line` field as the exact edit target for `duplicate-block`

**What goes wrong:** Assuming the reported `line` is the start of the flagged block, or that it
lands inside the function CONTEXT.md's prose names.
**Why it happens:** For most findings in this phase the anchor line *is* a clean proxy for "the
duplicate function" (e.g. `cached-files-card.tsx:95` sits inside `handleClearAllCaches`'s
`toast({` call). But the `service-worker-status-card.tsx:97` finding's raw line (a `});` closing
an `addEventListener` callback inside `applyUpdate`, not inside `checkForUpdate`) and its
`detail` field (`"10 lines duplicate block at L69"`, where line 69 is the closing brace of
`checkForUpdate`'s `else` branch) don't cleanly resolve to one obviously-correct function the way
the `cached-files-card.tsx` pair does.
**How to avoid:** Use the `detail` field (`"N lines duplicate block at L<X>"`) together with a
full read of the file to bracket the *pair* of matched spans, not just the reported `line`.
Convert the function with the clearest D-07 shape first (`checkForUpdate`, which has the
hand-rolled `isCheckingForUpdate` loading state D-07 is really about), then **verify by rescan**
(D-07's own requirement) whether the finding cleared; if not, `applyUpdate` is the fallback
target.
**Warning signs:** A conversion that doesn't reduce the bucket-H count by exactly the number of
findings the task claims to clear — the D-19 before/after table will surface this immediately if
checked per-task rather than only at phase end.

### Pitfall 2: `respond()`'s direct `approvedCapabilities.delete(...)` breaks D-16 if folded into the "pure move"

**What goes wrong:** `napplet-shell-provider.tsx`'s `respond` callback (line 1065) calls
`approvedCapabilities.delete(identityKey(consent.identity))` directly, bypassing the
`grantCapabilities` helper that's the Map's only other write path. If the plan just moves the
Map and both call sites verbatim into `permissions.ts` and exports the Map itself for the
provider to keep poking directly, `permissions.ts`'s encapsulation is fake — the provider can
still reach into the Map's internals.
**Why it happens:** It's the path of least resistance for a "pure move" commit, and it *is*
byte-identical, so D-16's own bar doesn't catch it — but it defeats the point of extracting a
"pure functions with unit tests" module (D-15's justification for the whole split).
**How to avoid:** Add a `revokeCapabilities(identity)` export next to `grantCapabilities` in
`permissions.ts`, and have `respond` call it instead of touching the Map. This is a **tiny
behavior-preserving edit**, not a pure move — land it as its own small follow-up commit per D-16
("where a move cannot be pure, say so in the commit message"), immediately after the move commit
that creates `permissions.ts`.
**Warning signs:** Any new module in `services/napplet-shell/` that exports a mutable `Map`/`Set`
directly (rather than only functions) has not actually achieved the "pure functions" testability
D-15 is chasing.

### Pitfall 3: `useWebxdc`'s sixth callback (`joinRealtimeChannel`) is not in D-12's named breakdown

**What goes wrong:** Planning the `useWebxdc` split off D-12's list of "five `useCallback` API
methods" (`sendUpdate`, `setUpdateListener`, `getAllUpdates`, `sendToChat`, `importFiles`) misses
`joinRealtimeChannel` (lines 171–238, 68 lines — the single largest callback in the hook) and the
unmount-cleanup effect (100–108) that shares `realtimeActiveRef`/`realtimeAbortRef` with it.
**Why it happens:** D-12's prose lists five callbacks; the actual file has six, and the sixth is
large enough to change the shape of "how `useWebxdc` divides into sub-hooks" (Claude's Discretion
per D-12).
**How to avoid:** Group `joinRealtimeChannel` with the unmount-cleanup effect into one
"realtime channel" sub-hook (they share both refs); do not leave it attached to the same sub-hook
as the four short, independent callbacks.
**Warning signs:** A sub-hook boundary that splits `realtimeActiveRef`/`realtimeAbortRef` reads
from their writes.

### Pitfall 4: `.planning/config.json`'s `test_command` flipped before Wave 3 has a test file

**What goes wrong:** If `test_command` is changed to `"pnpm test"` in a Wave 1 or Wave 2 commit
(before any `*.test.ts` file exists), any tooling that runs `test_command` will fail with
"No test files found" — a spurious red gate unrelated to the actual work in that wave.
**Why it happens:** It's tempting to make the config.json edit alongside the `package.json`
`test` script addition as a single "infrastructure" commit early in the phase.
**How to avoid:** Land the `package.json` `test` script, `vitest.config.ts`, the `vitest`
devDependency, **and** the first `*.test.ts` file together in one Wave 3 commit/plan, and flip
`test_command` in that same commit.

## Code Examples

### D-07: `useAsyncAction` conversion shape (target: `handleClearCache` et al.)

```typescript
// Source: src/hooks/use-async-action.ts (existing in-repo, unmodified)
// Before (src/views/settings/background-worker/cached-files-card.tsx:64-87):
const handleClearCache = async (cacheName: string) => {
  setIsClearingCache(cacheName);
  try {
    await clearCache(cacheName);
    setCacheInfos((prev) => prev.filter((cache) => cache.name !== cacheName));
    toast({ title: "Cache cleared", description: `Cache "${formatCacheName(cacheName)}" has been cleared successfully`, status: "success", duration: 3000 });
  } catch (error) {
    console.error(`Failed to clear cache ${cacheName}:`, error);
    toast({ title: "Failed to clear cache", description: `Could not clear cache "${formatCacheName(cacheName)}"`, status: "error", duration: 3000 });
  } finally {
    setIsClearingCache(null);
  }
};

// After (shape only — exact wording of the success toast is a view concern, not this research's call):
const { loading: clearingCache, run: handleClearCache } = useAsyncAction(async (cacheName: string) => {
  await clearCache(cacheName);
  setCacheInfos((prev) => prev.filter((cache) => cache.name !== cacheName));
  toast({ title: "Cache cleared", description: `Cache "${formatCacheName(cacheName)}" has been cleared successfully`, status: "success", duration: 3000 });
}, [toast]);
// isLoading={isClearingCache === cacheInfo.name} becomes isLoading={clearingCache} — note this
// collapses the per-cache-name loading distinction into a single boolean; useAsyncAction has no
// concept of "which invocation is loading." Confirm this UX change is acceptable, or keep a
// small local Set<string> alongside useAsyncAction's `loading` if per-row loading state must be
// preserved — this is a real design decision the plan must make explicit, not silently drop.
```

### D-13: minimal deletion shape for `relay-stats.ts`

```typescript
// Source: src/helpers/nostr/relay-stats.ts (current, 43 lines)
// Delete: getRelayURL (7-9), getRTTTag (23-36), getRTT (37-43), MONITOR_METADATA_KIND (4)
// Keep unchanged: MONITOR_STATS_KIND (5), getNetwork (10-12), getSupportedNIPs (13-15)
// Resulting file is ~12 lines. No consumer imports touch this deletion (verified below).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `services/wallets.ts` as one 591-line file | `services/wallets/{types,webln,nwc,nutwallet,index}.ts` directory module | This phase (D-10) | Matches the `event-cache`/`database`/`sqlite` precedent already established elsewhere in the repo — this phase is catching wallets.ts up to a pattern that already exists, not inventing a new one |
| No test framework in the repo | `vitest` scoped to pure functions this phase extracts | This phase (D-15) | First test infrastructure in the project's history; deliberately narrow — P3 D-04 rejected a general test framework as "its own phase," and this doesn't reopen that |

**Deprecated/outdated:** None — this phase doesn't touch any deprecated API surface; it's a pure
internal-structure refactor.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `vitest@5.0.1` (rather than `4.1.11` or a future patch) is the recommended pin | Standard Stack | Low — both majors are peer-compatible with vite 8; the choice is a style/currency preference, not a compatibility requirement. If the checkpoint reviewer prefers 4.1.11, substitute freely; nothing else in this research depends on which major is chosen. |
| A2 | Colocated `*.test.ts` files (no `__tests__/` directory) is the right convention for this repo's first tests | Standard Stack (vitest config) | Low — this is Claude's Discretion per D-15 ("which specific pure functions get coverage"); no prior-art convention exists to contradict, and either layout works with vitest's default include glob unchanged. |
| A3 | The `service-worker-status-card.tsx:97` finding's true target is `checkForUpdate`, verified by rescan, with `applyUpdate` as fallback | Common Pitfalls / Anti-Patterns | Medium — if the guess is wrong and the rescan still shows the finding after converting `checkForUpdate`, the plan needs a follow-up task converting `applyUpdate` too; D-07's "verify by rescan" requirement is explicitly designed to catch this, so the risk is bounded to one extra small task, not a silent miss. |

## Open Questions

1. **Should `pnpm test` be wired into `.github/workflows/lint.yml` (or a new CI job) once the
   vitest suite exists?**
   - What we know: `lint.yml` currently has no test step at all; D-15 doesn't mention CI wiring,
     only the local `test` script and `.planning/config.json`'s `test_command`.
   - What's unclear: Whether leaving the new vitest suite un-gated in CI (runnable only locally
     and via `.planning/config.json`'s `test_command` during this phase's own verification) is
     acceptable long-term, or whether a follow-up phase/backlog item should wire it into CI.
   - Recommendation: Treat as out of D-15's explicit scope for this phase (D-15 says "not a
     general testing initiative"); leave CI wiring as a natural, small follow-up item rather than
     silently deciding one way in the plan.

2. **Where exactly does `windowIdentities` live — folded into `permissions.ts` or its own
   `window-identities.ts`?**
   - What we know: It's small (a single `Map<string, NappletIdentity>` plus register/delete), and
     conceptually adjacent to the permission-checking logic that reads it.
   - What's unclear: D-08 leaves exact module boundaries to discretion; both placements are
     equally valid mechanically.
   - Recommendation: Fold into `permissions.ts` unless the plan wants a stricter one-concern-per-
     file rule than the rest of `services/napplet-shell/` uses — either is consistent with D-08.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | vitest install/run, `pnpm build` | ✓ | v26.4.0 (local); CI pins 24 | — |
| pnpm | all package management | ✓ | 11.2.2 | — |
| `pnpm exec aislop scan --json .` | D-03/D-19 rescans | ✓ | aislop 0.16.1 (pinned) | — |
| `pnpm build` (`tsc` + `vite build`) | D-19's per-task gate | ✓ | vite 8.1.5, typescript ^5.9.3 | — |
| vitest | D-15's test harness | ✗ (not yet installed — this phase adds it) | target: 5.0.1 | none needed; installation is itself part of this phase's scope |

**Missing dependencies with no fallback:** none — vitest's absence is the expected pre-state this
phase resolves, not a blocker.
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 5.0.1 (new to this phase — see Standard Stack) |
| Config file | `vitest.config.ts` (new, repo root, standalone from `vite.config.ts`) |
| Quick run command | `pnpm exec vitest run <path/to/file>.test.ts` (single file, fast) |
| Full suite command | `pnpm test` (once the `package.json` script exists, Wave 3 onward) — until then, `pnpm exec aislop scan --json .` (rescan) and `pnpm build` are the only automated gates |

### Phase Requirements → Validation Map

This phase has no `REQUIREMENTS.md`/`REQ-IDs` (confirmed absent for this project); the
locked decisions D-01 through D-19 function as the requirement set, each with its own explicit
verification method already specified in CONTEXT.md. Restated as a validation map:

| Decision | Behavior | Validation Type | Command |
|----------|----------|------------------|---------|
| D-01/D-19 | Every bucket-H finding fixed or ignored-with-reason | scoped rescan, before/after table | `pnpm exec aislop scan --json .` filtered to the four bucket-H rules (see Metadata for the exact `jq`/filter shape used this session) |
| D-06 | `torrents.ts`'s 5 findings cleared by one file-level ignore | scoped rescan | same as above; confirm 5→0 for `code-quality/duplicate-block` in `helpers/nostr/torrents.ts` |
| D-07 | 3 handlers converted to `useAsyncAction`; duplicate-block clears (not just relocates) | scoped rescan, function-level | rescan `cached-files-card.tsx` + `service-worker-status-card.tsx` before/after; see Pitfall 1 for the ambiguous anchor |
| D-08/D-09/D-10 | Splits preserve the 3-site (napplet-shell) / 13-site (wallets) consumer surface unchanged | `pnpm build` (typecheck catches any broken import) | `pnpm build` after every relocation task, per D-19 |
| D-12 | `useWebxdc`/`renderBody`/`handleRequest` extracted; the function-too-long finding clears | scoped rescan | rescan the three files, confirm `complexity/function-too-long` findings for those 3 lines are gone |
| D-13 | Dead symbols deleted, zero consumers broken | `pnpm build` + repo-wide grep (already run this session, see Pitfall-free confirmation in Code Context) | `pnpm build`; `grep -rn "getRelayURL\|getRTT\b\|getRTTTag\|MONITOR_METADATA_KIND" src` returns nothing |
| D-14 | `verify-event.ts` unchanged behaviorally, ignore added | `pnpm build` + manual diff review (no functional edit expected) | `git diff` on the file should show only the added ignore comment |
| D-15 | New pure functions have vitest coverage | `pnpm exec vitest run` | New `*.test.ts` files pass; no existing behavior changes since these are newly-extracted pure functions with no prior callers to regress |
| D-04 | ROADMAP.md Phase 5 entry corrected | `gsd-tools roadmap` handler output diff | Review the handler's diff against the three specific staleness points named in D-04 |

### Sampling Rate

- **Per task commit:** `pnpm build` (the type-check gate; D-19 requires this after every task,
  not just at wave boundaries). Once vitest exists (Wave 3+), also
  `pnpm exec vitest run <changed-file>.test.ts` for any task that adds/touches a test.
- **Per wave merge:** scoped `pnpm exec aislop scan --json .` rescan, filtered to the four
  bucket-H rules, compared against the running before/after table.
- **Phase gate:** Full `pnpm build` green, full `pnpm test` green (Wave 3+), and the complete
  33→N before/after table with every remaining ignore's reason listed, before `/gsd-verify-work`.

**Explicitly excluded from this phase's validation plan:** any check that depends on a
long-running `pnpm dev` session. STATE.md records that Phase 3's dev-server verification was
killed by OOM with swap exhausted and could not be completed (`03-04-SUMMARY.md`). This phase's
riskiest changes (D-08's napplet shell split, D-10's wallets split) are validated by `pnpm build`
(catches broken imports/types across all ~16 consumer sites) plus the new unit tests on the
extracted pure logic — not by manually exercising the napplet shell or wallet UI in a dev server.
If a maintainer wants to spot-check the napplet consent modal or a wallet flow visually after the
split, that is a separate, optional, human-initiated check outside this phase's automated
validation plan — do not make it a blocking task.

### Wave 0 Gaps

- [ ] `vitest.config.ts` — repo root, minimal config (see Standard Stack)
- [ ] `package.json`'s `"test": "vitest run"` script
- [ ] `vitest` devDependency, exact-pinned `5.0.1`, behind a `checkpoint:human-verify` task (SUS
      package-legitimacy verdict, `too-new`)
- [ ] First `*.test.ts` file(s) — land together with the above in one Wave 3 commit, not earlier
      (see Pitfall 4)

*(All four gaps belong to Wave 3 per D-17's ordering — the functions to test don't exist as
independently-testable units until D-08/D-10's extraction happens. This is consistent with
D-17's explicit rejection of "harness-first" ordering.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | No | This phase doesn't touch account/signer authentication flow |
| V3 Session Management | No | No session/cookie logic touched |
| V4 Access Control | **Yes** | Napplet capability grant/revoke logic (`approvedCapabilities`, `ALWAYS_ALLOW_STORAGE_KEY`) is being relocated and — per D-15 — is exactly the code CONCERNS.md flags as "keep permission storage and grant decisions in pure functions with unit tests." The relocation itself must be behavior-preserving (D-16); the `revokeCapabilities` extraction (Pitfall 2) is the one place a genuine behavior clarification happens, and it must not silently change the capability model (e.g. it must still fully clear the granted set on deny, matching the current `approvedCapabilities.delete(identityKey(...))` behavior exactly) |
| V5 Input Validation | No | No new input-parsing code introduced; `createResourceService`'s existing URL/origin/scheme checks (already validating `resource.bytes` requests) are relocated unchanged |
| V6 Cryptography | **Yes, but out-of-scope for functional change** | `verify-event.ts`'s runtime-swappable `verifyEventMethod` (wasm/internal/fake) is explicitly kept unmodified (D-14, ignore-with-reason only) — the phase must not alter this late-binding mechanism while relocating `napplet-shell-provider.tsx`'s `crypto.verifyEvent` call site into `adapter.ts` |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Capability grant bypass via inconsistent Map access (Pitfall 2: direct `.delete()` vs. the `grantCapabilities` helper) | Elevation of Privilege | Route every mutation of `approvedCapabilities` through named `grantCapabilities`/`revokeCapabilities` functions in the new `permissions.ts` — no external module should hold a reference to the raw `Map` |
| Resource-fetch origin gating regressed during relocation | Tampering / Information Disclosure | `createResourceService`'s `isAllowed` check (`hasApprovedCapability(...) || options.getBlossomOrigins().includes(origin)`) must move as an atomic, byte-identical unit (D-16 pure-move) — do not "simplify" the boolean logic while relocating it |
| `verifyEvent`'s late-binding strategy swap broken by import-path changes during the D-08 split | Tampering (accepting unverified events) | `pnpm build`'s typecheck plus D-14's explicit ignore-with-reason (not a functional edit) are the guardrails; the two consumer call sites (`event-store.ts:3`, and the relocated `adapter.ts`'s former `napplet-shell-provider.tsx:81`/`852`/`907`/`839`) must all still import the same default export after the split |

## Sources

### Primary (HIGH confidence)

- `pnpm view vitest peerDependencies/engines/time/dependencies --json` — live npm registry query,
  run this session, confirms vitest 5.0.1's vite-8/Node-24 compatibility and dependency tree
  `[VERIFIED: npm registry]`
- `pnpm exec aislop scan --json .` — live rescan, run this session, produced the authoritative
  33-finding bucket-H inventory matching CONTEXT.md exactly, plus the `detail`/`scoreImpact`
  fields used for the duplicate-block anchor analysis `[VERIFIED: aislop scan]`
- Direct `Read` of `src/providers/global/napplet-shell-provider.tsx` (full file, 1162 lines),
  `src/services/wallets.ts` (full file, 591 lines), `src/helpers/nostr/relay-stats.ts`,
  `src/services/verify-event.ts`, `src/hooks/use-async-action.ts`, `src/hooks/use-webxdc.ts`,
  and every D-05 target file — this session `[VERIFIED: direct file read]`
- `grep -rn` for every claimed dead/consumer symbol (`getRelayURL`, `getRTT`, `getRTTTag`,
  `MONITOR_METADATA_KIND`, `MONITOR_STATS_KIND`, `getNetwork`, and every `services/wallets`
  import site) — this session, whole-repo `[VERIFIED: repo grep]`
- `pnpm-workspace.yaml`, `package.json`, `tsconfig.json`, `vite.config.ts`, `.aislop/config.yml`,
  `AGENTS.md` — direct read this session `[VERIFIED: direct file read]`

### Secondary (MEDIUM confidence)

- `pnpm.io/blog/releases/11.0` and `pnpm.io/settings/dependency-resolution` (fetched this
  session) — confirms pnpm 11's `minimumReleaseAge` default of 1440 minutes and the
  `minimumReleaseAgeExclude` entry format `[CITED: pnpm.io]`

### Tertiary (LOW confidence)

- None — every claim in this document traces to a tool-verified source or a direct file read
  performed this session.

## Metadata

**Confidence breakdown:**
- Standard stack (vitest version/config): HIGH — verified against live npm registry data and
  cross-checked against pnpm's own documented defaults, not training-data assumption
- Architecture (D-08/D-10 region boundaries, shared-state tracing): HIGH — every claim traced to
  an exact line number in a full read of both target files this session
- Pitfalls: MEDIUM-HIGH — the `service-worker-status-card.tsx` anchor-line ambiguity (Pitfall 1)
  is a genuine open question the D-07 rescan-verification step (already locked in CONTEXT.md) is
  designed to resolve; everything else in Pitfalls is directly observed in this session's file
  reads

**Research date:** 2026-09-24
**Valid until:** ~7 days for the vitest package-legitimacy verdict and exact version pin (npm
registry state changes fast right after a major GA); ~30 days for the architecture/region-mapping
findings (stable unless the target files change before planning executes — re-run the rescan and
the region-boundary trace if significant time passes before this phase is planned).
