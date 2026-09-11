# aislop scan report — 2026-09-11

Tool: `aislop@0.16.1` (`pnpm exec aislop scan --json .`), run at repo root on `next` @ `d18dc81a0`
(the commit that lands this plan's calibrated `.aislop/config.yml`), with the adopted
`.aislop/config.yml`.
Raw machine-readable output: [`aislop-scan-2026-09-11.json`](./aislop-scan-2026-09-11.json).

## Headline

| Metric              | Value                                    |
| ------------------- | ---------------------------------------- |
| Score               | **78 / 100** — label `Healthy`           |
| Total findings      | 1,196                                     |
| Errors / warnings   | 87 / 1,057 (+52 info)                     |
| Auto-fixable        | 284                                       |
| Files scanned       | 2,164 (`summary.files`, all under `src/`, plus `vite.config.ts`) |
| Elapsed             | 7.3s                                      |

Engine breakdown: `lint` 727 · `ai-slop` 427 · `code-quality` 30 · `security` 12 · `format` 0.

Finding assessment (aislop's own confidence buckets):

| Kind                 | Count | Errors | Warnings | Fixable |
| -------------------- | ----- | ------ | -------- | ------- |
| style / policy       | 893   | 0      | 858      | 152     |
| AI-slop indicators   | 237   | 31     | 189      | 132     |
| confirmed defects    | 66    | 56     | 10       | 0       |
| conservative security| 0     | 0      | 0        | 0       |

Confidence: 97 high, 1,099 medium, 0 low.

## Caveats before acting on this

- **These numbers are not directly comparable to `aislop-scan-2026-08-02.md`.** That scan used
  aislop 0.14.0 with bundled defaults, included vendored code, and had
  `jsx-a11y/no-autofocus` on. This scan uses aislop 0.16.1 with the adopted config: four vendored
  exclusions (`src/lib/qrcodegen.ts`, `src/lib/open-graph-scraper/**`, `src/lib/bencode/**`,
  `src/lib/fix-image-orientation/**`), `jsx-a11y/no-autofocus` off, and a rule-scoped
  `ai-slop/console-leftover` ignore in `src/sw/client/error-logger.ts`. Rule sets, engines, and
  scored file sets differ between the two runs, so score and count deltas are not a "before/after"
  measurement of the same standard.
- **The score is unweighted by importance.** The 66 "confirmed defects" (56 of them
  error-severity) are where the real risk is; most of the remaining findings are style/policy.
- **`src/services/sqlite/index.ts`'s intentional `eslint/no-unreachable` hits still count** — 6 of
  bucket C's 8 findings in that file are the deliberate dead code below a throw noted in the
  2026-08-02 report; they are not excluded or suppressed this phase.
- **Scanned scope:** no finding sits under `android/` or `ios/` in this scan (0 of 1,196) —
  confirmed those directories remain unscored (unsupported languages) under aislop 0.16.1, same as
  the 2026-08-02 scan.
- **This is a point-in-time baseline, not a CI report.** Only the changed-files gate
  (`pnpm lint:ci`) runs in CI (D-01); this whole-repo number is recorded once per D-04 for backlog
  phases 999.2–999.10 to re-measure against.

## A. React correctness — 56 findings

Backlog: 999.2

- `react-hooks/rules-of-hooks` — 48 (error:48; auto-fixable: 0)
- `react/jsx-key` — 6 (warning:6; auto-fixable: 0)
- `react/no-children-prop` — 2 (warning:2; auto-fixable: 0)

Top files:

-   8  `src/views/settings/cache/database/wasm.tsx`
-   5  `src/views/settings/accounts/components/simple-signer-backup.tsx`
-   5  `src/views/settings/accounts/components/migrate-to-device.tsx`
-   4  `src/hooks/use-user-bookmarks-list.ts`
-   3  `src/components/embed-event/card/index.tsx`
-   3  `src/components/embed-event/link/index.tsx`
-   3  `src/components/app-handler-modal/index.tsx`
-   2  `src/views/settings/accounts/components/password-signer-backup.tsx`
-   2  `src/views/notifications/threads/components/thread-group.tsx`
-   2  `src/views/messages/components/direct-message-content.tsx`
-   2  `src/components/layout/presets/app-tabs-layout.tsx`
-   2  `src/components/icons/ZoomOut.tsx`

## B. Error handling — 59 findings

Backlog: 999.3

- `ai-slop/swallowed-exception` — 31 (error:31; auto-fixable: 0)
- `eslint/no-empty` — 23 (warning:23; auto-fixable: 0)
- `ai-slop/redundant-try-catch` — 2 (warning:2; auto-fixable: 0)
- `eslint/no-async-promise-executor` — 1 (warning:1)
- `ai-slop/hidden-fallback` — 1 (warning:1)
- `ai-slop/silent-recovery` — 1 (warning:1)

Top files:

-   4  `src/components/blob-details-modal.tsx`
-   2  `src/views/settings/cache/database/components/import-events-button.tsx`
-   2  `src/services/lnurl-metadata.ts`
-   2  `src/views/settings/relays/components/relay-control.tsx`
-   2  `src/services/event-cache/index.ts`
-   2  `src/components/content/transform/nip-notation.ts`
-   2  `src/components/content/transform/bip-notation.ts`
-   2  `src/helpers/parse.ts`
-   2  `src/helpers/nip19.ts`
-   2  `src/hooks/use-open-graph-data.ts`
-   2  `src/components/app-handler-modal/index.tsx`
-   2  `src/hooks/use-cache-form.ts`

## C. Dead code — 445 findings

Backlog: 999.4

- `eslint/no-unused-vars` — 239 (warning:239; auto-fixable: 0)
- `ai-slop/unused-import` — 85 (warning:85; **auto-fixable: 85**)
- `import/no-duplicates` — 51 (warning:51; auto-fixable: 0)
- `ai-slop/duplicate-import` — 47 (warning:47; **auto-fixable: 47**)
- `eslint/no-unused-expressions` — 6 (warning:6)
- `eslint/no-unreachable` — 6 (warning:6) — includes `src/services/sqlite/index.ts`'s intentional
  dead code (see Caveats)
- `unicorn/no-useless-spread` — 2, `typescript/no-unnecessary-parameter-property-assignment` — 2
- 1 each: `eslint/no-extra-boolean-cast`, `unicorn/no-new-array`,
  `eslint/no-shadow-restricted-names`, `eslint/no-useless-rename`,
  `unicorn/no-useless-length-check`, `ai-slop/empty-function` (info), `ai-slop/unreachable-code`

Top files:

-  17  `src/views/lists/list/follow-set.tsx`
-  13  `src/components/outbox-relay-selection-modal.tsx`
-  11  `src/views/messages/inbox/components/locked-messages.tsx`
-  11  `src/views/lists/components/fallback-list-card.tsx`
-  10  `src/components/markdown/markdown.tsx`
-   9  `src/views/settings/profile/components/profile-edit-form.tsx`
-   8  `src/services/sqlite/index.ts`
-   7  `src/views/feeds/outboxes/outbox-feed.tsx`
-   6  `src/helpers/nostr/lists.ts`
-   6  `src/views/settings/display/index.tsx`
-   5  `src/components/note/note-menu.tsx`
-   5  `src/components/app-handler-modal/index.tsx`

## D. Hook dependency arrays — 175 findings

Backlog: 999.5

- `react-hooks/exhaustive-deps` — 175 (warning:175; auto-fixable: 0)

Top files:

-   6  `src/views/notifications/components/notification-counts.tsx`
-   5  `src/hooks/use-timeline-loader.ts`
-   5  `src/components/lightbox-provider.tsx`
-   5  `src/components/poll/poll-content.tsx`
-   5  `src/views/torrents/index.tsx`
-   4  `src/hooks/use-scroll-restore.ts`
-   4  `src/views/poll/components/details-tabs.tsx`
-   3  `src/providers/local/intersection-observer.tsx`
-   3  `src/hooks/use-relay-discovery.ts`
-   3  `src/hooks/use-route-state-value.ts`
-   3  `src/components/menu/quote-event.tsx`
-   3  `src/views/task-manager/provider.tsx`

Treated as its own bucket because blanket-adding deps causes render loops. Each site needs a
decision: add the dep, memoize the value, or annotate the suppression (D-08 keeps this rule at
`warning`).

## E. Type-safety escape hatches — 68 findings

Backlog: 999.6

- `ai-slop/ts-directive` — 35 (info:35) — `@ts-ignore` / `@ts-expect-error`
- `ai-slop/double-type-assertion` — 20 (warning:20) — `as unknown as X`
- `ai-slop/unsafe-type-assertion` — 13 (warning:13) — `as any`

Top files:

-  18  `src/services/database/index.ts`
-   5  `src/services/loaders.ts`
-   4  `src/providers/global/napplet-shell-provider.tsx`
-   3  `src/components/magic-textarea.tsx`
-   3  `src/hooks/use-webxdc.ts`
-   3  `src/services/wallets.ts`
-   2  `src/views/tools/event-console/process.ts`
-   1 each: `src/components/webxdc/webxdc.tsx`, `src/helpers/media-upload/nostr-build.ts`,
  `src/hooks/use-route-state-value.ts`, `src/polyfill.ts`, `src/services/dns-identity-loader.ts`

## F. Accessibility — 47 findings

Backlog: 999.7

- `jsx-a11y/prefer-tag-over-role` — 28
- `jsx-a11y/role-has-required-aria-props` — 8
- `jsx-a11y/control-has-associated-label` — 5
- `jsx-a11y/no-redundant-roles` — 2, `jsx-a11y/iframe-has-title` — 2
- `jsx-a11y/alt-text` — 1, `jsx-a11y/role-supports-aria-props` — 1
- `jsx-a11y/no-autofocus` — **0** (D-06 turned this rule off; the 25 hits from the 2026-08-02 scan
  no longer fire)

Top files:

-  10  `src/components/magic-textarea.tsx`
-   5  `src/components/relay-url-input.tsx`
-   5  `src/views/settings/privacy/index.tsx`
-   5  `src/views/articles/article.tsx`
-   4  `src/components/loading-nostr-link.tsx`
-   2  `src/components/compact-note-content.tsx`
-   2  `src/views/articles/components/article-tags.tsx`
-   2  `src/components/layout/desktop/side-nav.tsx`
-   1 each: `src/components/user/user-avatar.tsx`, `src/components/content/links/music.tsx`,
  `src/views/articles/components/article-card.tsx`, `src/components/invoice-modal.tsx`

## G. Comment & log noise — 155 findings

Backlog: 999.8

- `ai-slop/trivial-comment` — 115 (warning:115; **auto-fixable: 115**)
- `ai-slop/narrative-comment` — 21 (warning:21; **auto-fixable: 21**)
- `ai-slop/console-leftover` — 16 (warning:16; **auto-fixable: 16**)
- `ai-slop/meta-comment` — 3 (warning:3)

Top files:

-  15  `src/sw/worker/cache.ts`
-  10  `src/classes/encrypted-storage.tsx`
-   9  `src/sw/worker/error-handler.ts`
-   9  `src/sw/worker/sw.ts`
-   8  `src/services/event-cache/native-sqlite.ts`
-   8  `src/components/webxdc/webxdc.tsx`
-   6  `src/services/wallets.ts`
-   5  `src/index.tsx`
-   5  `src/services/outbox-cache.ts`
-   4  `src/sw/client/cache.ts`
-   3  `src/services/accounts.ts`
-   3  `src/services/cron.ts`

`src/sw/client/error-logger.ts` no longer appears in this bucket's top files (11 hits in the
2026-08-02 scan) — its file-level `aislop-ignore-file ai-slop/console-leftover` directive (D-11)
suppresses that rule there; other rules still apply to the file per D-11/D-12.

## H. Complexity & duplication — 32 findings

Backlog: 999.9

- `code-quality/duplicate-block` — 21
- `complexity/function-too-long` — 7
- `complexity/file-too-large` — 2
- `ai-slop/thin-wrapper` — 2

Top files:

-   5  `src/helpers/nostr/torrents.ts`
-   2 each: `src/providers/global/napplet-shell-provider.tsx`,
  `src/services/notifications/common.ts`, `src/views/articles/components/article-reader.tsx`,
  `src/views/notifications/index.tsx`, `src/views/settings/background-worker/cached-files-card.tsx`

## I. Incomplete work & hardcoded config — 33 findings

Backlog: 999.10

- `ai-slop/hardcoded-url` — 17
- `ai-slop/todo-stub` — 16 (info:16)

Top files:

-   3  `src/views/settings/media-servers/index.tsx`
-   2  `src/components/event-zap-modal/index.tsx`
-   2  `src/components/content/links/youtube.tsx`
-   2  `src/views/user/tabs/advanced/nip-05.tsx`
-   1 each: `src/components/county-picker.tsx`, `src/components/icons.tsx`,
  `src/components/post-modal/index.tsx`, `src/components/timeline/note/components/share-modal.tsx`,
  `src/const.ts`, `src/helpers/nostr/list-history.ts`, `src/hooks/use-cache-form.ts`,
  `src/services/accounts.ts`, and others

## J. Other rules — 126 findings

Not part of the 2026-08-02 report's bucket taxonomy — new rule categories introduced (or newly
enabled) between aislop 0.14.0 and 0.16.1, plus the `security` engine's first non-zero findings:

- `react/refs` — 31, `react/set-state-in-effect` — 23, `react/error-boundaries` — 17,
  `react/incompatible-library` — 16, `react/use-memo` — 9, `react/preserve-manual-memoization` — 8,
  `react/immutability` — 5, `react/purity` — 4, `react/static-components` — 1
- `security/vulnerable-dependency` — 12 (error:8; warning:4) — dependency-audit findings against
  `package.json`, the same rule and finding set exercised by sample `844122a7e` and the
  `origin/master` / `gh/master` data points in the CI gate calibration section below.

Top files:

-  14  `src/components/debug-modal/event-tags.tsx`
-  12  `package.json`
-  11  `src/providers/global/napplet-shell-provider.tsx`
-   5  `src/hooks/use-route-state-value.ts`
-   3  `src/hooks/use-cache-form.ts`
-   3  `src/components/markdown/markdown.tsx`
-   3  `src/views/new/poll/poll-form.tsx`
-   2 each: `src/hooks/use-async-action.ts`, `src/hooks/use-route-search-value.ts`,
  `src/providers/local/intersection-observer.tsx`, `src/hooks/timeline/use-min-number.ts`,
  `src/hooks/use-relay-discovery.ts`

## CI gate calibration

### Method

Per D-02, `ci.failBelow` is set from measured `aislop ci --changes` scores on nine real commits,
not picked up front. All measurements ran in disposable, detached git worktrees so the main
checkout's `HEAD`, branches, and remotes were never touched:

