# aislop scan report — 2026-09-11

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
