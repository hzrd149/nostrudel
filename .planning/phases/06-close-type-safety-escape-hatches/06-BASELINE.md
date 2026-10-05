# Phase 6 Baseline: bucket-E type-safety escape hatches

**Measured:** 2026-10-05 on `next`. Score 85/100, 665 total diagnostics, 68 bucket-E findings in `src/`.
**Commit:** `5884dac0a` (planner measurement). Live re-confirmation by plan 06-01 ran at `55afb48fd`; `git diff --quiet 5884dac0a HEAD -- src` exited 0, so `src/` is identical to `5884dac0a`. The live scan (`pnpm exec aislop scan --json .`) returned 35 / 20 / 13, score 85 and 665 diagnostics, and its 68 `file:line` locations are identical to the table below. No discrepancy.

These measured values supersede the 2026-09-11 list and CONTEXT D-02's per-file table, whose distribution drifted with Phase 5's file splits (the total of 68 is unchanged).

## Per-rule before/after (D-13)

Plan 06-10 fills the After and Delta columns and lists every surviving ignore.

| Rule | Before | After | Delta |
|---|---|---|---|
| `ai-slop/ts-directive` | 35 | TBD (06-10) | TBD (06-10) |
| `ai-slop/double-type-assertion` | 20 | TBD (06-10) | TBD (06-10) |
| `ai-slop/unsafe-type-assertion` | 13 | TBD (06-10) | TBD (06-10) |
| **Total** | **68** | TBD (06-10) | TBD (06-10) |

## Per-finding dispositions (D-01)

Every finding carries a disposition (fix, delete, replace or ignore-with-reason) and an owning plan; none is left un-triaged and none is marked out of scope. File paths are relative to `src/`.

