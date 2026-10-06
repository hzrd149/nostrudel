# Phase 6 Baseline: bucket-E type-safety escape hatches

**Measured:** 2026-10-05 on `next`. Score 85/100, 665 total diagnostics, 68 bucket-E findings in `src/`.
**Commit:** `5884dac0a` (planner measurement). Live re-confirmation by plan 06-01 ran at `55afb48fd`; `git diff --quiet 5884dac0a HEAD -- src` exited 0, so `src/` is identical to `5884dac0a`. The live scan (`pnpm exec aislop scan --json .`) returned 35 / 20 / 13, score 85 and 665 diagnostics, and its 68 `file:line` locations are identical to the table below. No discrepancy.

These measured values supersede the 2026-09-11 list and CONTEXT D-02's per-file table, whose distribution drifted with Phase 5's file splits (the total of 68 is unchanged).

## Per-rule before/after (D-13)

Closed by plan 06-10 from a live whole-repo rescan (`pnpm exec aislop scan --json .`, restricted to `src/`). Final repo score 86/100, 597 total diagnostics (665 before, a drop of exactly 68).

| Rule | Before | After | Delta |
|---|---|---|---|
| `ai-slop/ts-directive` | 35 | 0 | -35 |
| `ai-slop/double-type-assertion` | 20 | 0 | -20 |
| `ai-slop/unsafe-type-assertion` | 13 | 0 | -13 |
| **Total** | **68** | **0** | **-68** |

Two of the 68 findings (`magic-textarea.tsx:195`, the MagicInput directive, and `vertex.ts:36`) are suppressed by rule-scoped ignores rather than removed, so they no longer appear in the scan; the other 66 were fixed or deleted. The 16 `services/database/index.ts` migration casts were replaced by one new reasoned cast inside `atSchema()`, so three rule-scoped ignores exist in total (see "Surviving rule-scoped ignores"). Ignored findings vanish from the scan, so that inventory is by grep, not by scan.

Closing measurements: `pnpm build` exit 0, `pnpm test` exit 0 (4 files, 28 tests passed), whole-repo diagnostics 597 (the expected maximum of 665 - 68).

## Per-finding dispositions (D-01)

Every finding carries a disposition (fix, delete, replace or ignore-with-reason) and an owning plan; none is left un-triaged and none is marked out of scope. File paths are relative to `src/`.