1. For each sample commit `C`, create a detached worktree at `C`'s parent (`git worktree add
   --detach "$WT" C^`) under a `mktemp -d` directory, and symlink the main checkout's
   `node_modules` into it.
2. Copy the committed `.aislop/config.yml` into the worktree and commit it as `calibration-base`
   (`commit.gpgsign=false`, local-only author). This commit is `BASE`.
3. `git cherry-pick C` on top of `BASE`. `HEAD` vs `BASE` is now exactly `C`'s change, scored under
   the adopted config, tracked and unchanged.
4. From inside the worktree, run `aislop ci --changes --base "$BASE" --format json`, capturing the
   score, diagnostics, and exit code.
5. `git worktree remove --force "$WT"`, then `git worktree prune` once all samples are done.

No cherry-pick conflicted; all nine samples measured cleanly. No security-engine (dependency
audit) error-severity finding appeared on any sample that doesn't touch `package.json` or
`pnpm-lock.yaml` — the gate-risk stop condition did not trigger, so calibration proceeded.

### Results

| SHA | Subject | Files scored | Score | Errors | Warnings | Error rules (context) | Passes at failBelow 95 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `774a08dfc` | fix: request list_transactions permission in NWC auth URI | 2164 | 100 | 0 | 1 | — | Yes |
| `a8cce223b` | fix(signin): disambiguate ncryptsec prompt as re-entry | 2164 | 100 | 0 | 0 | — | Yes |
| `2af456d3f` | feat: napplet history filter helper and hook | 2154 | 100 | 0 | 0 | — | Yes |
| `770b031f5` | feat: napplet version history drawer | 2155 | 100 | 0 | 0 | — | Yes |
| `82fefe8eb` | feat(01-06): MutedUserCard and Private mutes section | 2164 | 100 | 0 | 0 | — | Yes |
| `47e98ab64` | Fix mute filtering in notifications | 2153 | 100 | 0 | 7 | — | Yes |
| `1a4f05493` | feat(01-03): register pending-unlock categories | 2159 | 100 | 1 | 7 | `ai-slop/swallowed-exception` in `src/index.tsx` (existing-file-context) | **No** (error present) |
| `79ce9cb96` | refactor(01-02): mute menu item | 2156 | 100 | 0 | 0 | — | Yes |
| `844122a7e` | chore: noble/scure v2 | 2153 | 98 | 10 | 15 | `ai-slop/swallowed-exception` x2 in `src/components/blob-details-modal.tsx` (existing-file-context); `security/vulnerable-dependency` x8 on `package.json` (changeContext unknown — project-wide audit surfaced because the diff touches `package.json`/`pnpm-lock.yaml`) | **No** (errors present) |

A sample "passes" when its score is at or above the chosen `failBelow` (95) **and** it has zero
error-severity diagnostics — `aislop ci` fails a diff on any error-severity finding regardless of
score (RESEARCH Pitfall 1), and this was reproduced here: `1a4f05493` and `844122a7e` both scored
at or above 95 yet exited non-zero solely because of error-severity diagnostics.

### Selection rule and chosen value

Selection rule (D-02 — "just under what typical changes already score"):

1. Take the scores of all nine measured samples: `100, 100, 100, 100, 100, 100, 100, 100, 98`.
2. Lowest score is 98; second-lowest is 100. `100 - 98 = 2`, which is not at least 15 points, so
   no outlier is set aside.
3. Typical floor = lowest remaining score = **98**.
4. `failBelow` = the largest multiple of 5 strictly below the floor: largest multiple of 5 below
   98 is **95**.

**Chosen `ci.failBelow`: 95**, recorded in `.aislop/config.yml` with a trailing
`# calibrated 2026-09-11 …` comment naming this file.