| # | Rule | File:Line | Disposition | Decision | Plan | Resolved |
|---|---|---|---|---|---|---|
| 1 | ts-directive | `components/magic-textarea.tsx:166` | fix: Omit-color textarea props type | D-11, D-12 | 06-07 | TBD |
| 2 | ts-directive | `components/magic-textarea.tsx:195` | ignore-with-reason: the library props generic cannot express an Input | D-11, D-12 | 06-07 | TBD |
| 3 | ts-directive | `components/magic-textarea.tsx:210` | fix: Omit-color textarea props type | D-11, D-12 | 06-07 | TBD |
| 4 | unsafe-type-assertion | `components/webxdc/webxdc.tsx:112` | fix: unknown + isWebxdcMessage guard | D-11, D-14, D-15 | 06-06 | TBD |
| 5 | ts-directive | `helpers/media-upload/nostr-build.ts:44` | delete dead directive | D-12 | 06-03 | TBD |
| 6 | ts-directive | `hooks/use-route-state-value.ts:29` | fix: isSetter type predicate | D-12 | 06-07 | TBD |
| 7 | unsafe-type-assertion | `hooks/use-webxdc.ts:35` | fix: state typed as NostrEvent[] | D-11 | 06-06 | TBD |
| 8 | unsafe-type-assertion | `hooks/use-webxdc.ts:37` | fix: state typed as NostrEvent[] | D-11 | 06-06 | TBD |
| 9 | unsafe-type-assertion | `hooks/use-webxdc.ts:172` | fix: state typed as NostrEvent[] | D-11 | 06-06 | TBD |
| 10 | ts-directive | `polyfill.ts:3` | delete dead directive | D-12 | 06-03 | TBD |
| 11 | double-type-assertion | `services/database/index.ts:26` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 12 | double-type-assertion | `services/database/index.ts:61` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 13 | double-type-assertion | `services/database/index.ts:62` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 14 | double-type-assertion | `services/database/index.ts:76` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 15 | double-type-assertion | `services/database/index.ts:77` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 16 | double-type-assertion | `services/database/index.ts:93` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 17 | double-type-assertion | `services/database/index.ts:94` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 18 | double-type-assertion | `services/database/index.ts:106` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 19 | ts-directive | `services/database/index.ts:117` | fix: destructure useExtension | D-08 | 06-04 | TBD |
| 20 | double-type-assertion | `services/database/index.ts:126` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 21 | double-type-assertion | `services/database/index.ts:136` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 22 | double-type-assertion | `services/database/index.ts:137` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 23 | double-type-assertion | `services/database/index.ts:182` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 24 | double-type-assertion | `services/database/index.ts:187` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 25 | double-type-assertion | `services/database/index.ts:194` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 26 | double-type-assertion | `services/database/index.ts:199` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 27 | double-type-assertion | `services/database/index.ts:207` | fix: collapsed into the one atSchema helper | D-05, D-06 | 06-09 | TBD |
| 28 | ts-directive | `services/database/index.ts:246` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 29 | ts-directive | `services/dns-identity-loader.ts:19` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 30 | ts-directive | `services/event-cache/index.ts:92` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 31 | ts-directive | `services/event-cache/wasm-worker.ts:55` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 32 | ts-directive | `services/event-store.ts:13` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 33 | ts-directive | `services/loaders.ts:109` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 34 | ts-directive | `services/loaders.ts:111` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 35 | ts-directive | `services/loaders.ts:113` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 36 | ts-directive | `services/loaders.ts:115` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 37 | ts-directive | `services/loaders.ts:117` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 38 | unsafe-type-assertion | `services/lookup/vertex.ts:36` | ignore-with-reason: stored preference can hold values outside SortMethod; Vertex slated for Open-Ranking replacement | D-17 | 06-08 | TBD |
| 39 | double-type-assertion | `services/napplet-shell/adapter.ts:73` | fix: explicit RelayPoolLike adapter object | D-11 | 06-05 | TBD |
| 40 | unsafe-type-assertion | `services/napplet-shell/adapter.ts:151` | fix: toRelayFilters conversion | D-11 | 06-05 | TBD |
| 41 | unsafe-type-assertion | `services/napplet-shell/adapter.ts:225` | fix: toRelayFilters conversion | D-11 | 06-05 | TBD |
| 42 | double-type-assertion | `services/napplet-shell/common-actions.ts:172` | fix: the ReactionFactory draft is already an EventTemplate | D-11 | 06-05 | TBD |
| 43 | ts-directive | `services/outbox-cache.ts:53` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 44 | ts-directive | `services/pool.ts:79` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 45 | ts-directive | `services/preferences.ts:226` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 46 | ts-directive | `services/read-status.ts:110` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 47 | ts-directive | `services/relay-info.ts:31` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 48 | ts-directive | `services/relay-scoreboard.ts:222` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 49 | ts-directive | `services/social-graph.ts:201` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 50 | ts-directive | `services/wallets/index.ts:273` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 51 | double-type-assertion | `services/wallets/webln.ts:58` | fix: use the global Window.webln augmentation | D-11 | 06-05 | TBD |
| 52 | double-type-assertion | `services/wallets/webln.ts:62` | fix: use the global Window.webln augmentation | D-11 | 06-05 | TBD |
| 53 | ts-directive | `services/xml-feeds.ts:27` | replace with Reflect.set inside the DEV block | D-09 | 06-02 | TBD |
| 54 | ts-directive | `views/groups/components/group-message-form.tsx:28` | fix: explicit useCacheForm generic | D-12 | 06-07 | TBD |
| 55 | ts-directive | `views/new/picture/picture-post-form.tsx:43` | fix: explicit useCacheForm generic | D-12 | 06-07 | TBD |
| 56 | unsafe-type-assertion | `views/notifications/mentions/index.tsx:99` | fix: hook ref type, cast deleted | D-10 | 06-03 | TBD |
| 57 | unsafe-type-assertion | `views/notifications/quotes/index.tsx:99` | fix: hook ref type, cast deleted | D-10 | 06-03 | TBD |
| 58 | unsafe-type-assertion | `views/notifications/replies/index.tsx:92` | fix: hook ref type, cast deleted | D-10 | 06-03 | TBD |
| 59 | unsafe-type-assertion | `views/notifications/reposts/index.tsx:98` | fix: hook ref type, cast deleted | D-10 | 06-03 | TBD |
| 60 | unsafe-type-assertion | `views/notifications/threads/index.tsx:100` | fix: hook ref type, cast deleted | D-10 | 06-03 | TBD |
| 61 | unsafe-type-assertion | `views/notifications/zaps/index.tsx:101` | fix: hook ref type, cast deleted | D-10 | 06-03 | TBD |
| 62 | ts-directive | `views/pictures/picture/media-post-comment-form.tsx:54` | fix: onPaste typed for textarea or input in useTextAreaUploadFile | D-11, D-12 | 06-07 | TBD |
| 63 | ts-directive | `views/streams/stream/stream-chat/stream-chat-form.tsx:56` | fix: onPaste typed for textarea or input in useTextAreaUploadFile | D-11, D-12 | 06-07 | TBD |
| 64 | ts-directive | `views/tools/event-console/process.ts:14` | fix: parseTimeUnit, case-insensitive units | D-18 | 06-08 | TBD |
| 65 | ts-directive | `views/tools/event-console/process.ts:21` | fix: parseTimeUnit, case-insensitive units | D-18 | 06-08 | TBD |
| 66 | ts-directive | `views/tools/event-publisher/index.tsx:263` | fix: destructure sig | D-12 | 06-08 | TBD |
| 67 | ts-directive | `views/tools/event-publisher/process.ts:83` | fix: return type UnsignedEvent & { id: string } | D-12 | 06-08 | TBD |
| 68 | ts-directive | `vite-env.d.ts:6` | delete dead directive (whole unused module block) | D-12 | 06-03 | TBD |

Per-plan tally: 06-02 19, 06-03 9, 06-04 1, 06-05 6, 06-06 4, 06-07 8, 06-08 5, 06-09 16 (= 68).

## Unflagged, in scope (D-04)

Not numbered into the 68-row table above, so that table's row count stays 68.

| File:Line | What it is | Disposition | Plan | Resolved |
|---|---|---|---|---|
| `services/debug-api.ts:52` | directive-backed removal of the debug API global | replace with Reflect.set / Reflect.deleteProperty | 06-03 | TBD |

## Expected surviving rule-scoped ignores (D-13)

Exactly three, each rule-scoped with a `-- reason` (AGENTS.md "Inline ignores", D-12):

1. The single double assertion inside the D-06 historical-schema helper `atSchema()` in `services/database/index.ts` (D-05, D-06). This is a new line, so it is not a row in the 68-row table.
2. The MagicInput TypeScript directive in `components/magic-textarea.tsx` (finding 2, D-11, D-12).
3. The vertex sort-method cast in `services/lookup/vertex.ts` (finding 38, D-17).

RESEARCH.md's count of "exactly 2" predates D-17 and is superseded by this list.

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