| # | Rule | File:Line | Disposition | Decision | Plan | Resolved |
|---|---|---|---|---|---|---|
| 1 | ts-directive | `components/magic-textarea.tsx:166` | fix: Omit-color textarea props type | D-11, D-12 | 06-07 | 06-07 `5c7a1787c` |
| 2 | ts-directive | `components/magic-textarea.tsx:195` | ignore-with-reason: the library props generic cannot express an Input | D-11, D-12 | 06-07 | 06-07 `5c7a1787c`, ignored with reason |
| 3 | ts-directive | `components/magic-textarea.tsx:210` | fix: Omit-color textarea props type | D-11, D-12 | 06-07 | 06-07 `5c7a1787c` |
| 4 | unsafe-type-assertion | `components/webxdc/webxdc.tsx:112` | fix: unknown + isWebxdcMessage guard | D-11, D-14, D-15 | 06-06 | 06-06 `bc0fd92d7` |
| 5 | ts-directive | `helpers/media-upload/nostr-build.ts:44` | delete dead directive | D-12 | 06-03 | 06-03 `a9df51365` |
| 6 | ts-directive | `hooks/use-route-state-value.ts:29` | fix: isSetter type predicate | D-12 | 06-07 | 06-07 `af6359c99` |
| 7 | unsafe-type-assertion | `hooks/use-webxdc.ts:35` | fix: state typed as NostrEvent[] | D-11 | 06-06 | 06-06 `3ebaa1de2` |
| 8 | unsafe-type-assertion | `hooks/use-webxdc.ts:37` | fix: state typed as NostrEvent[] | D-11 | 06-06 | 06-06 `3ebaa1de2` |
| 9 | unsafe-type-assertion | `hooks/use-webxdc.ts:172` | fix: state typed as NostrEvent[] | D-11 | 06-06 | 06-06 `3ebaa1de2` |
| 10 | ts-directive | `polyfill.ts:3` | delete dead directive | D-12 | 06-03 | 06-03 `a9df51365` |
| 11 | double-type-assertion | `services/database/index.ts:26` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 12 | double-type-assertion | `services/database/index.ts:61` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 13 | double-type-assertion | `services/database/index.ts:62` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 14 | double-type-assertion | `services/database/index.ts:76` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 15 | double-type-assertion | `services/database/index.ts:77` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 16 | double-type-assertion | `services/database/index.ts:93` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 17 | double-type-assertion | `services/database/index.ts:94` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 18 | double-type-assertion | `services/database/index.ts:106` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 19 | ts-directive | `services/database/index.ts:117` | fix: destructure useExtension | D-08 | 06-04 | 06-04 `46d2dd113` |
| 20 | double-type-assertion | `services/database/index.ts:126` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 21 | double-type-assertion | `services/database/index.ts:136` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 22 | double-type-assertion | `services/database/index.ts:137` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 23 | double-type-assertion | `services/database/index.ts:182` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 24 | double-type-assertion | `services/database/index.ts:187` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 25 | double-type-assertion | `services/database/index.ts:194` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 26 | double-type-assertion | `services/database/index.ts:199` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 27 | double-type-assertion | `services/database/index.ts:207` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | 06-09 `c70b83e80` |
| 28 | ts-directive | `services/database/index.ts:246` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `9097258e3` |
| 29 | ts-directive | `services/dns-identity-loader.ts:19` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `c93713665` |
| 30 | ts-directive | `services/event-cache/index.ts:92` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `9097258e3` |
| 31 | ts-directive | `services/event-cache/wasm-worker.ts:55` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `9097258e3` |
| 32 | ts-directive | `services/event-store.ts:13` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `a5a0d1070` |
| 33 | ts-directive | `services/loaders.ts:109` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `a5a0d1070` |
| 34 | ts-directive | `services/loaders.ts:111` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `a5a0d1070` |
| 35 | ts-directive | `services/loaders.ts:113` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `a5a0d1070` |
| 36 | ts-directive | `services/loaders.ts:115` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `a5a0d1070` |
| 37 | ts-directive | `services/loaders.ts:117` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `a5a0d1070` |
| 38 | unsafe-type-assertion | `services/lookup/vertex.ts:36` | ignore-with-reason: stored preference can hold values outside SortMethod; Vertex slated for Open-Ranking replacement | D-17 | 06-08 | 06-08 `83a2b9d65`, ignored with reason |
| 39 | double-type-assertion | `services/napplet-shell/adapter.ts:73` | fix: explicit RelayPoolLike adapter object | D-11 | 06-05 | 06-05 `aebaa2c88` |
| 40 | unsafe-type-assertion | `services/napplet-shell/adapter.ts:151` | fix: toRelayFilters conversion | D-11 | 06-05 | 06-05 `aebaa2c88` |
| 41 | unsafe-type-assertion | `services/napplet-shell/adapter.ts:225` | fix: toRelayFilters conversion | D-11 | 06-05 | 06-05 `aebaa2c88` |
| 42 | double-type-assertion | `services/napplet-shell/common-actions.ts:172` | fix: the ReactionFactory draft is already an EventTemplate | D-11 | 06-05 | 06-05 `a67e934a5` |
| 43 | ts-directive | `services/outbox-cache.ts:53` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `a5a0d1070` |
| 44 | ts-directive | `services/pool.ts:79` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `a5a0d1070` |
| 45 | ts-directive | `services/preferences.ts:226` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `c93713665` |
| 46 | ts-directive | `services/read-status.ts:110` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `9097258e3` |
| 47 | ts-directive | `services/relay-info.ts:31` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `a5a0d1070` |
| 48 | ts-directive | `services/relay-scoreboard.ts:222` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `9097258e3` |
| 49 | ts-directive | `services/social-graph.ts:201` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `c93713665` |
| 50 | ts-directive | `services/wallets/index.ts:273` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `c93713665` |
| 51 | double-type-assertion | `services/wallets/webln.ts:58` | fix: use the global Window.webln augmentation | D-11 | 06-05 | 06-05 `72a651212` |
| 52 | double-type-assertion | `services/wallets/webln.ts:62` | fix: use the global Window.webln augmentation | D-11 | 06-05 | 06-05 `72a651212` |
| 53 | ts-directive | `services/xml-feeds.ts:27` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | 06-02 `c93713665` |
| 54 | ts-directive | `views/groups/components/group-message-form.tsx:28` | fix: explicit useCacheForm generic | D-12 | 06-07 | 06-07 `af6359c99` |
| 55 | ts-directive | `views/new/picture/picture-post-form.tsx:43` | fix: explicit useCacheForm generic | D-12 | 06-07 | 06-07 `af6359c99` |
| 56 | unsafe-type-assertion | `views/notifications/mentions/index.tsx:99` | fix: hook ref type, cast deleted | D-10 | 06-03 | 06-03 `f92f0d2db` |
| 57 | unsafe-type-assertion | `views/notifications/quotes/index.tsx:99` | fix: hook ref type, cast deleted | D-10 | 06-03 | 06-03 `f92f0d2db` |
| 58 | unsafe-type-assertion | `views/notifications/replies/index.tsx:92` | fix: hook ref type, cast deleted | D-10 | 06-03 | 06-03 `f92f0d2db` |
| 59 | unsafe-type-assertion | `views/notifications/reposts/index.tsx:98` | fix: hook ref type, cast deleted | D-10 | 06-03 | 06-03 `ddcae80d2` |
| 60 | unsafe-type-assertion | `views/notifications/threads/index.tsx:100` | fix: hook ref type, cast deleted | D-10 | 06-03 | 06-03 `ddcae80d2` |
| 61 | unsafe-type-assertion | `views/notifications/zaps/index.tsx:101` | fix: hook ref type, cast deleted | D-10 | 06-03 | 06-03 `ddcae80d2` |
| 62 | ts-directive | `views/pictures/picture/media-post-comment-form.tsx:54` | fix: onPaste typed for textarea or input in useTextAreaUploadFile | D-11, D-12 | 06-07 | 06-07 `8cd1fcfb4` |
| 63 | ts-directive | `views/streams/stream/stream-chat/stream-chat-form.tsx:56` | fix: onPaste typed for textarea or input in useTextAreaUploadFile | D-11, D-12 | 06-07 | 06-07 `8cd1fcfb4` |
| 64 | ts-directive | `views/tools/event-console/process.ts:14` | fix: parseTimeUnit, case-insensitive units | D-18 | 06-08 | 06-08 `83221af05` |
| 65 | ts-directive | `views/tools/event-console/process.ts:21` | fix: parseTimeUnit, case-insensitive units | D-18 | 06-08 | 06-08 `83221af05` |
| 66 | ts-directive | `views/tools/event-publisher/index.tsx:263` | fix: destructure sig | D-12 | 06-08 | 06-08 `e746a0fb6` |
| 67 | ts-directive | `views/tools/event-publisher/process.ts:83` | fix: return type UnsignedEvent & { id: string } | D-12 | 06-08 | 06-08 `e746a0fb6` |
| 68 | ts-directive | `vite-env.d.ts:6` | delete dead directive (whole unused module block) | D-12 | 06-03 | 06-03 `a9df51365` |

