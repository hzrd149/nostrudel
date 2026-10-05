# Phase 6: Close type-safety escape hatches - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Bucket E of the aislop scan — `ai-slop/ts-directive` (`@ts-ignore` / `@ts-expect-error`),
`ai-slop/double-type-assertion` (`as unknown as X`) and `ai-slop/unsafe-type-assertion` (`as any`)
— is closed: every finding in `src/` is replaced by real typing, or carries a rule-scoped ignore
whose reason states why the type system cannot express it. The IndexedDB wrapper becomes a
genuinely typed wrapper, and the copy-pasted notification casts are removed at their shared cause.

Not in this phase: `: any` annotations that are not assertions (except on lines already being
rewritten), vendored `src/lib/*`, and any rule outside bucket E.

</domain>

<decisions>
## Implementation Decisions

### Scope & completion

- **D-01:** Done means **every bucket-E finding in `src/` is either fixed or carries a rule-scoped
  `aislop-ignore-*` with a reason** — the P4 D-01 / P5 D-01 bar. This is a *chosen* bar: nothing in
  the bucket gates CI (`ts-directive` is info severity, the two assertion rules are warnings).
  Explicitly rejected: fixing only the two ROADMAP-named clusters, and a zero-ignore absolute.

- **D-02:** **The measured starting point is 68 findings** at `next` @ `d2bff764a` (repo score
  85/100): 35 `ts-directive`, 20 `double-type-assertion`, 13 `unsafe-type-assertion`. The total
  matches the 2026-09-11 baseline but **the per-file distribution drifted** with Phase 5's splits.
  Following P4 D-02 / P5 D-03, the planner re-measures rather than trusting either list.

  | File | Findings |
  |---|---|
  | `services/database/index.ts` | 18 (16 double, 2 directive) |
  | DEV-only `window.X = X` debug globals across 15 service files | 19 directives (`loaders.ts` ×5, `database`, `dns-identity-loader`, `event-cache/index`, `event-cache/wasm-worker`, `event-store`, `outbox-cache`, `pool`, `preferences`, `read-status`, `relay-info`, `relay-scoreboard`, `social-graph`, `wallets/index`, `xml-feeds`) — note `database/index.ts:246` is counted in both rows |
  | `views/notifications/{mentions,quotes,replies,reposts,threads,zaps}/index.tsx` | 6 `as any` |
  | `components/magic-textarea.tsx` | 3 directives |
  | `hooks/use-webxdc.ts` | 3 `as any` |
  | `services/napplet-shell/adapter.ts` | 1 double + 2 `as any` |
  | `services/wallets/webln.ts` | 2 double |
  | `views/tools/event-console/process.ts` | 2 directives |
  | singles | `webxdc.tsx:112`, `lookup/vertex.ts:36`, `napplet-shell/common-actions.ts:172`, `media-upload/nostr-build.ts:44`, `use-route-state-value.ts:29`, `polyfill.ts:3`, `group-message-form.tsx:28`, `picture-post-form.tsx:43`, `media-post-comment-form.tsx:54`, `stream-chat-form.tsx:56`, `event-publisher/index.tsx:263`, `event-publisher/process.ts:83`, `vite-env.d.ts:6` |

- **D-03:** **The ROADMAP Phase 6 entry is corrected before planning completes**, through the
  `gsd-tools` roadmap handler — never a direct Write/Edit (P5 D-04). It is stale in three ways:
  it names `providers/global/napplet-shell-provider.tsx` (4) and `services/wallets.ts` (3), which
  Phase 5 split into `services/napplet-shell/*` and `services/wallets/*`; it omits the largest
  cluster (the 19 DEV-only debug globals); and it frames the notifications fix as a new "shared
  typed helper" when the cause is one wrong type in the existing `useVirtualListScrollRestore`
  hook (D-10).

- **D-04:** **Scope edges.** `services/debug-api.ts:52` (`delete window.noStrudel` behind
  `@ts-expect-error debug`) is **included** — same pattern as the debug globals; aislop simply did
  not flag it. Vendored `src/lib/*` is **excluded** (P2 D-10 excludes it from scoring; it also
  carries directives the probe surfaced in `open-graph-scraper`). `: any` **annotations** (e.g.
  schema `value: any`, `SerializedAccount<any, any>`) are **out of scope** unless they sit on a
  line already being rewritten. Explicitly rejected: flagged-only, and a sweep of every `any` in
  touched files.

