# Phase 6: Close type-safety escape hatches - Research

**Researched:** 2026-10-05
**Domain:** TypeScript 5.9 type-safety remediation (idb typed schema, library-boundary typing, aislop bucket E)
**Confidence:** HIGH (every remedy below was applied end-to-end in a scratch worktree at `next` @ `57a6e1a14`: `tsc --noEmit` clean, `vite build` exit 0, `vitest run` 24/24, aislop bucket E 68 -> 0 reported with 2 rule-scoped ignores)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Done means **every bucket-E finding in `src/` is either fixed or carries a rule-scoped `aislop-ignore-*` with a reason** - the P4 D-01 / P5 D-01 bar. This is a *chosen* bar: nothing in the bucket gates CI (`ts-directive` is info severity, the two assertion rules are warnings). Explicitly rejected: fixing only the two ROADMAP-named clusters, and a zero-ignore absolute.
- **D-02:** **The measured starting point is 68 findings** at `next` @ `d2bff764a` (repo score 85/100): 35 `ts-directive`, 20 `double-type-assertion`, 13 `unsafe-type-assertion`. The total matches the 2026-09-11 baseline but **the per-file distribution drifted** with Phase 5's splits. Following P4 D-02 / P5 D-03, the planner re-measures rather than trusting either list. (Per-file table: `services/database/index.ts` 18 (16 double, 2 directive); 19 DEV-only `window.X = X` debug globals across 15 service files (`loaders.ts` x5, `database`, `dns-identity-loader`, `event-cache/index`, `event-cache/wasm-worker`, `event-store`, `outbox-cache`, `pool`, `preferences`, `read-status`, `relay-info`, `relay-scoreboard`, `social-graph`, `wallets/index`, `xml-feeds`) - `database/index.ts:246` is counted in both rows; `views/notifications/{mentions,quotes,replies,reposts,threads,zaps}/index.tsx` 6 `as any`; `components/magic-textarea.tsx` 3 directives; `hooks/use-webxdc.ts` 3 `as any`; `services/napplet-shell/adapter.ts` 1 double + 2 `as any`; `services/wallets/webln.ts` 2 double; `views/tools/event-console/process.ts` 2 directives; singles: `webxdc.tsx:112`, `lookup/vertex.ts:36`, `napplet-shell/common-actions.ts:172`, `media-upload/nostr-build.ts:44`, `use-route-state-value.ts:29`, `polyfill.ts:3`, `group-message-form.tsx:28`, `picture-post-form.tsx:43`, `media-post-comment-form.tsx:54`, `stream-chat-form.tsx:56`, `event-publisher/index.tsx:263`, `event-publisher/process.ts:83`, `vite-env.d.ts:6`.)
- **D-03:** **The ROADMAP Phase 6 entry is corrected before planning completes**, through the `gsd-tools` roadmap handler - never a direct Write/Edit (P5 D-04). It is stale in three ways: it names `providers/global/napplet-shell-provider.tsx` (4) and `services/wallets.ts` (3), which Phase 5 split into `services/napplet-shell/*` and `services/wallets/*`; it omits the largest cluster (the 19 DEV-only debug globals); and it frames the notifications fix as a new "shared typed helper" when the cause is one wrong type in the existing `useVirtualListScrollRestore` hook (D-10).
- **D-04:** **Scope edges.** `services/debug-api.ts:52` (`delete window.noStrudel` behind `@ts-expect-error debug`) is **included** - same pattern as the debug globals; aislop simply did not flag it. Vendored `src/lib/*` is **excluded** (P2 D-10 excludes it from scoring; it also carries directives the probe surfaced in `open-graph-scraper`). `: any` **annotations** (e.g. schema `value: any`, `SerializedAccount<any, any>`) are **out of scope** unless they sit on a line already being rewritten. Explicitly rejected: flagged-only, and a sweep of every `any` in touched files.
- **D-05:** **The schema is made genuinely type-checked.** Verified during discussion with a type probe: `SchemaV1`...`SchemaV13` (`services/database/schema.ts`) are plain interfaces that do not extend idb's `DBSchema`, so in idb 8.0.3 `SchemaV13 extends DBSchema` is **false**, and `StoreNames<>` / `StoreValue<>` fall through to `string` / `any`. `StoreNames<SchemaV13>` accepts `"totally-not-a-store"`. **The current schema typing is a no-op.** The schemas extend `DBSchema`, and the real type errors this exposes are fixed in the consumers: `services/accounts.ts`, `dns-identity-loader.ts`, `relay-info.ts`, `relay-scoreboard.ts`, `read-status.ts`, `services/database/kv.ts`. This is what "one properly-typed wrapper" in the goal means. Explicitly rejected: removing only the casts and leaving the wrapper untyped.
- **D-06:** **The 16 `as unknown as` casts in the `upgrade()` migration chain collapse into one typed helper** that views the upgrade callback's database / transaction at a historical schema version. The helper holds the file's single remaining cast behind a rule-scoped ignore whose reason is that an upgrade transaction runs against a database at a past schema version, which the type system cannot track. **Migration bodies stay runtime-identical.** Explicitly rejected: running migrations against the untyped `IDBPDatabase` (no casts, but loses per-version store checking), and 16 per-site ignores.
- **D-07:** **`clearCacheData()` is a real latent bug, fixed in its own commit** (P5 D-18). It calls `db.clear("dnsIdentifiers")`, a store the v12 migration deleted (`v11.deleteObjectStore("dnsIdentifiers")`). idb's shortcut opens a transaction on the missing store inside an async function, so the call **rejects with `NotFoundError`**: `relayScoreboardStats` is never cleared, `window.location.reload()` never runs, and `views/settings/cache/database/internal.tsx`'s `handleClearData` (no try/catch) leaves its button spinning. D-05's real typing would flag the line at compile time. **Fix: clear `identities` - the v12 successor cache - in its place.** Explicitly rejected: dropping the line only, and also converting `internal.tsx`'s hand-rolled loading handlers to `useAsyncAction` (see Deferred).
- **D-08:** The v5 migration's `// @ts-ignore delete newAccount.useExtension` (`database/index.ts:117`) is replaced by **destructuring** (`const { useExtension, ...rest } = account`) so the new object never carries the key. Same stored result, no directive.
- **D-09:** The **19 DEV-only debug globals** become `Reflect.set(window, "X", X)` inside the existing `if (import.meta.env.DEV)` blocks - the form `services/debug-api.ts:51` already uses. Zero behavior change, no directive. `debug-api.ts:52`'s `delete window.noStrudel` becomes the matching `Reflect.deleteProperty`. Explicitly rejected: folding them into the `noStrudel` debug API (11 of 19 are already there, but it changes the dev workflow and would eagerly import lazily loaded modules such as the wasm worker), and a typed `Window` augmentation listing all 19.
- **D-10:** The **6 notification `ref={scroll.ref as any}`** are removed at their cause: `hooks/use-scroll-restore.ts`'s `useVirtualListScrollRestore` types its list-ref callback as `(list: FixedSizeList | null)`, while the notification views render `VariableSizeList`. Typing the callback against the shared `scrollTo` surface makes it assignable to both, and all six casts are deleted. Other consumers (`views/lists/following`, `views/files`, `views/lists/muted`, `views/articles`) must still type-check unchanged. Explicitly rejected: making the hook generic.
- **D-11:** **Library-boundary casts are fixed with real types where the mismatch is ours**: `napplet-shell/adapter.ts:73` `pool as unknown as RelayPoolLike` and `:151` / `:225` `filters as any` - an explicit typed adapter / conversion (kehto's `RelayPoolLike` has an optional `count?(): number | Promise<number>`; the researcher must check whether applesauce's `RelayPool` exposes a `count` with incompatible semantics that the current cast hides); `wallets/webln.ts:58,62` - use the existing global `Window.webln` augmentation in `src/types/webln.d.ts` instead of casting `window` to a local shape; `components/webxdc/webxdc.tsx:112` `event.data as any` - parse as `unknown` and narrow with a JSON-RPC message type guard; `services/lookup/vertex.ts:36` - validate the string preference into the method union; `hooks/use-webxdc.ts` x3 - type the collected state as the events it actually holds; `napplet-shell/common-actions.ts:172` - resolve the `ReactionFactory` draft's real type. A directive is kept **only where the mismatch is inside a third-party package's own typings** - expected: react-textarea-autocomplete's props-generic constraint in `components/magic-textarea.tsx` x3 (and the researcher should check whether the two `onPaste` directives in `media-post-comment-form.tsx` / `stream-chat-form.tsx` share that cause). Explicitly rejected: ignore-with-reason at every boundary, and fixing upstream in kehto/applesauce.
- **D-12:** **Directive policy.** Dead directives are deleted - the probe (all directives stripped, `tsc --noEmit`) showed **no error** at `helpers/media-upload/nostr-build.ts:44` and `polyfill.ts:3`; `vite-env.d.ts:6` sits in a `.d.ts` that `skipLibCheck` never checks and React is installed, so its stated reason does not hold (the researcher may find the whole `virtual:pwa-register/react` block replaceable by the plugin's own types). Every surviving directive is **`@ts-expect-error` (never `@ts-ignore`) carrying its own reason**, so `tsc` fails once it stops being needed, and is preceded by a rule-scoped `// aislop-ignore-next-line ai-slop/ts-directive -- <reason>` (P5 D-01: no documented-but-unmarked findings). If a probe shows a single-line form clears the finding, the planner may use it. Explicitly rejected: TS reason only with the info finding left standing, and keeping existing `@ts-ignore`s.
- **D-13:** Verification is a **scoped rescan with a per-rule before/after table (68 -> N)** plus an explicit list of every site left behind an ignore with its reason (P3 D-04 / P4 D-14 / P5 D-19). **`pnpm build` must pass after every task** - for a type-safety phase `tsc` is the real verifier.
- **D-14:** **vitest (added in P5) covers only new runtime guards or parsers that replace a cast** - e.g. the webxdc JSON-RPC message guard (D-11) and an event-console time-unit parser - where a wrong guard would silently drop input. No tests for type-only edits. Explicitly rejected: no tests (P3/P4 precedent), and testing every touched function.
- **D-15:** **Type-only wherever possible.** Where removing a cast needs a runtime check, the check must accept everything the old code accepted - no new rejection paths. The only deliberate behavior change is D-07, in its own commit. Explicitly rejected: allowing stricter validation where it looks obviously correct.
- **D-16:** **Waves run low-risk first** (P5 D-17): wave 1 the mechanical items (D-09 debug globals, D-12 dead directives, D-10 scroll hook); wave 2 the per-site remedies (D-08, D-11, the remaining directives); wave 3 the database schema typing (D-05/D-06), riskiest because it exposes consumer type errors and runs on the startup path (top-level-await `openDB`). D-07's bug fix lands in its own commit. Mechanical churn stays in its own commits (P4 D-04 / P5 D-16).

### Claude's Discretion

- The exact shape and name of the D-06 historical-schema helper.
- The exact typing used in D-10 and each D-11 conversion.
- The exact wording of every `-- reason` string, subject to the P4 D-08 justification bar.
- Plan-to-wave assignment within D-16's ordering.

### Deferred Ideas (OUT OF SCOPE)

- Converting `views/settings/cache/database/internal.tsx`'s hand-rolled `clearing` / `deleting` state to `useAsyncAction` (AGENTS.md convention) so a failed clear surfaces as a toast - outside bucket E; candidate for a backlog item.
- Tightening the schema's `value: any` annotations (`relayInfo`, `misc`, `kv`, `settings`) - `: any` annotations are out of scope (D-04).
</user_constraints>

<phase_requirements>
## Phase Requirements

No REQUIREMENTS.md IDs exist (Requirements: TBD). D-01..D-16 are the requirement set.

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01/D-02/D-13 | Bucket E 68 -> 0 reported, ignores inventoried | Final-state scan in scratch worktree: 0 bucket-E findings, exactly 2 rule-scoped ignores (see Validation Architecture) |
| D-05/D-06/D-07/D-08 | Typed idb schema, one historical-schema helper, `clearCacheData` fix, destructure | Findings 1-3; `interface extends DBSchema` is NOT viable (see Pitfall 1) - use `type` aliases |
| D-09 | `Reflect.set` debug globals | Finding 4: no aislop finding, no tsc error, all 20 sites |
| D-10 | Notification ref casts | Finding 5: `{ scrollTo(n: number): void }` callback type |
| D-11 | Library-boundary casts | Finding 6 (per-site table) |
| D-12 | Directive policy | Findings 7-8 (placement + what survives) |
| D-14 | vitest for new guards | Finding 9 |
| D-15 | No new rejection paths | Two D-15 conflicts found: vertex sort methods and dayjs unit letters (Open Questions 1-2) |
| D-16 | Wave ordering | Recommended plan breakdown |
</phase_requirements>

## Summary

The phase is entirely achievable with the locked decisions. I applied every remedy in a scratch worktree and ran `tsc`, `vite build`, `vitest` and the aislop scan: bucket E went from 68 findings to **0 reported**, with exactly **two** rule-scoped ignores remaining (the D-06 helper cast and the `MagicInput` library-generic directive), repo score 85 -> 86, no new diagnostics of any rule.

Four findings change how the planner should think about the decisions:

1. **D-05 as worded ("schemas extend `DBSchema`") does not work for the existing structure.** `interface SchemaV2 extends Omit<SchemaV1, "settings">` loses every known key once `SchemaV1` has an index signature (`keyof` becomes `string | number`), and any `interface` is not assignable to `DBSchema` anyway. The working form is `type SchemaVn = Omit<Prev, K> & { ...new stores }` (type aliases with intersections), which satisfies `extends DBSchema` for all 13 versions. [VERIFIED: scratch-worktree tsc probe]
2. **D-05's predicted consumer errors do not exist.** With a genuinely typed schema, `accounts.ts`, `dns-identity-loader.ts`, `relay-info.ts`, `relay-scoreboard.ts`, `read-status.ts` and `kv.ts` all type-check unchanged. The only errors are inside `services/database/index.ts` (three constraint errors, one real schema bug - `channelMetadata` has no `indexes` so `createIndex("created", ...)` is `never` - and the `dnsIdentifiers` clear that D-07 predicted). [VERIFIED: tsc]
3. **Two D-11/D-15 collisions the casts were hiding** (need a user ruling, see Open Questions): the Vertex sort-method setting offers two values (`userPagerank`, `followDistance`) that are not in applesauce-extra's `SortMethod` union and that Vertex's server does not support; and the event-console relative-date regex is case-insensitive, so `n-5H`/`W`/`S`/`D` silently mean 5 **milliseconds** in dayjs.
4. **The applesauce `RelayPool.count` conflict is real but dormant.** `RelayPool.count()` returns `Observable<Record<string, RelayCountResponse>>`, kehto's `RelayPoolLike.count?` returns `number | Promise<number>`. The installed kehto packages never call `RelayPoolLike.count`, so a typed adapter that simply omits `count` is runtime-identical today and removes a latent trap. [VERIFIED: grep of kehto shell 0.21.2 / runtime 0.24.0 / services 0.21.2 dist]

**Primary recommendation:** Execute D-16's three waves using the validated remedies below; convert schemas to `type` aliases with `&`, use one `atSchema<V>(db, transaction)` helper (one `as unknown as`, one ignore), land D-07 in its own commit before the schema commit, and get the two D-15 rulings before planning the vertex and event-console tasks.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Typed IndexedDB schema + migrations | Browser / Client (IndexedDB wrapper, startup top-level await) | - | `services/database` runs in the browser; migrations execute inside `openDB` upgrade |
| Debug globals (`window.X`) | Browser / Client | - | DEV-only; `wasm-worker.ts` module runs on the main thread (the Worker is a separate script) |
| Scroll restoration ref | Browser / Client | - | react-window list refs |
| napplet shell relay/common adapters | Browser / Client | - | kehto shell runs in the page; relays via applesauce RelayPool |
| webxdc iframe message parsing | Browser / Client | - | `postMessage` boundary between page and sandboxed iframe (untrusted input) |
| WebLN wallet backend | Browser / Client | - | `window.webln` extension provider |
| Event console / publisher tools | Browser / Client | - | debug tools; pure functions in `process.ts` |
| Build typing (`vite-env.d.ts`) | CDN / Static (build tooling) | - | ambient declaration only |

## Standard Stack

No new packages. Everything uses what is installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| idb | 8.0.3 | IndexedDB wrapper; `DBSchema`, `StoreNames`, `IDBPDatabase`, `IDBPTransaction` | Already the project wrapper [VERIFIED: node_modules/idb/package.json] |
| typescript | 5.9.3 | `tsc --noEmit -p tsconfig.json` is the verifier | [VERIFIED: pnpm store path `typescript@5.9.3`] |
| vitest | 5.0.1 | Tests for the new pure guards (node env, `src/**/*.test.ts`) | Added in Phase 5 [VERIFIED: vitest.config.ts, package.json] |
| aislop | 0.16.1 | Bucket E scan | Pinned devDependency [CITED: AGENTS.md Linting] |

### Supporting (types consumed at boundaries)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| applesauce-relay | 6.2.1 | `RelayPool` (`subscription`, `request`, `publish`, `count`) | napplet adapter |
| @kehto/shell | 0.21.2 | `RelayPoolLike` | napplet adapter |
| @napplet/core | 0.32.0 | `NostrFilter` | napplet adapter filter conversion |
| applesauce-extra | 6.2.0 | `SortMethod` (exported from the package root) | vertex |
| applesauce-common | 6.2.0 | `ReactionFactory` (extends `Promise<ReactionTemplate>`) | common-actions |
| @types/react-window | ^1.8.8 (react-window 1.8.11) | `FixedSizeList` / `VariableSizeList` | scroll hook |
| @types/webscopeio__react-textarea-autocomplete | ^4.7.5 | Props generic constraint | magic-textarea |
| dayjs | 1.11.21 | `ManipulateType` | event-console |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `type` aliases + `&` for schemas | `interface ... extends DBSchema` per version, hand-listing every store | Duplicates ~13 schemas; `Omit<>` of a `DBSchema` interface drops known keys, so inheritance chain cannot be kept |
| Single `atSchema` helper returning `{db, transaction}` | Two helpers (db / transaction) | Two casts and two ignores; D-06 wants one |
| `fake-indexeddb` to test migrations | - | Not installed; adding a dependency is outside D-14. Verify migrations by diff review + manual UAT |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed or added by this phase. Package legitimacy gate: not applicable.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
app startup (top-level await)
   services/database/index.ts
      openDB<SchemaV13>(name, 13, { upgrade })
         upgrade(db, oldVersion, _new, transaction)
            at<SchemaVn>()  = atSchema<SchemaVn>(db, transaction)   <-- the ONE cast (ignored, reasoned)
               -> { db: IDBPDatabase<SchemaVn>, transaction: IDBPTransaction<SchemaVn, StoreNames<SchemaVn>[], "versionchange"> }
            migration bodies (v0 -> v13) run against the historical view (per-version store checking)
      db: IDBPDatabase<SchemaV13>  (SchemaV13 extends DBSchema => StoreNames/StoreValue are real)
         ├── accounts.ts, relay-info.ts, relay-scoreboard.ts, read-status.ts, dns-identity-loader.ts, kv.ts  (unchanged, now checked)
         └── clearCacheData() -> clears userSearch, relayInfo, identities (D-07), relayScoreboardStats -> reload

DEV only:  `if (import.meta.env.DEV) { Reflect.set(window, "X", X) }`  (19 sites + debug-api Reflect.deleteProperty)

napplet shell:  kehto ShellAdapter
      relayPool.getRelayPool() -> poolLike {subscription, request, publish}  (explicit adapter over applesauce RelayPool; `count` omitted)
      napplet NostrFilter[] --toRelayFilters--> nostr-tools Filter[] --> pool.subscription(...)

webxdc iframe --postMessage--> onMessage(event) -> isWebxdcMessage(event.data: unknown) -> {ready | request(id, method, params)}
```

### Recommended Project Structure
```
src/
├── services/database/{index.ts,schema.ts,kv.ts}   # type-alias schemas, atSchema helper
├── components/webxdc/jsonrpc.ts (+ jsonrpc.test.ts)  # new pure guard (testable in node env)
├── views/tools/event-console/process.ts (+ process.test.ts)  # parseTimeUnit
└── services/lookup/                                # optionally vertex-sort.ts (pure guard) for testability
```
Tests are colocated `*.test.ts` (existing: `services/napplet-shell/permissions.test.ts`, `services/wallets/nwc.test.ts`); vitest `include: ["src/**/*.test.ts"]`, `environment: "node"`, standalone config (no React/PWA plugins). A guard living inside a module with top-level `await` or DOM imports (`vertex.ts` imports `accounts` and `preferences`; `database/index.ts`) cannot be imported by a test, so guards that D-14 wants tested must live in dependency-free modules.

### Pattern 1: Typed historical schemas (D-05 / D-06)  [VERIFIED: applied in scratch worktree]
**What:** every `SchemaVn` becomes a `type` alias built with `Omit<Prev, K> & { new stores }`. `V8`/`V10` are plain `Omit` aliases. One helper views the upgrade `db`/`transaction` at a past version.
**Why not interfaces:** see Pitfall 1.
```typescript
// schema.ts
export type SchemaV1 = { /* unchanged store map */ };
export type SchemaV2 = Omit<SchemaV1, "settings"> & {
  settings: { key: string; value: NostrEvent; indexes: { created_at: number } };
  misc: { key: string; value: any };
};
// ... V3-V7 likewise
export type SchemaV8 = Omit<SchemaV7, "replaceableEvents">;
export type SchemaV10 = Omit<SchemaV9, "channelMetadata">;
// V6 channelMetadata MUST gain `indexes: { created: number }` - the v6 migration calls
// createIndex("created", "created") and with no `indexes` entry the index name type is `never`.
```
```typescript
// database/index.ts (validated; zero aislop findings in this file, tsc clean)
import { openDB, deleteDB, DBSchema, IDBPDatabase, IDBPTransaction, StoreNames } from "idb";

type UpgradeTransaction<Schema extends DBSchema> = IDBPTransaction<Schema, StoreNames<Schema>[], "versionchange">;

/** View the upgrade callback's database and transaction at the schema version a migration step targets */
function atSchema<Schema extends DBSchema>(db: IDBPDatabase<SchemaV13>, transaction: UpgradeTransaction<SchemaV13>) {
  // aislop-ignore-next-line ai-slop/double-type-assertion -- an upgrade transaction runs against a database at a past schema version, which the type system cannot track
  return { db, transaction } as unknown as { db: IDBPDatabase<Schema>; transaction: UpgradeTransaction<Schema> };
}

const db = await openDB<SchemaV13>(dbName, version, {
  upgrade(db, oldVersion, newVersion, transaction, _event) {
    const at = <Schema extends DBSchema>() => atSchema<Schema>(db, transaction);
    if (oldVersion < 1) {
      const v0 = at<SchemaV1>().db;
      // ...
    }
    if (oldVersion < 2) {
      const trans = at<SchemaV1>().transaction; // was: transaction as unknown as IDBPTransaction<SchemaV1, string[], "versionchange">
      const v2 = at<SchemaV2>().db;
      // ...
    }
```
Note `StoreNames<Schema>[]` (not `string[]`): the old `string[]` store-names argument now fails the `ArrayLike<StoreNames>` constraint (3 tsc errors if left). The helper returns the same `db` / `transaction` references, so migration bodies are runtime-identical; the only runtime difference is one small object allocation per `at()` call.

Optional guard so the "schema silently falls back to untyped" regression cannot recur: wrap the latest version in an identity constraint, e.g. `type Checked<S extends DBSchema> = S; export type SchemaV13 = Checked<SchemaV12 & {...}>;` (the `atSchema<Schema extends DBSchema>` constraint already enforces every historical version actually used).

### Pattern 2: DEV debug globals (D-09)  [VERIFIED]
```typescript
if (import.meta.env.DEV) {
  Reflect.set(window, "dnsIdentityLoader", dnsIdentityLoader);
}
```
Multi-line cases: `wallets/index.ts` becomes `Reflect.set(window, "wallets", { ... });`; `event-cache/index.ts` keeps its subscribe callback; `loaders.ts` maps `window.addressLoader = replaceableLoader` to `Reflect.set(window, "addressLoader", replaceableLoader)`. `debug-api.ts:52` becomes `else Reflect.deleteProperty(window, "noStrudel");`. `Reflect.set` on `window` is semantically identical to assignment for these plain data keys; none collide with built-in window properties.

### Pattern 3: Scroll hook (D-10)  [VERIFIED]
```typescript
/** The scroll surface shared by react-window's FixedSizeList and VariableSizeList */
type ScrollableList = { scrollTo(scrollOffset: number): void };
const listRef = useCallback((list: ScrollableList | null) => { /* unchanged body */ }, [key]);
```
Drop the `FixedSizeList` import; remove `as any` in the 6 notification views. `FixedSizeList` and `VariableSizeList` both declare `scrollTo(scrollOffset: number): void` in @types/react-window; all other consumers (`lists/following`, `files`, `lists/muted`, `articles`) type-check unchanged.

### Pattern 4: Per-site library-boundary remedies (D-11)  [VERIFIED: tsc clean for all]

| Site | Real types | Remedy |
|------|-----------|--------|
| `adapter.ts:73` `pool as unknown as RelayPoolLike` | `RelayPool.publish` returns `Promise<PublishResponse[]>` vs `RelayPoolLike.publish: void \| Promise<void>`; `count` incompatible (Observable vs number) | Explicit adapter object (below). Omitting `count` is valid (it is optional) |
| `adapter.ts:151,225` `filters as any` | `NostrFilter[]` (@napplet/core, an interface) vs applesauce `FilterInput`; interface lacks the `&${string}` index signature | `toRelayFilters(filters: NostrFilter[]): Filter[]` = `filters.map((f) => ({ ...f }))` (spread yields an anonymous type that is assignable) |
| `common-actions.ts:172` | `await ReactionFactory.create(event, emoji)` resolves to `ReactionTemplate` (`KnownEventTemplate<kinds.Reaction>`), already an `EventTemplate`; `Emoji` is `{shortcode,url}` | Delete both casts: `ReactionFactory.create(event, emoji)` (also removes the `emoji as string` lie) and `publishCommonEvent("Reaction", draft)` |
| `webln.ts:58,62` | `Window.webln` from `src/types/webln.d.ts` is `WebLNProvider & {...}` from the `webln` package, which has no `getBalance` | `window.webln` directly; add `getBalance?: () => Promise<{ balance: number }>` to the augmentation in `src/types/webln.d.ts`; delete the local `WebLNProvider` interface |
| `webxdc.tsx:112` | `event.data` is `any` | `const msg: unknown = event.data; if (!isWebxdcMessage(msg)) return;` (guard below); widen `handleRequest(id: unknown, method: unknown, ...)` and the two `handle*Request(..., method: unknown, ...)` so non-string ids/methods still reach the existing "Method not found" response (D-15) |
| `use-webxdc.ts:35,37,172` | `pool.request(...).pipe(onlyEvents())` already emits `NostrEvent` | `useState<NostrEvent[]>([])`; `e.id === event.id`; `[...prev, event]`; `event.pubkey` (import `NostrEvent` from nostr-tools) |
| `vertex.ts:36` | `userSearch(query, sortMethod?: SortMethod, limit?)`, `SortMethod = "globalPagerank" \| "personalizedPagerank" \| "followerCount"` | Guard + fallback - **needs a ruling, see Open Question 1** |

```typescript
// adapter.ts
const poolLike: RelayPoolLike = {
  subscription: (relayUrls, filters) => pool.subscription(relayUrls, filters),
  request: (relayUrls, filters) => pool.request(relayUrls, filters),
  publish: async (relayUrls, event) => {
    await pool.publish(relayUrls, event);
  },
};
function toRelayFilters(filters: NostrFilter[]): Filter[] {
  return filters.map((f) => ({ ...f })); // NOT `filter` - it shadows the rxjs `filter` imported in adapter.ts
}
```
`publish: async` keeps rejection semantics identical to `pool.publish`. Installed kehto only calls `subscription`, `publish` (and `request` is typed) on the pool; it never calls `RelayPoolLike.count` (grep over `@kehto/{shell,runtime,services}` dist: the only `.count(` is a CountService option, unrelated). A future kehto that probes `pool.count` would, with the old cast, receive an Observable where it expects a number - the adapter removes that trap.

```typescript
// components/webxdc/jsonrpc.ts  (pure, node-testable)
export type WebxdcMessage = { jsonrpc: "2.0"; method?: unknown; id?: unknown; params?: unknown };
export function isWebxdcMessage(data: unknown): data is WebxdcMessage {
  return typeof data === "object" && data !== null && "jsonrpc" in data && data.jsonrpc === "2.0";
}
```
Equivalence with the old `!msg || msg.jsonrpc !== "2.0"`: accepts every structured-cloneable value the old code accepted (objects with `jsonrpc === "2.0"`), rejects the same primitives/arrays. Keep the downstream `msg.id !== undefined && msg.method` truthiness checks as they are.

### Pattern 5: Remaining directives  [VERIFIED: tsc clean]

| Site | Cause | Remedy |
|------|-------|--------|
| `use-route-state-value.ts:29` | `typeof x === "function"` on `T \| ((v:T)=>T)` narrows to `((v:T)=>T) \| (T & Function)` | Type predicate `function isSetter<T>(v: T \| ((v: T) => T)): v is (v: T) => T { return typeof v === "function"; }` (runtime identical) |
| `group-message-form.tsx:28`, `picture-post-form.tsx:43` | `useCacheForm` infers `TFieldValues` from `reset`'s `DefaultValues<>` (all-optional), so `UseFormGetValues<{content:string}>` mismatches | Explicit generic: `useCacheForm<{ content: string }>(...)`, `useCacheForm<FormValues>(...)`. Do not touch `use-cache-form.ts` (Phase 8 TODO) |
| `media-post-comment-form.tsx:54`, `stream-chat-form.tsx:56` | **Not** the library: `useTextAreaUploadFile`'s `onPaste` is typed `ClipboardEventHandler<HTMLTextAreaElement>` but passed to `MagicInput` (Chakra `Input`, `HTMLInputElement`). Our own hook | In `hooks/use-textarea-upload-file.ts` type it `useCallback<ClipboardEventHandler<HTMLTextAreaElement \| HTMLInputElement>>` (body only reads `clipboardData`); all 12 consumers still compile |
| `event-console/process.ts:14,21` | `match[3] \|\| "h"` is `string`, dayjs wants `ManipulateType` | `parseTimeUnit` table, **needs a ruling, see Open Question 2** |
| `event-publisher/index.tsx:263` | `delete draft.sig` on required `sig` | `const { value } = useRouteStateValue<NostrEvent>("draft"); let draft: LooseEventTemplate \| undefined = value; if (value?.sig) { const { sig: _sig, ...unsigned } = value; draft = unsigned; }` (no new lint diagnostics with the `_sig` name) |
| `event-publisher/process.ts:83` | `LooseEventTemplate` is `Omit<union,...>` so has no `id`/`pubkey`/`sig` | Keep `const event = { ...draft } as UnsignedEvent` (single `as`, not flagged); end with `return { ...event, id: getEventHash(event) };` and change the return type to `UnsignedEvent & { id: string }` (3 callers, all accept the subtype; key order unchanged) |
| `vite-env.d.ts:6` | `declare module "virtual:pwa-register/react"` is unused (nothing imports it; `worker.ts` uses `virtual:pwa-register`, declared by `vite-plugin-pwa/client`) | Delete the whole block (tsc clean). If the planner wants the module kept available: `/// <reference types="vite-plugin-pwa/react" />` (the plugin ships its own `react.d.ts`) - not probed |
| `nostr-build.ts:44`, `polyfill.ts:3` | dead | delete directive (tsc verified: no error without them) |
| `magic-textarea.tsx` x3 | Library: `CustomTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>`. Chakra `TextareaProps.color` is `ResponsiveValue<...>` (clashes with HTML `color?: string`); `InputProps` event handlers are typed for `HTMLInputElement` | **Only 1 of the 3 directives is genuinely unavoidable.** For the textarea half: `type AutocompleteTextareaProps = Omit<TextareaProps, "color">` used in `RefType` and `<ReactTextareaAutocomplete<Token, AutocompleteTextareaProps>>` satisfies the constraint, and the call then needs `innerRef: ref ? (...) : undefined` instead of `ref && (...)` (the latter yields `null`; the library only checks `this.props.innerRef &&`, so runtime is identical). `MagicInput` (an `Input` rendered by a textarea library) keeps one `@ts-expect-error` + ignore |

### Pattern 6: Directive/ignore placement (D-12)  [VERIFIED by scan probe]
```tsx
return (
  // aislop-ignore-next-line ai-slop/ts-directive -- <why the library typing cannot express it>
  // @ts-expect-error -- <same fact, TS-side: names the error>
  <ReactTextareaAutocomplete<Token, InputProps> ... />
);
```
Probe results (aislop 0.16.1 + tsc 5.9.3):
- Two-line form (ignore directly above the directive): finding cleared; TS still applies the directive to the next code line. A blank line between directive and code is also tolerated by TS.
- Single-line forms also clear the finding AND TS still honours the directive: `// @ts-expect-error -- r // aislop-ignore-line ai-slop/ts-directive -- r` and `/* aislop-ignore-line ai-slop/ts-directive -- r */ // @ts-expect-error -- r`. Recommend the two-line form (matches D-12 text and AGENTS.md's "textually adjacent"); the single-line forms are available if the planner prefers.
- The aislop finding is reported on the directive comment line itself, so the ignore must sit immediately above that line.
- A single `as X` assertion is not flagged by aislop (`ai-slop/double-type-assertion` is `as unknown as` only, `ai-slop/unsafe-type-assertion` is `as any`; `as any as T` reports only the unsafe rule).
- I did not probe the `{/* @ts-expect-error */}` JSX-child form; magic-textarea writes its directives as `//` comments inside the `return (` parentheses before the JSX element, and that shape (probed) works.

### Anti-Patterns to Avoid
- **`interface SchemaVn extends DBSchema`** with `Omit<>` inheritance - silently drops stores (Pitfall 1).
- **Leaving `string[]` as the `IDBPTransaction` store-names argument** - fails once the schema is real.
- **`pnpm exec` inside a scratch worktree with a symlinked `node_modules`** - pnpm tries to purge/reinstall the modules dir ("Aborted removal of modules directory due to no TTY"); run `node node_modules/typescript/bin/tsc`, `sh node_modules/.bin/aislop`, `node node_modules/vitest/vitest.mjs` directly (the `.bin` entries are shell shims, not JS).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-version migration typings | 16 inline casts or 13 hand-copied full schemas | `Omit<Prev,K> & {...}` aliases + one `atSchema` helper | Keeps the existing delta structure; one audited cast |
| Window debug globals | `declare global { interface Window { ... } }` for 19 names, or `(window as any)` | `Reflect.set(window, "x", x)` | In-repo precedent (`debug-api.ts:51`), D-09 |
| JSON-RPC envelope validation | A full JSON-RPC schema validator | The 3-line `isWebxdcMessage` guard | D-15: must accept everything the old truthiness check accepted; a stricter validator would drop messages |
| Relative-date unit parsing | A new date parser | Table lookup feeding existing `dayjs().add/subtract` | Same dayjs semantics |

## Common Pitfalls

### Pitfall 1: `Omit<>` of a `DBSchema` loses all known keys
**What goes wrong:** `interface A2 extends Omit<A1, "a">` where `A1 extends DBSchema` gives `StoreNames<A2>` containing only A2's own stores; also any `interface` fails `extends DBSchema` (no implicit index signature).
**Why:** `DBSchema` has `[s: string]: DBSchemaValue`, so `keyof A1` is `string | number`, `Pick<A1, Exclude<string|number, "a">>` collapses to the index signature.
**How to avoid:** type aliases: `type A2 = Omit<A1Alias, "a"> & {...}` (probe: `Ext<SchemaV1..V13> = true` for all 13, `StoreNames<SchemaV13>` rejects `"dnsIdentifiers"`, accepts `"identities"`/`"kv"`).
**Warning signs:** `StoreNames<SchemaVn>` accepts arbitrary strings; a store you know exists is "not assignable to parameter of type never".

### Pitfall 2: Typing the schema exposes hidden schema bugs
Real exposures (all in `database/index.ts`): (a) `StoreNames` arrays typed `string[]` (3 sites: v2, v5, v6/v7 transactions); (b) `channelMetadata` missing `indexes: { created: number }` (v6); (c) `db.clear("dnsIdentifiers")` (D-07). Nothing else surfaced anywhere in `src/`.

### Pitfall 3: Wave ordering vs a green `tsc` after every task (D-13)
Converting `schema.ts` to type aliases alone breaks `tsc` (errors above). The schema conversion, the `channelMetadata` index fix, `atSchema`, and the removal of all 16 casts must land in **one commit**. D-07 (its own commit) can and should land before it: `db.clear("identities")` type-checks under both the old and new schema. D-08 (destructure) and the `window.db` Reflect.set also type-check before the schema commit.

### Pitfall 4: Name shadowing in the adapter
`adapter.ts` imports `filter` from rxjs; a `.map((filter) => ...)` callback shadows it. Use `f`.

### Pitfall 5: Formatting churn
`prettier --check` reports pre-existing drift on `services/preferences.ts` and `services/wallets/index.ts` at baseline, and prettier will add `};` after each `export type SchemaVn = ... & { ... }` block and re-wrap the long `innerRef` ternary. aislop's format engine reports 0 issues, so prettier is not the gate; run prettier on touched files but review hunks so the two drifting files do not get wholesale reformatting in a mechanical-churn commit.

### Pitfall 6: Behavior preserved by accident
`delete window.noStrudel` -> `Reflect.deleteProperty` returns a boolean instead of throwing in strict mode for non-configurable properties; the property is a plain assigned one so there is no difference. `ref ? ... : undefined` vs `ref && ...` differs only null vs undefined for a falsy ref.

## Code Examples

### useRouteStateValue setter guard  [VERIFIED]
```typescript
/** `typeof x === "function"` cannot tell a setter from a `T` that is itself a function, so narrow by hand */
function isSetter<T>(valueOrSetter: T | ((v: T) => T)): valueOrSetter is (v: T) => T {
  return typeof valueOrSetter === "function";
}
// in setValue: if (isSetter(valueOrSetter)) { newState[key] = valueOrSetter(valueRef.current); } else newState[key] = valueOrSetter;
```

### event-console unit table  [VERIFIED compiles; semantics per Open Question 2]
```typescript
import dayjs, { ManipulateType } from "dayjs";
// dayjs reads a lower-case letter as that unit and `M` as months; any other capital falls through to milliseconds
const UNITS: Record<string, ManipulateType> = { h: "h", w: "w", m: "m", s: "s", d: "d", M: "M" };
/** Resolve the unit letter of a relative date such as `n-2d` to a dayjs unit, defaulting to hours */
export function parseTimeUnit(letter: string | undefined): ManipulateType {
  return letter ? (UNITS[letter] ?? "ms") : "h";
}
// .subtract(parseInt(match[2]), parseTimeUnit(match[3]))  /  .add(parseInt(match[2]), parseTimeUnit(match[3]))
```
Measured with dayjs 1.11.21: `subtract(5, u)` in ms = `h` -18000000, `w` -3024000000, `m` -300000, `M` -13222800000, `s` -5000, `d` -432000000, but `H`/`W`/`S`/`D` all **-5** (ms). The table above reproduces today's behaviour exactly (`H`/`W`/`S`/`D` -> `"ms"`).

### vitest tests (verified to run in the node env, ~1 s)
```typescript
// components/webxdc/jsonrpc.test.ts
expect(isWebxdcMessage({ jsonrpc: "2.0", id: null, method: 5, params: [] })).toBe(true);   // old code accepted
for (const d of [null, undefined, "", "2.0", 0, true, [], {}, { jsonrpc: "1.0" }, { jsonrpc: 2 }]) expect(isWebxdcMessage(d)).toBe(false);
// views/tools/event-console/process.test.ts
expect(parseTimeUnit(undefined)).toBe("h"); expect(parseTimeUnit("M")).toBe("M");
expect(Math.abs(processDateString("n-2d") - (dayjs().unix() - 2 * 86400))).toBeLessThanOrEqual(1);
expect(() => processDateString("tomorrow")).toThrow();
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `window.x = x` + `@ts-expect-error debug` | `Reflect.set(window, "x", x)` | Removes 20 directives, zero behaviour change |
| `as unknown as IDBPDatabase<SchemaVn>` x16 | one `atSchema<V>()` helper | 16 -> 1 cast, per-version store checking kept |
| `interface SchemaVn` (no-op typing) | `type SchemaVn = Omit<> & {}` | Real `StoreNames`/`StoreValue` |

**Deprecated/outdated:** `@ts-ignore` (replace with `@ts-expect-error -- reason`, only where one survives; only one survives).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vertex's server accepts only `followerCount`, `globalPagerank`, `personalizedPagerank`, so the UI's `userPagerank`/`followDistance` fail or misbehave today | Open Question 1 | If Vertex still tolerates the stale names, a fallback-to-global changes results for users who picked them (still low impact) |
| A2 | Nobody relies on `n-5H` / `W` / `S` / `D` meaning milliseconds in the event console | Open Question 2 | Preserving the table is risk-free either way; "fixing" them is a behaviour change |
| A3 | `vite-plugin-pwa/react` reference (alternative to deleting the `virtual:pwa-register/react` block) type-checks | Pattern 5 | Only matters if the planner chooses that alternative; deletion is verified |
| A4 | A manual fresh-profile (v0 -> v13) and existing-profile (v12 -> v13) startup check is an acceptable substitute for automated migration tests | Validation Architecture | No `fake-indexeddb`; adding it is outside D-14 |

(All other claims in this document were verified by running tsc / aislop / vitest / vite build or by reading installed package sources in this session.)

## Open Questions

1. **Vertex sort method (D-11 vs D-15) - needs a user ruling.**
   - What we know: `localSettings.vertexSortMethod` is a free string; `views/settings/search/components/vertex-config.tsx` offers `globalPagerank`, `userPagerank`, `followDistance`. applesauce-extra's `SortMethod` is `"globalPagerank" | "personalizedPagerank" | "followerCount"`, and Vertex's docs list exactly those three [CITED: vertexlab.io/docs/services/search-profiles]. The `as any` cast hides that two UI options are not valid values (introduced in commit `0731e9f0f`).
   - What's unclear: D-11 says "validate the string preference into the method union", D-15 says no behaviour change. Any guard with a `globalPagerank` fallback changes what is sent for users who selected one of the two stale options.
   - Recommendation: implement `isSortMethod` with `"globalPagerank"` fallback (the existing `method || "globalPagerank"` already falls back for empty values), ship it as its **own commit** alongside D-07's treatment as a named D-15 exception, and record the stale `<option>` values in the backlog (fixing the Select is UI work outside bucket E). Alternative that honours D-15 literally: `value as SortMethod` (single assertion, aislop-clean but keeps the lie). Put the guard in a dependency-free module (e.g. `services/lookup/vertex-sort.ts`) so D-14 can test it.
2. **dayjs unit letters in the event console (D-11 vs D-15) - needs a ruling.**
   - What we know: the date regex has the `i` flag, so `H`/`W`/`S`/`D` parse, then dayjs treats them as milliseconds (measured above); `M` is months; lower-case is correct.
   - Recommendation: default to the exact-preservation table (`H`/`W`/`S`/`D` -> `"ms"`), with a test pinning it, and record the quirk as a backlog item. Option B (separate commit): normalise `H`/`W`/`S`/`D` to hour/week/second/day, which fixes an obviously broken behaviour but violates D-15.
3. **ROADMAP correction route (D-03).** `gsd-tools roadmap` subcommands are `analyze, get-phase, update-plan-progress, annotate-dependencies, validate, upgrade`; `gsd-tools phase` has `add, insert, remove, complete, ...`. None edits phase prose. The `/gsd-phase` skill ("edit" mode) is the likely handler; the planner should confirm before relying on it (never a direct Write/Edit).
4. **D-05 wording.** Treat "schemas extend `DBSchema`" as "schemas are assignable to `DBSchema`" (type aliases). Worth a one-line note in PLAN so verification does not look for the literal `extends DBSchema`.
5. **magic-textarea outcome.** D-11 expected 3 surviving directives; research shows 1 (`MagicInput`) plus an `Omit<TextareaProps, "color">` fix for the other two. The planner should confirm the `Omit` + `innerRef` change is acceptable (it touches a shared component used by ~12 forms; tsc verifies all consumers).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | tsc / vitest / aislop | yes | v26.9.0 | - |
| pnpm | `pnpm test`, `pnpm build`, `pnpm exec aislop` | yes | 11.2.2 | - |
| typescript | `tsc --noEmit -p tsconfig.json` (~35 s) | yes | 5.9.3 | - |
| aislop | `pnpm exec aislop scan --json .` (~10-12 s) | yes | 0.16.1 | - |
| vitest | `pnpm test` (~1 s for 4 files) | yes | 5.0.1 | - |
| vite | `pnpm build` (tsc + vite build; vite step ~5 s) | yes | - | - |
| fake-indexeddb | migration unit tests | no | - | manual UAT (see Validation) |
| python3 / jq | per-rule scan tabulation | python3 yes | 3.10 | use `node -e` |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** fake-indexeddb (deliberately not added).

## Validation Architecture

(`workflow.nyquist_validation` is absent in `.planning/config.json` -> enabled.)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.1, `environment: "node"` |
| Config file | `vitest.config.ts` (standalone; `include: ["src/**/*.test.ts"]`) |
| Quick run command | `pnpm test` (`vitest run`, ~1 s) |
| Full suite command | `pnpm build` (= `tsc --project tsconfig.json && vite build`) plus `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-11 | `isWebxdcMessage` accepts all old-accepted envelopes, rejects non-2.0 | unit | `pnpm test src/components/webxdc/jsonrpc.test.ts` | Wave 0 (new) |
| D-11/D-14 | `parseTimeUnit` / `processDateString` | unit | `pnpm test src/views/tools/event-console/process.test.ts` | Wave 0 (new) |
| D-11 (if ruled Option A) | `isSortMethod` fallback | unit | `pnpm test src/services/lookup/vertex-sort.test.ts` | Wave 0 (new, needs dependency-free module) |
| D-05/D-06/D-08/D-10/D-11/D-12 type-only edits | compiles | typecheck | `pnpm exec tsc --noEmit -p tsconfig.json` (~35 s) | existing |
| D-01/D-13 | bucket E count | scan | see below | existing |
| D-07 | `clearCacheData` clears `identities`, reloads | manual | Settings > Cache > Database > "Clear cache": button stops spinning and page reloads | manual-only (no fake-indexeddb) |
| D-06 | migrations v0->v13 / v12->v13 | manual | fresh profile (clear site data) boots without console errors; existing profile boots | manual-only |

### Rescan command and per-rule table
```bash
pnpm exec aislop scan --json . > /tmp/scan.json   # ~12 s; run from the main checkout (not a symlinked worktree)
node -e 'const d=require("/tmp/scan.json");const c={};for(const x of d.diagnostics)if(/^ai-slop\/(ts-directive|double-type-assertion|unsafe-type-assertion)$/.test(x.rule)&&x.filePath.startsWith("src/"))c[x.rule]=(c[x.rule]||0)+1;console.log(c,d.score)'
```
| Rule | Baseline @ d2bff764a | Projected after phase |
|------|---------------------|-----------------------|
| ai-slop/ts-directive | 35 | 0 reported |
| ai-slop/double-type-assertion | 20 | 0 reported |
| ai-slop/unsafe-type-assertion | 13 | 0 reported |
| Total / repo score | 68 / 85 | 0 / 86 (measured in the scratch worktree; warnings 566 -> 533, no new diagnostics of any rule) |

Ignored findings are suppressed in the scan output, so D-13's inventory comes from grep, not the scan:
```bash
grep -rnE "aislop-ignore[a-z-]* ai-slop/(ts-directive|double-type-assertion|unsafe-type-assertion)" src   # expect exactly 2: database/index.ts (atSchema), magic-textarea.tsx (MagicInput)
grep -rnE "@ts-ignore|@ts-expect-error|as unknown as|\bas any\b" src --exclude-dir=lib                    # expect: atSchema cast, MagicInput directive, and the unflagged test cast in permissions.test.ts:32
```
(Baseline of that second grep is 70 lines = 68 findings + `debug-api.ts:52` + `permissions.test.ts:32`.)

### Sampling Rate
- **Per task commit:** `pnpm exec tsc --noEmit -p tsconfig.json` and `pnpm test` (D-13: `pnpm build` after every task)
- **Per wave merge:** full `pnpm build` + `pnpm test` + rescan
- **Phase gate:** rescan table 68 -> 0 with the 2-line ignore inventory, `pnpm build` and `pnpm test` green, manual D-07 / startup UAT

### Wave 0 Gaps
- [ ] `src/components/webxdc/jsonrpc.ts` + `jsonrpc.test.ts`
- [ ] `src/views/tools/event-console/process.test.ts` (after `parseTimeUnit` exists)
- [ ] (conditional on Open Question 1) `src/services/lookup/vertex-sort.ts` + test

## Security Domain

(`security_enforcement` not set in config -> enabled.)

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | - |
| V3 Session Management | no | - |
| V4 Access Control | no | - |
| V5 Input Validation | yes | `isWebxdcMessage` narrows untrusted `postMessage` data from the sandboxed webxdc iframe; the existing `event.origin` and `event.source` checks stay first, and the guard must not become stricter than the old check (D-15) |
| V6 Cryptography | no | - (no crypto code touched; `getEventHash` call unchanged) |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Untrusted iframe message data typed as `any` | Tampering | `unknown` + guard; origin/source checks remain the primary control |
| Request id / method of unexpected type reaching handlers | Tampering | handlers take `unknown` and fall through to the existing "Method not found" reply; no behaviour change |
| Debug globals leaking prod state | Information disclosure | all 19 stay inside `import.meta.env.DEV`; `debug-api` removal path stays `Reflect.deleteProperty` |
| napplet-supplied filters reaching the relay pool | Tampering | `toRelayFilters` is a shallow copy only (no validation change, D-15) |

## Sources

### Primary (HIGH confidence)
- Scratch-worktree experiments (tsc 5.9.3, aislop 0.16.1, vitest 5.0.1, vite build) at `next` @ `57a6e1a14`; proof-of-concept patch was captured in the session scratchpad (`phase6-poc.patch`, 44 files, +194/-216; not committed)
- `node_modules/idb/build/entry.d.ts` and `build/index.js` (DBSchema, StoreNames, async shortcut methods reject on missing store)
- `@kehto/shell@0.21.2` dist `index.d.ts` / `index.js`, `@kehto/runtime@0.24.0`, `@kehto/services@0.21.2` (RelayPoolLike, pool call sites)
- `applesauce-relay@6.2.1` `pool.d.ts`/`types.d.ts`, `applesauce-extra@6.2.0` `vertex.d.ts`/`vertex.js`, `applesauce-common@6.2.0` `factories/reaction.d.ts`, `@napplet/core@0.32.0`
- `@types/react-window`, `@types/webscopeio__react-textarea-autocomplete`, `@webscopeio/react-textarea-autocomplete` dist (innerRef usage), `dayjs/index.d.ts` + measured runtime, `vite-plugin-pwa@1.3.0` `react.d.ts`
- Repo: `AGENTS.md` (Inline ignores), `.aislop/config.yml`, `vitest.config.ts`, `.planning/phases/05-*/05-CONTEXT.md` (D-04 route)

### Secondary (MEDIUM confidence)
- [vertexlab.io Search Profiles docs](https://vertexlab.io/docs/services/search-profiles/) and [Algorithms](https://vertexlab.io/docs/algos/) - supported sort methods (via web search summary)

### Tertiary (LOW confidence)
- none

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages; versions read from installed packages
- Architecture / remedies: HIGH - each applied and verified (tsc, scan, build, tests) in a scratch worktree
- Pitfalls: HIGH - each observed as a real tsc/aislop/dayjs result
- Vertex server behaviour: MEDIUM - docs summary via web search

**Research date:** 2026-10-05
**Valid until:** 2026-11-04 (line numbers drift as edits land; always re-measure with the rescan, per D-02)