Per-plan tally: 06-02 19, 06-03 9, 06-04 1, 06-05 6, 06-06 4, 06-07 8, 06-08 5, 06-09 16 (= 68).

## Unflagged, in scope (D-04)

Not numbered into the 68-row table above, so that table's row count stays 68.

| File:Line | What it is | Disposition | Plan | Resolved |
|---|---|---|---|---|
| `services/debug-api.ts:52` | directive-backed removal of the debug API global | replace with Reflect.set / Reflect.deleteProperty | 06-03 | 06-03 `a9df51365` |

## Surviving rule-scoped ignores (D-13)

Exactly three, found by `grep -rnE "aislop-ignore[a-z-]* ai-slop/(ts-directive|double-type-assertion|unsafe-type-assertion)" src` at the close of the phase. Each is rule-scoped with a `-- reason` that explains why the type system cannot express the code, meeting the AGENTS.md "Inline ignores" and P4 D-08 bar:

| # | File:Line | Rule | Reason (verbatim) |
|---|---|---|---|
| 1 | `src/services/database/index.ts:28` | `ai-slop/double-type-assertion` | an upgrade transaction runs against the database at whichever past schema version a migration step targets, which the type system cannot track across the version chain |
| 2 | `src/components/magic-textarea.tsx:201` | `ai-slop/ts-directive` | the autocomplete library constrains its props generic to textarea attributes while MagicInput deliberately renders a Chakra Input whose props and handlers are typed for HTMLInputElement, so no props type satisfies the library's own typings |
| 3 | `src/services/lookup/vertex.ts:36` | `ai-slop/unsafe-type-assertion` | the stored vertex sort method is a free string that can hold values outside applesauce-extra's SortMethod union (the settings menu offers userPagerank and followDistance); the Vertex custom API integration is slated for replacement by the Open-Ranking protocol API, so the value is passed through unchanged rather than validated |