### The IndexedDB wrapper (`services/database`)

- **D-05:** **The schema is made genuinely type-checked.** Verified during discussion with a type
  probe: `SchemaV1`…`SchemaV13` (`services/database/schema.ts`) are plain interfaces that do not
  extend idb's `DBSchema`, so in idb 8.0.3 `SchemaV13 extends DBSchema` is **false**, and
  `StoreNames<>` / `StoreValue<>` fall through to `string` / `any`. `StoreNames<SchemaV13>`
  accepts `"totally-not-a-store"`. **The current schema typing is a no-op.** The schemas extend
  `DBSchema`, and the real type errors this exposes are fixed in the consumers:
  `services/accounts.ts`, `dns-identity-loader.ts`, `relay-info.ts`, `relay-scoreboard.ts`,
  `read-status.ts`, `services/database/kv.ts`. This is what "one properly-typed wrapper" in the
  goal means. Explicitly rejected: removing only the casts and leaving the wrapper untyped.

- **D-06:** **The 16 `as unknown as` casts in the `upgrade()` migration chain collapse into one
  typed helper** that views the upgrade callback's database / transaction at a historical schema
  version. The helper holds the file's single remaining cast behind a rule-scoped ignore whose
  reason is that an upgrade transaction runs against a database at a past schema version, which
  the type system cannot track. **Migration bodies stay runtime-identical.** Explicitly rejected:
  running migrations against the untyped `IDBPDatabase` (no casts, but loses per-version store
  checking), and 16 per-site ignores.

- **D-07:** **`clearCacheData()` is a real latent bug, fixed in its own commit** (P5 D-18).
  It calls `db.clear("dnsIdentifiers")`, a store the v12 migration deleted
  (`v11.deleteObjectStore("dnsIdentifiers")`). idb's shortcut opens a transaction on the missing
  store inside an async function, so the call **rejects with `NotFoundError`**:
  `relayScoreboardStats` is never cleared, `window.location.reload()` never runs, and
  `views/settings/cache/database/internal.tsx`'s `handleClearData` (no try/catch) leaves its
  button spinning. D-05's real typing would flag the line at compile time. **Fix: clear
  `identities` — the v12 successor cache — in its place.** Explicitly rejected: dropping the line
  only, and also converting `internal.tsx`'s hand-rolled loading handlers to `useAsyncAction`
  (see Deferred).

- **D-08:** The v5 migration's `// @ts-ignore delete newAccount.useExtension` (`database/index.ts:117`)
  is replaced by **destructuring** (`const { useExtension, ...rest } = account`) so the new object
  never carries the key. Same stored result, no directive.

### Remedies for the remaining findings

- **D-09:** The **19 DEV-only debug globals** become `Reflect.set(window, "X", X)` inside the
  existing `if (import.meta.env.DEV)` blocks — the form `services/debug-api.ts:51` already uses.
  Zero behavior change, no directive. `debug-api.ts:52`'s `delete window.noStrudel` becomes the
  matching `Reflect.deleteProperty`. Explicitly rejected: folding them into the `noStrudel` debug
  API (11 of 19 are already there, but it changes the dev workflow and would eagerly import
  lazily loaded modules such as the wasm worker), and a typed `Window` augmentation listing all 19.

- **D-10:** The **6 notification `ref={scroll.ref as any}`** are removed at their cause:
  `hooks/use-scroll-restore.ts`'s `useVirtualListScrollRestore` types its list-ref callback as
  `(list: FixedSizeList | null)`, while the notification views render `VariableSizeList`. Typing
  the callback against the shared `scrollTo` surface makes it assignable to both, and all six
  casts are deleted. Other consumers (`views/lists/following`, `views/files`, `views/lists/muted`,
  `views/articles`) must still type-check unchanged. Explicitly rejected: making the hook generic.