### Note (2026-09-11, post code review): the score is diluted

Code review (`02-REVIEW.md` WR-04) found that `failBelow` barely constrains a diff. In `--changes`
mode aislop 0.16.1 still counts every project source and test file when scoring
(`collectScanFileScope`), which is why "Files scored" above shows 2153–2164 for single-commit
diffs. Deductions are divided by that count, so every sample scored 98–100 and the 80-file `next`
diff with 9 errors and 37 warnings still scored 97. These scores measure dilution, not typical
change quality, and the threshold weakens as the repo grows.

`failBelow: 95` is kept as a backstop only, and the trailing `# calibrated …` comment was replaced
with one saying so. The effective gate is "no error-severity findings in touched files". Making
warnings ratchet would need a different mechanism and a new decision.

### Inherited-error failures (score-independent, per RESEARCH Pitfall 1)

Two of the nine samples exit non-zero under `failBelow: 95` despite scoring at or above it,
purely because of error-severity findings:

- **`1a4f05493`** fails **only** because of an inherited error: `ai-slop/swallowed-exception` in
  `src/index.tsx`, a pre-existing finding in a file the commit merely touches
  (`changeContext: existing-file-context`). This is expected day-one ratchet friction, not a
  misconfiguration (D-01's rationale) — it is not tuned away (D-05/D-09).
- **`844122a7e`** fails from a **mix**: two inherited `ai-slop/swallowed-exception` errors in
  `src/components/blob-details-modal.tsx` (existing-file-context, matching the 2026-08-02 baseline)
  **plus** eight `security/vulnerable-dependency` errors on `package.json`. The dependency findings
  are a project-wide audit surfaced specifically because this commit's diff touches
  `package.json`/`pnpm-lock.yaml` (`changeContext: unknown`, not tied to a diff line) — expected
  audit behavior on manifest changes, not an inherited legacy-file finding in the same sense as
  the swallowed-exception errors, and not the gate-risk scenario (that scenario is a
  non-manifest-touching sample surfacing project-wide audit findings, which did not occur here).

Count of samples failing **only** on inherited (existing-file-context) errors: **1**
(`1a4f05493`, `src/index.tsx`). One additional sample (`844122a7e`) fails on a mix of inherited
errors and dependency-audit findings triggered by its own manifest changes.

### Long-lived-branch data points (recorded, not used in the selection rule — RESEARCH Pitfall 8)

Both measured from the main checkout's `HEAD` (`76e0c53af`, branch `next`) before any file in
this plan was edited, using the same `ci --changes --base` mechanism as the CI gate. These
diffs are 40+ commits of Phase 1 + Phase 2 history, not a single feature's diff, so they are kept
out of the selection rule per RESEARCH Pitfall 8; they instead answer "what does this branch's
first real CI run look like":

| Base | Files changed | Score | Errors | Warnings | Exit code |
| --- | --- | --- | --- | --- | --- |
| `origin/master` (ngit remote, local `origin/master` = `c34ae32`) | 66 | 97 | 9 | 34 | 1 |
| `gh/master` (GitHub remote, local `gh/master` = `38f0eb9`) | 80 | 97 | 9 | 37 | 1 |

Both fail for the same reason as the samples above: one inherited `ai-slop/swallowed-exception`
error in `src/index.tsx` plus eight `security/vulnerable-dependency` errors on `package.json`
(the same dependency-audit findings as `844122a7e`, since that commit is part of `next`'s history
relative to both `master` bases). This is the **expected first CI result** for this branch on
both bases — recorded here per the plan, not fed into the `failBelow` calibration. `gh/master`'s
figure (score 97, exit 1) is what the plan 02-02 end-of-phase human check should compare against
when this branch is pushed to GitHub.

Worktree/branch hygiene: `git worktree list` shows only the main checkout both before and after
calibration, and `git branch --list` (`master`, `next` current) is unchanged. No worktree or
branch was left behind, and nothing was pushed.

## Reproducing

```sh
pnpm lint                      # human-readable full scan
pnpm exec aislop scan --json . # what produced the JSON above
pnpm lint:ci                   # the CI gate (changed files vs origin/master)
pnpm exec aislop rules         # explain every rule
```