Originally planned as:

1. The single double assertion inside the D-06 historical-schema helper `atSchema()` in `services/database/index.ts` (D-05, D-06). This is a new line, so it is not a row in the 68-row table.
2. The MagicInput TypeScript directive in `components/magic-textarea.tsx` (finding 2, D-11, D-12).
3. The vertex sort-method cast in `services/lookup/vertex.ts` (finding 38, D-17).

RESEARCH.md's count of "exactly 2" predates D-17 and is superseded by this list.

## Escape-hatch grep disposition (D-12)

`grep -rnE "@ts-ignore|@ts-expect-error|as unknown as|\bas any\b" src --exclude-dir=lib` now returns 4 lines (70 at baseline), all dispositioned. No other match exists, so no un-triaged escape hatch remains.

| File:Line | Match | Disposition |
|---|---|---|
| `src/services/database/index.ts:29` | `as unknown as { db; transaction }` in `atSchema()` | Ignored with reason (surviving ignore 1, D-06) |
| `src/components/magic-textarea.tsx:202` | `@ts-expect-error -- TS2344 ...` | Ignored with reason (surviving ignore 2, D-11/D-12); the only remaining directive and it is an expect-error with a reason |
| `src/services/lookup/vertex.ts:37` | `as any` | Ignored with reason (surviving ignore 3, D-17) |
| `src/services/napplet-shell/permissions.test.ts:32` | `as unknown as ShellBridge` | Not a finding; unflagged test-double cast, out of scope per D-04 |

`grep -rnE "@ts-ig[n]ore" src --exclude-dir=lib | wc -l` prints 0: no legacy ignore-style directive remains outside `src/lib` (D-12).

## Scope note (D-04)

- `services/debug-api.ts:52` is included (unflagged by the scan, but it is a directive-backed escape hatch of the same kind).
- Vendored `src/lib/*` is excluded; Phase 2 already excludes it from scoring.
- Plain `: any` annotations are out of scope unless they sit on a line already being rewritten.
- The unflagged test-double cast in `services/napplet-shell/permissions.test.ts` is not a finding and is not touched.

## Wave order (D-16)

1. Wave 1, mechanical (low risk): D-09 debug globals, D-12 dead directives, D-10 scroll-restore hook, in plans 06-02 and 06-03.
2. Wave 2, per-site remedies: D-07, D-08, D-11, the remaining D-12 directives, D-17 and D-18, in plans 06-04 through 06-08. D-07 and D-18 each land in their own commit.
3. Wave 3, database schema typing: D-05/D-06 in plan 06-09. The schema conversion and all 16 cast removals land in one commit so `tsc` stays green.
4. Wave 4, close-out: plan 06-10 fills the After column and the ignore inventory above.

### Executed wave order