- **D-11:** **Library-boundary casts are fixed with real types where the mismatch is ours**:
  - `napplet-shell/adapter.ts:73` `pool as unknown as RelayPoolLike` and `:151` / `:225`
    `filters as any` — an explicit typed adapter / conversion. Note kehto's `RelayPoolLike` has an
    optional `count?(): number | Promise<number>`; the researcher must check whether applesauce's
    `RelayPool` exposes a `count` with incompatible semantics that the current cast hides.
  - `wallets/webln.ts:58,62` — use the existing global `Window.webln` augmentation in
    `src/types/webln.d.ts` instead of casting `window` to a local shape.
  - `components/webxdc/webxdc.tsx:112` `event.data as any` — parse as `unknown` and narrow with a
    JSON-RPC message type guard.
  - `services/lookup/vertex.ts:36` — validate the string preference into the method union.
  - `hooks/use-webxdc.ts` ×3 — type the collected state as the events it actually holds.
  - `napplet-shell/common-actions.ts:172` — resolve the `ReactionFactory` draft's real type.
  A directive is kept **only where the mismatch is inside a third-party package's own typings** —
  expected: react-textarea-autocomplete's props-generic constraint in `components/magic-textarea.tsx`
  ×3 (and the researcher should check whether the two `onPaste` directives in
  `media-post-comment-form.tsx` / `stream-chat-form.tsx` share that cause). Explicitly rejected:
  ignore-with-reason at every boundary, and fixing upstream in kehto/applesauce.