All plans ran on 2026-10-05 in the planned order, with no deviation from the wave structure:

- Wave 1 (mechanical): 06-01 (baseline), 06-02 (Reflect.set debug globals), 06-03 (scroll-restore ref type, dead directives, debug-api).
- Wave 2 (per-site): 06-04 (D-07 `f37f7fbe6` in its own commit, then D-08 `46d2dd113`), 06-05, 06-06 (tests first: `f36342bfc` RED, `6b3a02fa2` GREEN), 06-07, 06-08 (D-18 `83221af05` in its own commit, then `e746a0fb6`, `83a2b9d65`).
- Wave 3 (schema typing): 06-09, one commit `c70b83e80` for the schema conversion plus all 16 cast removals.
- Wave 4 (close-out): 06-10, no source changes.

Noted deviation: the vertex ignore commit `83a2b9d65` is typed `chore(06-08)` rather than `refactor`, which does not affect behavior.

## Manual verification (all 7 passed in 06-UAT.md on 2026-10-06)

Browser-only behaviors the phase could not verify automatically (no `fake-indexeddb`, no browser test runner). None is marked verified: a passing build and 28/28 tests do not cover them. They feed `/gsd-verify-work`. Rows 1 and 2 are also in `06-VALIDATION.md`'s Manual-Only table.

| # | Behavior | Plan / decision | Steps | Status |
|---|---|---|---|---|
| 1 | "Clear cache data" completes | 06-04 (D-07); VALIDATION Manual-Only row 1 | Settings > Cache > Database > Clear cache data: the button stops spinning, the page reloads, no `NotFoundError` in the console | passed (06-UAT.md, 2026-10-06) |
| 2 | IndexedDB migrations still run | 06-04 (D-08) and 06-09 (D-05/D-06); VALIDATION Manual-Only row 2 | Clear site data, load the app: it boots with no console errors (v0 -> v13 migration chain). Then load an existing profile: it boots and its accounts are intact | passed (06-UAT.md, 2026-10-06) |
| 3 | Napplet subscribe and publish | 06-05 (D-11) | In a napplet, subscribe through the shell and confirm events return; publish an event and confirm success is reported | passed (06-UAT.md, 2026-10-06) |
| 4 | WebLN wallet balance | 06-05 (D-11) | With a WebLN provider connected, open the wallet view and confirm the balance still shows | passed (06-UAT.md, 2026-10-06) |
| 5 | webxdc app lifecycle | 06-06 (D-11, D-14, D-15) | Load a webxdc app: it receives `webxdc.init`, and sends and receives a state update | passed (06-UAT.md, 2026-10-06) |
| 6 | @-mention autocomplete | 06-07 (D-11, D-12) | Type `@` in a note composer (MagicTextArea) and in stream chat (MagicInput): the autocomplete opens | passed (06-UAT.md, 2026-10-06) |
| 7 | Paste-to-upload in stream chat | 06-07 (D-11) | Paste an image into the stream chat input: it uploads | passed (06-UAT.md, 2026-10-06) |

## Rescan and inventory commands

Bucket-E rescan (the scan exits non-zero by design; read the JSON, not the exit code):

```bash
pnpm exec aislop scan --json . > "$TMPDIR/scan.json"
node -e 'const d=require(process.argv[1]);const c={};for(const x of d.diagnostics)if(/^ai-slop\/(ts-directive|double-type-assertion|unsafe-type-assertion)$/.test(x.rule)&&x.filePath.startsWith("src/"))c[x.rule]=(c[x.rule]||0)+1;console.log(c,d.score)' "$TMPDIR/scan.json"
```

Ignored findings vanish from the scan, so the ignore inventory is by grep:

```bash
grep -rnE "aislop-ignore[a-z-]* ai-slop/(ts-directive|double-type-assertion|unsafe-type-assertion)" src
grep -rnE "@ts-ignore|@ts-expect-error|as unknown as|\bas any\b" src --exclude-dir=lib
```

Grep baseline for the second command today: 70 matching lines (the 68 findings, `services/debug-api.ts:52`, and the `permissions.test.ts` test-double cast).