- **D-12:** **Directive policy.** Dead directives are deleted — the probe (all directives
  stripped, `tsc --noEmit`) showed **no error** at `helpers/media-upload/nostr-build.ts:44` and
  `polyfill.ts:3`; `vite-env.d.ts:6` sits in a `.d.ts` that `skipLibCheck` never checks and React
  is installed, so its stated reason does not hold (the researcher may find the whole
  `virtual:pwa-register/react` block replaceable by the plugin's own types). Every surviving
  directive is **`@ts-expect-error` (never `@ts-ignore`) carrying its own reason**, so `tsc` fails
  once it stops being needed, and is preceded by a rule-scoped
  `// aislop-ignore-next-line ai-slop/ts-directive -- <reason>` (P5 D-01: no
  documented-but-unmarked findings). If a probe shows a single-line form clears the finding, the
  planner may use it. Explicitly rejected: TS reason only with the info finding left standing, and
  keeping existing `@ts-ignore`s.

### Verification & process

- **D-13:** Verification is a **scoped rescan with a per-rule before/after table (68 → N)** plus an
  explicit list of every site left behind an ignore with its reason (P3 D-04 / P4 D-14 / P5 D-19).
  **`pnpm build` must pass after every task** — for a type-safety phase `tsc` is the real verifier.

- **D-14:** **vitest (added in P5) covers only new runtime guards or parsers that replace a cast** —
  e.g. the webxdc JSON-RPC message guard (D-11) and an event-console time-unit parser — where a
  wrong guard would silently drop input. No tests for type-only edits. Explicitly rejected: no
  tests (P3/P4 precedent), and testing every touched function.

- **D-15:** **Type-only wherever possible.** Where removing a cast needs a runtime check, the check
  must accept everything the old code accepted — no new rejection paths. The only deliberate
  behavior change is D-07, in its own commit. Explicitly rejected: allowing stricter validation
  where it looks obviously correct.

- **D-16:** **Waves run low-risk first** (P5 D-17): wave 1 the mechanical items (D-09 debug
  globals, D-12 dead directives, D-10 scroll hook); wave 2 the per-site remedies (D-08, D-11, the
  remaining directives); wave 3 the database schema typing (D-05/D-06), riskiest because it
  exposes consumer type errors and runs on the startup path (top-level-await `openDB`). D-07's
  bug fix lands in its own commit. Mechanical churn stays in its own commits (P4 D-04 / P5 D-16).

### Rulings after research (2026-10-05)

Research found two places where removing a cast would collide with D-15. The user ruled:

- **D-17:** **Vertex (`services/lookup/vertex.ts:36`) keeps its current runtime behavior** — no
  guard, no fallback. The settings menu offers `userPagerank` / `followDistance`, which are not in
  `SortMethod`, but the Vertex custom API is going to be **replaced by the Open-Ranking protocol API**
  (https://github.com/Open-Ranking/protocol), so it is not worth correcting. The `as any` stays
  behind a rule-scoped `aislop-ignore-next-line ai-slop/unsafe-type-assertion` whose reason says the
  stored preference can hold values outside `SortMethod` and the Vertex integration is slated for
  replacement by the Open-Ranking API. Explicitly rejected: a validated guard with a
  `globalPagerank` fallback, and fixing the stale `<option>` values now.

- **D-18:** **The event-console relative-time unit quirk is fixed now** — a named, deliberate
  exception to D-15, in its own commit. Today the regex `/n([+-])(\d+)([hwmsd])?/i` is
  case-insensitive but the matched letter is passed straight to dayjs, so `n-5H`, `W`, `S`, `D`
  mean milliseconds and `M` means months (measured against dayjs 1.11.21 in research). The typed
  parser maps the unit **case-insensitively** to the meanings the help modal documents
  (`help-modal.tsx:43`: `h` hour, `w` week, `m` minute, `s` second, `d` day; no unit → hour), so
  uppercase letters mean the same as lowercase. A vitest test pins every letter in both cases.
  Explicitly rejected: an exact-preservation table with the quirk backlogged.

### Claude's Discretion

- The exact shape and name of the D-06 historical-schema helper.
- The exact typing used in D-10 and each D-11 conversion.
- The exact wording of every `-- reason` string, subject to the P4 D-08 justification bar.
- Plan-to-wave assignment within D-16's ordering.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `services/debug-api.ts:51` — `Reflect.set(window, "noStrudel", noStrudel)`: the in-repo precedent for D-09.
- `src/types/webln.d.ts`, `src/types/nostr-extensions.d.ts`, `src/types/window.d.ts` — existing global `Window` augmentations (D-11's `window.webln`).
- `hooks/use-scroll-restore.ts` — `useVirtualListScrollRestore` (D-10).
- vitest harness from Phase 5 (`pnpm test` → `vitest run`) for D-14.

### Established Patterns
- Rule-scoped inline ignores with `-- reason` (`AGENTS.md` § Inline ignores); see `services/verify-event.ts:32` for a reason that meets the justification bar.
- Namespaced debug logger `logger.extend("<Module>")` (`helpers/debug.ts`) if any new failure path needs logging.
- idb 8.0.3: `openDB<DBTypes extends DBSchema | unknown>`; all typed helpers branch on `DBTypes extends DBSchema`.

### Integration Points
- `services/database/index.ts` is imported at startup via top-level await; its consumers are `accounts.ts`, `dns-identity-loader.ts`, `relay-info.ts`, `relay-scoreboard.ts`, `read-status.ts`, `database/kv.ts` (used by `social-graph.ts`, `exchange-rates.ts`), and `views/settings/cache/database/internal.tsx` (`clearCacheData`, `deleteDatabase`).
- `useCacheForm` (`hooks/use-cache-form.ts`) typing drives the two form `getValues` directives; that file also carries a Phase 8 TODO — leave the TODO to Phase 8.

</code_context>

<specifics>
## Specific Ideas

- Probe evidence (2026-10-05): stripping every `@ts-ignore` / `@ts-expect-error` in a scratch worktree and running `tsc --noEmit` errored at every flagged site except `nostr-build.ts:44`, `polyfill.ts:3` and (unchecked) `vite-env.d.ts:6`.
- `debug-api.ts:52` is an unflagged directive — include it in the D-13 ignore/fix inventory.

</specifics>

<deferred>
## Deferred Ideas

- Converting `views/settings/cache/database/internal.tsx`'s hand-rolled `clearing` / `deleting` state to `useAsyncAction` (AGENTS.md convention) so a failed clear surfaces as a toast — outside bucket E; candidate for a backlog item.
- Replacing the Vertex custom API (`services/lookup/vertex.ts`, `views/settings/search/components/vertex-config.tsx`) with the Open-Ranking protocol API (https://github.com/Open-Ranking/protocol) — removes D-17's ignore and the stale sort-method options.
- Tightening the schema's `value: any` annotations (`relayInfo`, `misc`, `kv`, `settings`) — `: any` annotations are out of scope (D-04).

</deferred>
