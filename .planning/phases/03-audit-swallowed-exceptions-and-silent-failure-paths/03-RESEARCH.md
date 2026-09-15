# Phase 3: Audit swallowed exceptions and silent failure paths - Research

**Researched:** 2026-09-14
**Domain:** Error-handling audit against an installed lint gate (aislop 0.16.1); no new libraries, no new architecture — code-shape remediation of 33 existing files
**Confidence:** HIGH (every count and probe claim below was re-measured live against the installed toolchain and the actual repo, not carried over from the baseline doc)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope & completion**

- **D-01:** Done means zero bucket-B error-severity findings in `src/` — all 31 `ai-slop/swallowed-exception` plus the 1 `ai-slop/silent-recovery`. Warning-severity findings may remain where the decision was deliberate. This is the bar because an error-severity finding in a touched file is what actually fails `pnpm lint:ci` (Phase 2 D-01, `AGENTS.md` §Linting); Phase 2's calibration showed two of nine sampled commits failing purely on inherited bucket-B errors. Explicitly rejected: clearing all 59 findings including warnings, and "every site triaged" with the count as a mere outcome. **Correction from live measurement below: `ai-slop/silent-recovery` is warning-severity, not error-severity — see Baseline Re-Measurement.**
- **D-02:** Two waves, risk first. Wave 1 is the decryption/signer set where a swallowed error hides a user-facing failure: `classes/encrypted-storage.tsx:171`, `services/decryption-cache.ts:95`, `helpers/nostr/dms.ts:31`, `components/blob-details-modal.tsx:146/153`, `views/messages/chat/components/decrypt-placeholder.tsx:23`. Wave 2 is everything else. Explicitly rejected: grouping by remedy, and grouping by directory — both spread the risky sites across several commits.
- **D-03:** The convention is written into `AGENTS.md` §Error Handling, following the Phase 2 precedent of documenting its own convention there (D-12 inline ignores). It states when an empty catch is legitimate and how to write it, when to surface via `useAsyncAction`, and which logger services use.
- **D-04:** Verification is a scoped rescan only — rerun the scan and show the bucket-B error count going 32 → 0 with a per-file before/after table. No manual UAT wave and no new test framework. Explicitly rejected: adding vitest for the pure helpers (its own phase), and a manual UAT pass over the decryption paths.

**How a deliberate guard is written**

- **D-05:** The default treatment for a genuine parse guard is an explicit return plus a reason comment:
  ```ts
  catch {
    // <what failed and why discarding it is safe>
    return undefined;
  }
  ```
  Measured (see Probe Re-Verification below — reproduced live): a comment alone does **not** clear `ai-slop/swallowed-exception`; an explicit return does. Explicitly rejected: narrowing the catch and rethrowing unexpected errors (fully clean, but demands a per-site judgment about which error type is expected and risks throwing from paths that never throw today), and defaulting to an inline ignore.
- **D-06:** Where the caught binding is unused, use bare `catch {`, so files this phase touches carry no `no-unused-vars` residue into future PRs. This reaches into Phase 4's bucket, but only on lines already being rewritten.
- **D-07:** A rule-scoped `aislop-ignore-*` is a last resort, allowed only where the catch genuinely cannot return a value or log, and its `-- reason` must justify why the code could not be fixed instead — not merely that the guard is deliberate. Explicitly rejected: banning ignores outright, and treating ignores as equal-standing with the explicit-return fix.
- **D-08:** Reason comments are free-form but must name what failed and why discarding it is safe (typically what the caller does with the absent value). No fixed prefix or template. Explicitly rejected: a greppable marker convention, and requiring only that some comment exist.

**How failures reach the user**

- **D-09:** For a swallowed error in a user-triggered action, the default is to delete the local try/catch, convert the handler to `useAsyncAction`, and let the error throw — the hook toasts `e.message` and logs it. This is the pattern `AGENTS.md` already marks REQUIRED. Applies to `components/cashu/mint-control.tsx:28` and `views/settings/relays/components/relay-control.tsx:27` (both hand-roll their own `loading` state beside the empty catch — `useAsyncAction`'s `loading` replaces it) and `views/settings/cache/components/enable-with-delete.tsx:32`. Explicitly rejected: inline `useToast` at the catch site, and per-site judgment with no default.
- **D-10:** Deliberate best-effort fallbacks log the cause and stay silent to the user — the fallback itself is the handling. Applies to `providers/route/invoice-modal-provider.tsx:34` (WebLN fails → manual modal), `components/event-zap-modal/pay-step.tsx:171` (per-invoice failure → leave for manual payment), `components/blob-details-modal.tsx:146/153` (per-server download fails → try the next), and `components/qr-code/qr-code-scanner-button.tsx:48` (user cancel). UX is unchanged; the cause becomes recoverable when someone investigates. Explicitly rejected: comment-only with nothing logged, and restructuring so the terminal error carries the last attempt's cause.
- **D-11:** `decrypt-placeholder.tsx:23` uses the hook's existing `error` state. Verified during discussion (and confirmed again by direct source read below): `hooks/use-legacy-message-plaintext.ts` already try/catches inside `unlock()` and sets `error`, so it never throws — the component's `try { await unlock() } catch {}` is catching an error that cannot arrive. The fix is to delete the try/catch and render the `error` the component already destructures, not to add a toast.

**Logging channel & strays**

- **D-12:** Logging uses the namespaced debug logger — `logger.extend("<Module>")` from `src/helpers/debug.ts`, already the services pattern (`services/event-cache/index.ts`, `components/qr-code/native-scanner.ts`). It is silent in production unless the namespace is enabled and does not trip `ai-slop/console-leftover`, which Phase 2 (D-07) kept on. Explicitly rejected: `console.warn`/`console.error` (adds bucket-G findings), and a split policy by failure kind.
- **D-13:** The four warning-severity strays are in scope — same audit, bounded set, and finishing them closes bucket B rather than leaving the awkward remainder. Note `services/sqlite/index.ts` is also touched by Phase 4 (its deliberate dead code below a `throw`); the two phases must not fight over that file. **See Shared-File Collision below for the exact non-overlapping line ranges.**
- **D-14:** `hooks/timeline/use-timeline-cache-key.ts:14` is a false positive — `return cacheKey || fallback` returns a stable `nanoid` for the first render until the effect writes it into route state; nothing is failing. Keep the code and add a rule-scoped ignore whose reason says exactly that. This is the D-07 last-resort case.
- **D-15:** `src/index.tsx:49` (the lone `silent-recovery`) logs via the namespaced logger, including the caught error. Registering the `web+nostr` protocol handler is genuinely optional, so no user-facing surfacing is warranted. Removes a `console-leftover` finding from bucket G in passing. Explicitly rejected: `console.error` with the cause, and dropping the log entirely. **Live read of `src/index.tsx:49` (below) also found an `eslint/no-unused-vars` finding on the same catch binding — D-06's bare-catch cleanup applies here too, in passing.**

### Claude's Discretion

None — the user selected a concrete option for every question. No "you decide" answers.

### Deferred Ideas (OUT OF SCOPE)

- Surfacing import-events-button's dropped lines — the importer reports `Imported N events` while silently discarding unparseable ones. Making the count honest (or reporting skipped lines) is a UX change beyond clearing the finding; noted, not scoped here.
- `encrypted-storage.tsx`'s wider error story — `.planning/codebase/CONCERNS.md` flags AES-CBC without authentication and a 10,000-iteration PBKDF2. D-01 clears the swallowed error at :171; the crypto weaknesses it partly masks are a separate security item.
- Event-cache write failures never reaching callers — `CONCERNS.md` calls this out as a fragile area. This phase logs the fallback-loading failure (D-12); surfacing buffered write failures is a design change.
- Adding a test framework — considered as verification for this phase and rejected (D-04).

</user_constraints>

<phase_requirements>
## Phase Requirements

No `REQUIREMENTS.md` exists for this project; the requirement set is the 15 locked decisions in `03-CONTEXT.md` (D-01 through D-15). All 15 were re-verified against the live repo and current aislop config during this research pass; none needed to be revised, but two factual corrections surfaced (see Baseline Re-Measurement and Probe Re-Verification) that the planner should carry into task wording.

| ID | Description | Research Support |
|----|-------------|-------------------|
| D-01 | Done = zero bucket-B error-severity findings | Live rescan confirms exactly 31 error-severity findings today (all `ai-slop/swallowed-exception`); `silent-recovery` is warning-severity, not part of the error count — see correction below |
| D-02 | Two waves, risk first, 5 named Wave-1 files | All 5 sites read from source; call-site mechanics documented below for each |
| D-03 | AGENTS.md §Error Handling gets the convention | Section exists today (lines 114-130 of `AGENTS.md`); exact insertion point identified |
| D-04 | Scoped rescan is the only verification | Exact jq-based rescan command built and tested live — see Validation Architecture |
| D-05 | Comment + explicit return for parse guards | Reproduced live: comment-only still fires, comment+return clears — confirmed on a disposable in-repo probe file, deleted after |
| D-06 | Bare `catch {` when binding unused | No new evidence needed; mechanical |
| D-07 | Rule-scoped ignore as last resort | Reproduced live; also found the ignore-directive placement rule is more forgiving than CONTEXT.md described — see Probe Re-Verification |
| D-08 | Free-form reason comments naming failure + caller behavior | No new evidence needed; documented per-site below |
| D-09 | `useAsyncAction` conversion for 3 named sites | All 3 read from source; confirmed mechanical, no markup changes required — see Wave-2 D-09 Site Mechanics |
| D-10 | Best-effort fallbacks log and stay silent | All 4 named sites read from source; confirmed shape matches D-10 exactly |
| D-11 | `decrypt-placeholder.tsx` uses hook's existing `error` state | Confirmed by reading `use-legacy-message-plaintext.ts`: `unlock()` never rejects, the outer try/catch is unreachable dead code |
| D-12 | Namespaced logger convention | Confirmed pattern and import path; exact code shown below |
| D-13 | Four warning-severity strays in scope | All 4 confirmed still present at the same lines; one (`native-scanner.ts:15`) is a real refactor, not a one-line fix — see below |
| D-14 | `use-timeline-cache-key.ts:14` false positive, rule-scoped ignore | Confirmed still firing at line 14, code unchanged since baseline |
| D-15 | `index.tsx:49` logs via namespaced logger including the error | Confirmed still firing; also carries an uncounted `eslint/no-unused-vars` on the same line, fixed for free by D-06 |

</phase_requirements>

## Summary

This phase has no new stack to learn — it is a mechanical-plus-judgment audit of 33 already-identified files against the aislop config Phase 2 adopted. The single most useful thing this research pass did was **not trust the CONTEXT.md baseline and probe table at face value, and re-measure both against the live repo and the live `aislop@0.16.1` binary.** Two corrections came out of that:

1. **D-01's arithmetic is imprecise but its intent is sound.** `ai-slop/silent-recovery` is warning-severity (confirmed via `aislop rules` and the raw scan JSON), not error-severity. The actual "done" bar is exactly **31 error-severity findings, all `ai-slop/swallowed-exception`, across 30 files** — not "32 across 33." The 33-file, 59-finding, 28-warning scope in the Phase Boundary is otherwise exactly right and unchanged from the baseline: nothing has drifted since the 2026-09-11 scan (no commits have touched any of the 33 files since). D-15's remedy still needs to apply at `index.tsx:49` regardless — it's simply a warning-severity fix bundled with an adjacent error-severity fix on the same line, not two separate severity-error obligations.

2. **The `aislop-ignore-file` placement trap in CONTEXT.md's probe table does not hold.** Live testing (three separate constructed probe files, all deleted after) shows `aislop-ignore-file` suppresses the named rule for the **entire file regardless of where the directive line sits** — top, middle, or literally the last line of the file all worked identically. What *is* real is the `aislop-ignore-next-line`/`aislop-ignore-line` positioning rule: the directive must be the line immediately preceding (or, for `-line`, trailing on) the exact diagnostic line — a comment earlier in the `try` block (e.g., right after `try {`) does not suppress, but a comment on the line directly before `} catch` does, even when `catch` sits on its own line separate from the `try`'s closing brace. This doesn't change any decision (D-07's ignore is still last-resort, still needs rule+reason), but it means the planner doesn't need to worry about *where* a file-level ignore sits if one is ever added.

Everything else CONTEXT.md determined holds up under direct source reading: all five Wave-1 sites, all three D-09 conversion targets, all four D-13 strays, and the D-14/D-15 stray fixes are exactly the shape described. One D-13 stray (`native-scanner.ts:15`, `no-async-promise-executor`) is **not a one-line fix** — the async executor `await`s inside itself to capture a listener handle it needs later in the same callback, so removing `async` from the executor requires hoisting the listener registration outside the `Promise` constructor. This is the one site in the whole phase that is a small real refactor rather than a mechanical rewrite.

**Primary recommendation:** Plan Wave 1 as five source-read-and-fix tasks (already scoped above), Wave 2 as one task per remedy category (D-05 parse guards, D-09 conversions, D-10 fallbacks, D-12 services, D-13/14/15 strays), and gate every task's `<verify>` on the jq-filtered rescan command built and tested below — not on `pnpm lint` (always exits 1) and not on `pnpm lint:ci` (diff-scoped, wrong tool for a whole-bucket audit).

## Architectural Responsibility Map

noStrudel is a client-only SPA; there is no separate backend tier for this phase to reason about. The relevant tiers are all inside the browser process.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Parse/filter guards (URL, nip19, event tags, JSON lines) | Browser / Client (`helpers/`) | — | Pure functions; no I/O, no user-facing surface, failure = "treat as absent" |
| Decryption unlock (cache password, legacy DM, signer) | Browser / Client (`classes/`, `services/`, `hooks/`) | — | All crypto runs client-side (Web Crypto / noble libs); "user-facing failure" means the failure must reach a component, not a server |
| User-triggered remove/enable/wipe actions | Browser / Client (component event handlers) | — | `useAsyncAction` is a React hook; toast surfacing happens entirely in the render tree |
| Best-effort fallback loops (blob repair, WebLN pay, event-cache backend selection) | Browser / Client (`services/`, `components/`) | Storage (IndexedDB via localforage/idb, for event-cache) | The fallback logic and the storage it falls back between are both client-side; "log and continue" is a client-side logging concern, not a server log |
| Logging channel | Browser / Client (`helpers/debug.ts`, the `debug` npm package) | — | `debug()` writes to the browser console gated by `localStorage`/`DEBUG` namespace enablement; nothing leaves the client |

No capability in this phase touches a server tier, a CDN, or a database in the traditional sense — "Database / Storage" here is IndexedDB/localforage running in the browser.

## Baseline Re-Measurement (Priority Question 1)

**Method:** `pnpm exec aislop scan --json .` run live against the current `next` HEAD (no code changes made — findings and lines below are exactly what today's repo produces). Diagnostics filtered by the six bucket-B rule names via `jq`/`python3` post-processing (aislop's `scan` CLI has no built-in rule filter — see Rescan Command below for the exact filter).

**Result: zero drift.** Every rule, every line number, and every file in the 2026-09-11 baseline (`.planning/research/aislop-scan-2026-09-11.{md,json}`) reproduces identically today:

- 59 total bucket-B findings, unchanged
- 31 × `ai-slop/swallowed-exception` (error), unchanged lines
- 23 × `eslint/no-empty` (warning), unchanged lines
- 2 × `ai-slop/redundant-try-catch` (warning) — `services/sqlite/index.ts:39,54`
- 1 × `eslint/no-async-promise-executor` (warning) — `components/qr-code/native-scanner.ts:15`
- 1 × `ai-slop/hidden-fallback` (warning) — `hooks/timeline/use-timeline-cache-key.ts:14`
- 1 × `ai-slop/silent-recovery` (**warning**, not error — see correction) — `src/index.tsx:49`
- 33 distinct files, unchanged

This makes sense: `git log` shows nothing has landed on `next` since the 09-11 baseline besides `.planning/` docs and backlog captures (no `src/` commits). The "before" table for D-04 can therefore use the baseline JSON directly, or re-derive it fresh with the command below — both give the same numbers.

**Correction to carry into planning:** the true error-severity target is **31 findings across 30 files** (not "32 across 33" as D-01's prose states). `blob-details-modal.tsx` has 2 error-severity findings (both `swallowed-exception`, lines 146/153) and `index.tsx` has 1 error-severity finding (`swallowed-exception`) plus 1 warning-severity finding (`silent-recovery`) on the same line 49 — so 31 errors land across 30 distinct files (33 total files minus the 3 files that don't carry an error: none of the 4 warning-severity-only strays overlap with an error-carrying file except `index.tsx`, which does carry one). D-15's fix at `index.tsx:49` still clears both the error and the warning in one edit, so this correction changes nothing about task scope — it only changes what number the per-file "before" column and the phase-gate assertion should show.

**Unrelated drift, not in scope:** the whole-repo score moved from 78 to 79 and total error count from 87 to 79 between the recorded baseline and today, entirely due to `security/vulnerable-dependency` (bucket J, not bucket B): baseline showed 8 error + 4 warning, today shows 0 error + 12 warning, despite `.aislop/config.yml` downgrading that rule to `warning` in both cases — the rule's individual-finding severity appears to track the npm advisory's own CVE severity independent of the rule-level config override, and that advisory data can shift day to day. This is noise for Phase 3's purposes; do not let it appear in the D-04 before/after table (scope that table to the six bucket-B rule names only, which is what the rescan command below already does).

### Full per-file bucket-B breakdown (today, "before")

| File | Line(s) | Rule(s) | Error count | Wave / Remedy |
|------|---------|---------|--------------|----------------|
| `src/classes/encrypted-storage.tsx` | 171 | `swallowed-exception` | 1 | Wave 1 |
| `src/services/decryption-cache.ts` | 95 | `swallowed-exception` | 1 | Wave 1 |
| `src/helpers/nostr/dms.ts` | 31 | `swallowed-exception`, `no-empty` | 1 | Wave 1 |
| `src/components/blob-details-modal.tsx` | 146, 153 | `swallowed-exception` ×2, `no-empty` ×2 | 2 | Wave 1 (D-10 remedy) |
| `src/views/messages/chat/components/decrypt-placeholder.tsx` | 23 | `swallowed-exception`, `no-empty` | 1 | Wave 1 (D-11 remedy — delete the catch) |
| `src/helpers/parse.ts` | 4 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/helpers/nip19.ts` | 11 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/components/content/transform/bip-notation.ts` | 42 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/components/content/transform/nip-notation.ts` | 42 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/helpers/nostr/goal.ts` | 105 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/services/lnurl-metadata.ts` | 31 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/hooks/use-open-graph-data.ts` | 34 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/hooks/use-cache-form.ts` | 48 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/views/tools/event-publisher/index.tsx` | 74 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/components/debug-modal/event-tags.tsx` | 74 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/components/lightning/inline-invoice-card.tsx` | 32 | `swallowed-exception` (no `no-empty` — see note) | 1 | Wave 2, D-05 |
| `src/views/lists/components/list-history-modal.tsx` | 319 | `swallowed-exception` (no `no-empty`) | 1 | Wave 2, D-05 |
| `src/views/wallet/components/receive-token-modal.tsx` | 36 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 |
| `src/views/streams/stream/components/stream-top-zappers.tsx` | 19 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 (reclassified) |
| `src/components/app-handler-modal/index.tsx` | 138 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 (reclassified) |
| `src/components/relay-url-input.tsx` | 62 | `swallowed-exception` (already commented, no `no-empty`) | 1 | Wave 2, D-05 (reclassified — needs explicit `return` even though a comment already exists) |
| `src/views/settings/cache/database/components/import-events-button.tsx` | 22 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-05 (reclassified) |
| `src/components/cashu/mint-control.tsx` | 28 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-09 |
| `src/views/settings/relays/components/relay-control.tsx` | 27 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-09 |
| `src/views/settings/cache/components/enable-with-delete.tsx` | 32 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-09 |
| `src/providers/route/invoice-modal-provider.tsx` | 34 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-10 |
| `src/components/qr-code/qr-code-scanner-button.tsx` | 48 | `swallowed-exception` (already commented, no `no-empty`) | 1 | Wave 2, D-10 |
| `src/services/event-cache/index.ts` | 40 | `swallowed-exception`, `no-empty` | 1 | Wave 2, D-12 |
| `src/services/sqlite/index.ts` | 39, 54 | `redundant-try-catch` ×2 | 0 | Wave 2, D-13 stray |
| `src/components/qr-code/native-scanner.ts` | 15 | `no-async-promise-executor` | 0 | Wave 2, D-13 stray (real refactor, see below) |
| `src/hooks/timeline/use-timeline-cache-key.ts` | 14 | `hidden-fallback` | 0 | Wave 2, D-14 stray (rule-scoped ignore) |
| `src/index.tsx` | 49 | `swallowed-exception` (error), `silent-recovery` (warning), `no-unused-vars` (warning, uncounted in bucket B) | 1 | Wave 2, D-15 stray |

**Total: 31 error-severity findings, 30 files carrying at least one error (`blob-details-modal.tsx` carries 2 of the 31).**

## Rescan Command (Priority Question 2)

`aislop scan --help` confirms the CLI has **no built-in rule or severity filter** — flags are `--changes`, `--staged`, `--base`, `--json`, `--sarif`, `--format`, `--include`, `--exclude`. There is no `--rule` flag on `scan`, `ci`, or any subcommand (`aislop commands` lists every flag on every command; none filter by rule name). The precise, load-bearing rescan mechanism is therefore: **full JSON scan, `jq`-filtered to the six bucket-B rule names.** `jq` is available on this system (`jq-1.6`) and needs no new dependency.

Tested live, both forms below produce output in well under 10 seconds (whole-repo scan measured at 8.7s elapsed, 2164 files).

**Quick form — single number, for a per-task `<verify>` block (asserts `== 0` when a task's target file is clear, or reports the running total):**

```bash
pnpm exec aislop scan --json . 2>/dev/null | jq \
  '[.diagnostics[] | select((.rule=="ai-slop/swallowed-exception" or .rule=="ai-slop/silent-recovery") and .severity=="error")] | length'
```

Tested output today: `31`. At phase completion this must read `0`.

**Full form — per-file bucket-B table, for the D-04 before/after report:**

```bash
pnpm exec aislop scan --json . 2>/dev/null | jq '
  [.diagnostics[] | select(.rule as $r |
    ["ai-slop/swallowed-exception","eslint/no-empty","ai-slop/redundant-try-catch",
     "eslint/no-async-promise-executor","ai-slop/hidden-fallback","ai-slop/silent-recovery"]
    | index($r))]
  | group_by(.filePath)
  | map({file: .[0].filePath, total: length, errors: ([.[] | select(.severity=="error")] | length)})
  | sort_by(-.errors, -.total)
'
```

Tested output today reproduces exactly the per-file table above (33 files, 31 total errors).

**Critical pitfall confirmed by direct test:** `pnpm exec aislop scan --json .` **exits 1** even though it ran successfully, because (per `AGENTS.md` §Linting) `pnpm lint`/bare `aislop scan` always exits non-zero while any finding exists anywhere in the repo — always true here. A plan's `<verify>` block must pipe stdout to `jq` and assert on the **jq output**, not on the scan command's own exit code. Always redirect stderr (`2>/dev/null`) — no stderr was observed in testing, but the CLI does print interactive-menu framing to stderr in some code paths per its own docs, so don't rely on that being empty in every environment.

**Scoping alternative (not recommended for the phase-gate, useful for a single-file spot-check):** `--include <path>` restricts the scanned file set (`aislop scan --json --include src/helpers/parse.ts .`), confirmed working, but it still always pulls in a `security/vulnerable-dependency` audit against `package.json` (12 extra findings, all bucket-J noise) — filter those out with the same `jq` rule-name filter if using `--include`. The whole-repo form above is simpler and just as fast, so prefer it for the phase-gate assertion; use `--include` only for ad hoc spot-checks while writing a single task.

**Side-effect hygiene, confirmed:** `.aislop/history.jsonl`, `.aislop/session.jsonl`, and `.aislop/baseline.json` are all gitignored (confirmed via `git status --short .aislop/` showing nothing after multiple scan runs) — the rescan command is safe to run repeatedly with no cleanup step.

## Probe Re-Verification (Priority Question 3)

All probes below were run against disposable files created inside `src/` (required — aislop only scores files under its configured scope, and `--include` needs a real path in that scope), scanned with `--include <path> .`, then deleted. `git status --short` confirmed clean before and after each probe; nothing was left behind.

| Remedy | `swallowed-exception` fires? | Confirms |
|---|---|---|
| Bare `catch (e) {}` | **Fires** (error) | D-05 baseline case, unchanged |
| Comment only in catch body | **Still fires** (error) | D-05's core claim — comment alone is not enough |
| Comment + `return undefined` (or any explicit return) | **Cleared** | D-05's remedy works exactly as specified |
| Narrowed catch, rethrows unexpected error type | **Cleared, no residue at all** | D-05's rejected alternative would have worked too, just costs more judgment per site |
| `aislop-ignore-next-line <rule> -- reason` on the line immediately before the line carrying `} catch` (even when `catch` is split onto its own line, separate from `try`'s closing `}`) | **Cleared** | D-07's remedy works |
| Same directive placed earlier inside the `try` body (e.g., right after `try {`, several lines before the catch) | **Does NOT clear** | Confirms the real trap: the directive must be adjacent to the diagnostic's own line, not merely "inside the try/catch construct" |
| `aislop-ignore-line <rule> -- reason` as a trailing same-line comment on the `} catch (e) {}` line itself | **Cleared** | A same-line trailing ignore works too — CONTEXT.md's probe table didn't test this form |
| `aislop-ignore-file <rule> -- reason` anywhere in the file — top, middle (after several unrelated functions), or the literal last line | **Cleared file-wide in every position tested** | **Correction to CONTEXT.md:** the probe table's claim "`aislop-ignore-file` only works at the top of the file" does **not** hold. It suppresses the named rule for the whole file regardless of directive position. |

**Practical takeaway for the planner:** the positioning trap is real for `-line`/`-next-line` directives (must be textually adjacent to the flagged line — either the line directly above the catch's own source line, or trailing on that same line), but is not real for `-file` directives (position anywhere in the file is fine). Since this phase's only planned ignore usage (D-14, `use-timeline-cache-key.ts`) is a rule-scoped `-next-line` directive placed directly above the flagged `return cacheKey || fallback` line, this correction doesn't change any task — it just means the planner doesn't need to add a "verify the ignore is at the top of the file" check anywhere, and if a future site ever needs a file-level ignore, position is not a concern.

## Wave-1 Site Mechanics (Priority Question 4)

### `src/classes/encrypted-storage.tsx:171`

```ts
async unlock(password: string, testKey: string = TEST_KEY): Promise<boolean> {
  const key = this.deriveKey(password);
  try {
    const testValue = await this.getItem(testKey, key);
    if (testValue === null) { /* first setup */ this.key = this.deriveKey(password); return true; }
    else if (testValue === TEST_VALUE) { this.key = this.deriveKey(password); return true; }
  } catch (error) {
    // decryption failed, do nothing        <- line 171 (comment already present, still fires per D-05)
  }
  return false;
}
```

`getItem()` (called inside the try) can throw one of two distinct `Error` messages — `"Decryption failed, incorrect PIN"` (from a CBC decrypt failure) or `"Decryption failed, invalid padding"` (from a PKCS#7 unpad failure) — both are equally likely to mean "wrong password" in practice (CBC without authentication means a wrong key almost always manifests as a padding failure, not a clean decrypt-then-garbage). The catch at line 171 discards whichever of the two fired and falls through to `return false`.

**All three callers of `cache.unlock(password)` were read** (`components/pending-unlock/cache-unlock-form.tsx:32`, `providers/route/require-decryption-cache.tsx:58`, `views/settings/wallet/unlock-nut-wallet-modal.tsx:48`) — **none of them branch on the thrown error type today; all three only check the boolean result** and show a hardcoded "Incorrect password" toast/error on `false`. This answers the CONTEXT.md open question directly: **the caller cannot currently distinguish "wrong PIN" from "corrupt storage" — and no caller today tries to.** Fixing the swallowed exception with D-05's default remedy (add a reason comment + `return false;` *inside* the catch block, matching the function's existing fall-through behavior exactly) fully satisfies D-01 with **zero behavior change** to any of the three callers. Optionally logging the discarded error via the D-12 namespaced logger before returning false costs one line and makes a future "why did unlock fail" investigation possible without touching any caller — worth doing since it's nearly free, but not required by any caller's current needs, so don't let a plan task balloon into "add error-type-aware unlock UX" — that's the deferred wider security item, not this phase's job.

### `src/services/decryption-cache.ts:95`

```ts
for (let i = 0; i < sampleSize; i++) {
  try {
    const value = await kv.getItem(keys[i]);
    if (value) { estimatedSize += new Blob([JSON.stringify(value)]).size; }
  } catch (e) {
    // Skip encrypted entries we can't read      <- line 95
  }
}
```

Read in full context: this is inside `decryptionCacheStats$`, a best-effort **cache-size estimator** for the settings UI (consumed by `views/settings/messages/cache.tsx`, `unlock-nut-wallet-modal.tsx`, `require-decryption-cache.tsx` via `use$(decryptionCacheStats$)`). Note `kv` here is deliberately the **raw underlying localforage instance** (`cache.database`, not the `EncryptedStorage` wrapper) — this loop reads raw stored `{iv, data}` records for size estimation, it does not attempt decryption at all. The existing comment ("Skip encrypted entries we can't read") is slightly misleading given what the code actually does, but the remedy is unaffected: this is a textbook best-effort loop (D-10/D-12 shape — log the cause, keep sampling), not a decryption-failure path in the strict sense. No caller distinguishes a failed sample from a skipped one; the estimate is approximate by design (`estimatedSize = Math.round((estimatedSize / sampleSize) * totalEntries)`).

### `src/helpers/nostr/dms.ts:31`

```ts
export function groupIntoConversations(messages: NostrEvent[]) {
  const conversations: Record<string, UnknownConversation> = {};
  for (const message of messages) {
    try {
      const sender = getDMSender(message);
      const recipient = getDMRecipient(message);   // throws "Missing recipient pubkey" if no `p` tag
      ...
    } catch (e) {}   // <- line 31
  }
  return Object.values(conversations);
}
```

**Correction to CONTEXT.md's framing:** a repo-wide grep for callers of `groupIntoConversations` (the exact function, not the similarly-named `groupMessages`) found **none**. Every view that groups DM-style messages (`views/channels/channel.tsx`, `views/messages/chat/index.tsx`, `views/messages/components/thread-drawer.tsx`, `views/groups/components/group-chat-log.tsx`, `views/messages/group/index.tsx`) imports `groupMessages`, which is `export { groupMessageEvents as groupMessages } from "applesauce-common/helpers"` (dms.ts:62) — a **different function from a different package**, not `groupIntoConversations`. So today, "a malformed DM silently vanishes from the conversation list" (CONTEXT.md's stated risk) cannot actually happen via this code path, because nothing calls it. The finding is still real and still error-severity (it will still fail the CI gate on any diff touching this file), and the standard D-05 parse-guard remedy (comment + explicit early-`continue`, since this is a `for` loop, not a function boundary — the equivalent of D-05's `return` here is `continue`) is still the right fix. The planner should not scope extra work here beyond the mechanical D-05 fix — there is no live user-facing risk to "resolve first," only a lint finding to clear. (Whether `groupIntoConversations` is dead code entirely is a Phase 4 question, not this phase's.)

### `src/components/blob-details-modal.tsx:146` and `:153`

Both are inside `RepairBlobButton`'s `repair` handler, which is **already wrapped in `useAsyncAction`** (so the outer function-level error surfacing already exists):

```ts
const repair = useAsyncAction(async () => {
  if (!account) throw new Error("Missing account");
  if (!userServers) throw new Error("Missing servers");
  let blob: Blob | undefined = undefined;

  try {
    blob = await fetch(url).then((res) => res.blob());
  } catch (error) {}                                    // <- line 146: try the direct URL first

  for (const server of mergeBlossomServers(userServers, ownerServers)) {
    try {
      blob = await downloadBlob(server, hash).then((res) => res.blob());
      if (blob) break;
    } catch (error) {}                                  // <- line 153: try the next server
  }

  if (!blob) throw new Error("Failed to download blob from any server");
  const result = await multiServerUpload(userServers, blob, { ... });
  toast({ title: "Uploaded to servers", ... });
}, [userServers, ownerServers, hash, url, account]);
```

Exactly the D-10 shape: the terminal failure (`"Failed to download blob from any server"`) is already thrown and already toasted by `useAsyncAction` if every attempt fails; only the per-attempt causes are currently lost. Fix: add a namespaced-logger call inside each catch (`log("Failed to fetch blob directly", url, error)` / `log("Failed to download from server", server, error)`), keep the loop structure and control flow completely unchanged. D-10 explicitly rejects restructuring so the terminal error carries the last attempt's cause — don't do that here either.

### `src/views/messages/chat/components/decrypt-placeholder.tsx:23`

```tsx
const { unlock, plaintext, error } = useLegacyMessagePlaintext(message);
const decrypt = async () => {
  setLoading(true);
  try {
    await unlock();
  } catch (e) {}    // <- line 23
  setLoading(false);
};
```

Confirmed by reading `src/hooks/use-legacy-message-plaintext.ts` in full:

```ts
const unlock = useCallback(async () => {
  try {
    setError(undefined);
    await unlockLegacyMessage(event, account.pubkey, account);
  } catch (error) {
    setError(error as Error);      // <- caught and stored in state, NEVER rethrown
  }
}, [event, account]);

return { error, plaintext, unlock };
```

`unlock()` (the hook's returned callback, which is what `decrypt-placeholder.tsx` actually calls) **cannot reject** — every path inside it either resolves normally or is caught and turned into `setError`. The `try { await unlock() } catch (e) {}` in the component is dead code catching a rejection that can never occur. **D-11's fix is exactly right and is the simplest of all five Wave-1 sites: delete the try/catch entirely** (`await unlock();` on its own, no wrapper), and rely on the `if (error)` branch the component already renders two lines below (line 31) — no new state, no new UI, no toast.

## Wave-2 D-09 Site Mechanics (Priority Question 5)

All three named sites were read in full. All three conversions are purely mechanical with **no rendered-markup changes required**:

**`src/components/cashu/mint-control.tsx:24-30`** and **`src/views/settings/relays/components/relay-control.tsx:23-29`** are byte-for-byte the same shape:

```ts
// current
const [loading, setLoading] = useState(false);
const remove = async () => {
  setLoading(true);
  try { await onRemove(); } catch (error) {}
  setLoading(false);
};
// ...
<IconButton ... onClick={remove} isLoading={loading} />
```

Convert to:

```ts
const remove = useAsyncAction(async () => {
  await onRemove();
}, [onRemove]);
// ...
<IconButton ... onClick={remove.run} isLoading={remove.loading} />
```

`onRemove` is a `() => void | Promise<any>` prop; `useAsyncAction`'s internal `ref.current = fn` pattern re-captures the latest closure every render regardless of the `deps` array (only the `run` callback's identity depends on `deps`), so `[onRemove]` is both correct and matches the `AGENTS.md`-documented example exactly. Neither original component memoizes `remove` with `useCallback` today, so there is no existing identity contract to preserve — the swap is safe.

**`src/views/settings/cache/components/enable-with-delete.tsx:28-33`** is slightly different — it has **no local `loading` state at all** (the `isLoading` prop on the rendered `MenuButton` comes from the parent, not from this handler):

```ts
// current
const wipeDatabase = useCallback(async () => {
  try {
    await wipe();
    location.reload();
  } catch (error) {}
}, []);
```

Convert to:

```ts
const wipeDatabase = useAsyncAction(async () => {
  await wipe();
  location.reload();
}, [wipe]);
// ...
<MenuItem ... onClick={wipeDatabase.run}>Clear Database</MenuItem>
```

Even simpler than the other two: no `loading`/`isLoading` wiring to touch anywhere in this file. Confirms CONTEXT.md's own note — `location.reload()` runs unconditionally on success, so **the only path a user can ever see a toast on is the failure path**, which is exactly what `useAsyncAction` now provides for free.

**None of the three sites has an edge case that blocks the mechanical conversion.** No custom `isLoading` styling, no additional state derived from the old `loading` boolean, no cleanup-on-unmount logic tied to the old `try/catch`.

## Shared-File Collision (Priority Question 6)

`src/services/sqlite/index.ts`, read in full (58 lines):

```ts
const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);

if (CAP_IS_WEB) {
  throw new Error("Do not load the sqlite module on web, it does not work because jeep-sqlite can not be disabled");
  const { JeepSqlite } = await import("jeep-sqlite/dist/components/jeep-sqlite");   // <- lines 9-15: Phase 4's target
  customElements.define("jeep-sqlite", JeepSqlite);
  const jeepEl = document.createElement("jeep-sqlite");
  document.body.appendChild(jeepEl);
  await customElements.whenDefined("jeep-sqlite");
  await sqlite.initWebStore();
}

export async function openConnection(...): Promise<SQLiteDBConnection> {
  let db: SQLiteDBConnection;
  try {
    ...
    return db;
  } catch (err) {
    return Promise.reject(err);   // <- line 39: Phase 3's target
  }
}

export async function deleteDatabase(db: SQLiteDBConnection): Promise<void> {
  try {
    ...
  } catch (err) {
    return Promise.reject(err);   // <- line 54: Phase 3's target
  }
}
```

**Zero line overlap.** Phase 4's target is the unreachable code below the module-level `throw` (lines 9-15, inside the `if (CAP_IS_WEB)` block). Phase 3's target is the two `redundant-try-catch` sites inside `openConnection` (lines 26-41) and `deleteDatabase` (lines 44-57) — both already-`async` functions where `catch (err) { return Promise.reject(err); }` is pure ceremony (an `async` function already returns a rejected promise for any uncaught throw; the try/catch adds nothing). The fix is to delete both try/catch wrappers entirely, letting the awaited calls propagate naturally — no behavior change, since a rejected promise from inside the function body is identical to one from `Promise.reject(err)` in the catch.

**Sequencing, not line conflict, is what matters here.** Since Phase 3 executes before Phase 4 (per `STATE.md`'s "Phases 3-8... Phase 3 is first" and the ROADMAP's ordering), Phase 3's edit lands first and Phase 4's plan will be written against the post-Phase-3 file. The planner should still scope Phase 3's diff on this file **narrowly to lines 18-57** (the two function bodies) and leave lines 1-16 (the module-level throw and the dead code beneath it) completely untouched, so Phase 4's later plan doesn't have to account for an unexpected Phase-3-shaped diff in that region.

## D-13 Stray: `native-scanner.ts:15` is a real refactor, not a lint tweak

```ts
export async function installNativeScanner(): Promise<boolean> {
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
    await new Promise<void>(async (res, rej) => {          // <- line 15: no-async-promise-executor
      const sub = await BarcodeScanner.addListener("googleBarcodeScannerModuleInstallProgress", (event) => {
        switch (event.state) {
          case COMPLETED: sub.remove(); res(); break;
          case FAILED: sub.remove(); rej(new Error("Failed to install")); break;
          case CANCELED: sub.remove(); rej(new Error("Canceled install")); break;
          // PENDING / DOWNLOADING / DOWNLOAD_PAUSED / INSTALLING: just log progress
        }
      });
    });
  }
  ...
}
```

The reason this is `async` is that `sub` (the listener handle, needed inside the callback to `remove()` itself) is only available after `await`ing `addListener(...)`, and that registration call happens *inside* the promise executor. `no-async-promise-executor` fires because an async executor's own thrown errors don't propagate to the `Promise`'s `reject` — but this function doesn't rely on that failure mode today (it explicitly calls `rej(...)` itself), so the rule is flagging a latent hazard, not an active bug. Fixing it without dropping the `await` requires hoisting the registration outside the executor:

```ts
await new Promise<void>((res, rej) => {
  let sub: Awaited<ReturnType<typeof BarcodeScanner.addListener>> | undefined;
  BarcodeScanner.addListener("googleBarcodeScannerModuleInstallProgress", (event) => {
    switch (event.state) {
      case COMPLETED: sub?.remove(); res(); break;
      case FAILED: sub?.remove(); rej(new Error("Failed to install")); break;
      case CANCELED: sub?.remove(); rej(new Error("Canceled install")); break;
      ...
    }
  }).then((handle) => { sub = handle; });
});
```

This is a small (~15 line) but genuine restructure, not a mechanical rewrite — flag it in the plan as its own task with a slightly larger review surface than the other three D-13 strays (`sqlite/index.ts` deletion, `use-timeline-cache-key.ts` ignore comment, `index.tsx` logger swap), which are all one- or two-line changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Async action + loading state + error toast in a component | A new custom hook or inline `try/catch` + `useState` | `src/hooks/use-async-action.ts` (already exists, already `AGENTS.md`-required) | This is the whole point of D-09 — the hook already exists and is documented as REQUIRED; writing a new one or keeping the hand-rolled version is the exact anti-pattern this phase removes |
| Namespaced, production-silent logging | `console.log`/`console.warn`/`console.error` in new code | `logger.extend("<Module>")` from `src/helpers/debug.ts` (wraps the `debug` npm package, already a dependency) | `console.*` calls trip `ai-slop/console-leftover` (bucket G, kept on by Phase 2 D-07); the namespaced logger is silent in production and already the established services pattern |
| Rule-scoped suppression | A bare `aislop-ignore-*` with no rule name, or a blanket file exclude in `.aislop/config.yml` | The rule+reason inline directive convention from Phase 2 (D-12), documented in `AGENTS.md` §"Inline ignores" | Bare directives are explicitly disallowed by both `AGENTS.md` and this phase's D-07; a config-level exclude would hide the file from all future scans, not just this one rule |

**Key insight:** every "don't hand-roll" item in this phase is really "don't reintroduce what Phase 2 or an existing hook already solved" — there is no new external library anywhere in this phase's scope.

## Common Pitfalls

### Pitfall 1: Treating `pnpm lint` / bare `aislop scan` exit code as pass/fail
**What goes wrong:** A `<verify>` block that does `pnpm lint && echo pass` will never see "pass" — the command exits 1 whenever any finding exists anywhere in the 2164-file repo, which is always true today.
**Why it happens:** aislop's plain scan mode reports findings but doesn't gate on a threshold; only `aislop ci` (or the jq-filtered scan used for D-04) produces a meaningful pass/fail signal for this phase's purposes.
**How to avoid:** Always pipe `--json` output through the `jq` filter shown above and assert on the filtered count, never on the scan command's raw exit code.
**Warning signs:** A task's verification step "always fails" even after the fix lands — check whether it's asserting on exit code instead of the filtered count.

### Pitfall 2: Assuming a reason comment alone satisfies D-05
**What goes wrong:** Adding a comment like `// invalid URL, ignore` to an empty catch and considering the site fixed — the finding still fires (confirmed live, twice, on two different probe files).
**Why it happens:** The comment satisfies the *intent* of "no error discarded without a reason" but `ai-slop/swallowed-exception`'s actual detector looks for control flow (a `return`/`throw`) inside the catch block, not comment presence.
**How to avoid:** Every D-05 site needs an explicit `return`/`continue` statement inside the catch body, in addition to the comment. `src/components/relay-url-input.tsx:62` is the trap case: it already has a good comment today and still fires.
**Warning signs:** Rescanning a "fixed" file and still seeing the error.

### Pitfall 3: Assuming `unlock()`'s swallowed error is a "real" user-facing gap
**What goes wrong:** Over-scoping `encrypted-storage.tsx:171`'s fix into a distinguish-wrong-PIN-from-corrupt-storage feature because it's in the Wave-1 "risky" set.
**Why it happens:** The site is genuinely error-severity and genuinely in the decryption path, so it reads as high-risk from the finding list alone.
**How to avoid:** Read the three actual callers first (done above) — none of them consume anything except the boolean, so the D-05 default remedy (not a new UX capability) closes the loop completely.
**Warning signs:** A task description that mentions changing the toast message or adding new error states at this site — that's the deferred "wider error story," not this phase.

### Pitfall 4: Fixing `groupIntoConversations` as if it's wired into the DM UI today
**What goes wrong:** Writing verification steps that check the messages view for "malformed DM handling," which cannot be observed because no view calls this function.
**Why it happens:** CONTEXT.md's site classification describes the theoretical risk ("a malformed DM silently vanishes from the conversation list") without noting that the function has no callers.
**How to avoid:** Confirmed via repo-wide grep — `groupMessages` (a different, applesauce-provided function) is what every DM/channel/group view actually uses. Treat `dms.ts:31` as a standard D-05 parse guard; don't add manual-check verification steps that assume live UI impact.
**Warning signs:** A UAT step that says "open a DM thread with a malformed message and confirm it's skipped" — there's no way to observe this function's behavior from the UI today.

## Code Examples

### D-05 default remedy (parse guard)
```typescript
// Source: pattern confirmed live against installed aislop@0.16.1 (see Probe Re-Verification)
export function safeUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch {
    // invalid URL string; callers already treat undefined as "no URL"
    return undefined;
  }
}
```

### D-09 conversion (user-triggered action)
```typescript
// Source: src/hooks/use-async-action.ts (existing, AGENTS.md-required) + mint-control.tsx / relay-control.tsx shape
import useAsyncAction from "../../hooks/use-async-action";

export default function MintControl({ url, onRemove, children, details }: PropsWithChildren<{...}>) {
  const remove = useAsyncAction(async () => {
    await onRemove();
  }, [onRemove]);

  return (
    // ...
    <IconButton aria-label="Remove Mint" onClick={remove.run} isLoading={remove.loading} ... />
  );
}
```

### D-10 best-effort fallback (log and continue)
```typescript
// Source: src/services/event-cache/index.ts:55 (existing in-repo example of this exact shape)
const log = logger.extend("BlobRepair");
// ...
try {
  blob = await fetch(url).then((res) => res.blob());
} catch (error) {
  log("Failed to fetch blob directly", url, error);
}
```

### D-12 namespaced logger, module setup
```typescript
// Source: src/services/event-cache/index.ts:16 (existing pattern)
import { logger } from "../../helpers/debug";
const log = logger.extend("ModuleName");
```

### D-11 (delete unreachable catch)
```typescript
// Before (src/views/messages/chat/components/decrypt-placeholder.tsx)
const decrypt = async () => {
  setLoading(true);
  try {
    await unlock();
  } catch (e) {}
  setLoading(false);
};

// After — unlock() (from useLegacyMessagePlaintext) never rejects; error is already in `error` state
const decrypt = async () => {
  setLoading(true);
  await unlock();
  setLoading(false);
};
```

## State of the Art

Not applicable in the usual "library version" sense — this phase's "state of the art" is entirely about what the *currently installed* `aislop@0.16.1` actually enforces, which is why this research re-measured everything live rather than trusting the recorded baseline prose. No library upgrade, no framework change, and no new tool is introduced by this phase.

| Old approach (pre-Phase-2) | Current approach | When changed | Impact |
|---|---|---|---|
| No lint gate; empty catches accumulated freely | `aislop@0.16.1` with `ai-slop/swallowed-exception` at error severity, gating `pnpm lint:ci` | Phase 2 (2026-09-11) | This phase exists because the gate now fails real PRs that merely touch an already-broken file — clearing the backlog removes that friction going forward |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `security/vulnerable-dependency`'s severity-vs-config-override behavior (individual findings can carry `error` severity from the npm advisory data even when the rule is configured `warning`) is an aislop implementation detail, not fully documented | Baseline Re-Measurement, "Unrelated drift" | Low — this bucket is explicitly out of scope for Phase 3; if wrong, it only affects understanding of an unrelated bucket-J number, not any task in this phase |
| A2 | `native-scanner.ts:15`'s suggested restructure (hoist listener registration via `.then`, guard `sub?.remove()`) is *a* correct fix, not necessarily aislop's or the maintainer's preferred one | D-13 Stray section | Low-medium — if the planner or implementer prefers a different restructure (e.g., converting the whole function to `async`/`await` without a `Promise` wrapper at all, since modern `BarcodeScanner.addListener` usage elsewhere in the same file doesn't need a wrapping Promise), that's a valid alternative; flag the site as "needs a real fix, not a one-liner" regardless of which shape is chosen |

## Open Questions

1. **Should `encrypted-storage.tsx:171`'s fix include a log call, given it's nearly free?**
   - What we know: No caller today consumes the discarded error; the D-05 default remedy (comment + `return false`) fully satisfies D-01 with zero behavior change.
   - What's unclear: Whether the maintainer wants the D-12 namespaced-logger addition bundled in for future debuggability, or wants this site to stay a pure D-05 minimal fix like the other parse guards.
   - Recommendation: Default to adding the one-line log call (matches the spirit of "no error is discarded without a reason" more completely than a comment alone, and costs nothing) unless the planner decides consistency with the other D-05 sites (no logging) matters more.

2. **Is `groupIntoConversations` dead code that Phase 4 should remove, or a stub for planned functionality?**
   - What we know: No current caller anywhere in the app; `groupMessages` (a different, applesauce-provided function) is what's actually wired into every DM/channel/group view.
   - What's unclear: Whether this was scaffolding for a feature that never shipped, or is intentionally kept for a future consumer.
   - Recommendation: Out of scope for Phase 3 either way (the D-05 fix applies regardless of whether the function has callers) — flag for Phase 4's dead-code sweep to investigate, don't let Phase 3 make a removal decision.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `aislop` (exact-pinned devDependency) | The rescan verification command (D-04) | ✓ | 0.16.1 (confirmed via `pnpm exec aislop --version`) | — |
| `jq` | The rescan command's rule-name filtering | ✓ | 1.6 (confirmed via `jq --version`) | If unavailable in a given CI/dev environment, the same filter can be written in `node -e` against the same JSON — no new dependency either way |
| `pnpm` | Running any of the above | ✓ (already the project's package manager) | — | — |

No missing dependencies. This phase requires nothing beyond what Phase 2 already installed.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **None** — confirmed by `.planning/codebase/CONCERNS.md` ("Automated test suite is not detected... no `test` script") and reconfirmed here: no `*.test.*`/`*.spec.*` files exist, no test runner is a dependency. D-04 explicitly rejects introducing one for this phase ("adding vitest for the pure helpers... is its own phase"). |
| Config file | None — see above |
| Quick run command | `pnpm exec aislop scan --json . 2>/dev/null \| jq '[.diagnostics[] \| select((.rule=="ai-slop/swallowed-exception" or .rule=="ai-slop/silent-recovery") and .severity=="error")] \| length'` — asserts `0` |
| Full suite command | The per-file `jq` pipeline in the Rescan Command section above, plus `pnpm lint:ci` (run from a feature branch, per `AGENTS.md`) to confirm no *other* error-severity finding was introduced in a touched file as a side effect of a fix |

### Phase Requirements → Test Map

Since there is no test framework, "test type" below means the verification *mechanism*, not an automated test file.

| Req ID | Behavior | Verification Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | Zero bucket-B error-severity findings after all waves | scoped-rescan | Quick-form jq command above, asserting `0` | N/A — verification is the scan itself, not a test file |
| D-02 | Wave-1 files fixed and committed before Wave-2 | manual (commit-order review) | `git log --oneline` showing Wave-1 files in earlier commit(s) than Wave-2 | N/A |
| D-04 | Per-file before/after table shows 32→0 (corrected: 31→0) | scoped-rescan | Full-form jq command above, diffed against the "before" table in this document | N/A |
| D-05 | Parse-guard sites use comment + explicit return | scoped-rescan (the rule itself is the check) | Same quick-form command scoped to the specific file via `--include` | N/A |
| D-09 | Three named sites converted to `useAsyncAction`, no markup regressions | scoped-rescan + manual visual check | Quick-form command (clears the finding) + `pnpm build` (typecheck) + a manual click-through of Remove Mint / Remove Relay / Clear Database in dev | N/A — no test file; manual click-through is the only way to confirm loading-state rendering is unchanged (see Wave 0 Gaps) |
| D-11 | `decrypt-placeholder.tsx` renders hook's `error` state, no dead catch | scoped-rescan + manual | Quick-form command + manually trigger a decryption failure in dev to confirm the existing `error` Alert still renders | N/A |
| D-13 | Four strays cleared, `native-scanner.ts` refactor behaves identically | scoped-rescan + `pnpm build` + manual (native scanner needs a Capacitor native build to exercise at all) | Quick-form + full-form jq commands; `pnpm build` for typecheck | N/A |
| D-14 | Rule-scoped ignore added with correct reason wording | scoped-rescan (confirms suppression) + manual review of the `-- reason` text against D-08's requirement | Quick-form command (should show 0 contribution from this line) + `AGENTS.md` review-based enforcement of ignore wording | N/A |

### Sampling Rate

- **Per task commit:** the quick-form jq count, scoped to whatever file(s) that task touched (either via `--include` or by re-running the whole-repo quick form and confirming the count dropped by the expected amount).
- **Per wave merge:** the full-form per-file table, diffed against this document's "before" table for Wave 1, and against the Wave-1-complete state for Wave 2.
- **Phase gate:** quick-form command reads `0`, **and** `pnpm lint:ci` (run from a feature branch per `AGENTS.md`) passes, **and** `pnpm build` passes (typecheck — several of the D-09/D-11/D-13 edits change function signatures or delete state, which `tsc` will catch if a call site was missed).

### Wave 0 Gaps

None — there is no test infrastructure to bootstrap, and D-04 explicitly rejects adding any. The only "gap" is inherent to having no test framework: the D-09 and D-11 sites need a **manual click-through in dev** (documented above) to confirm loading-state and error-state rendering are visually unchanged, since a rescan can only confirm the lint finding cleared, not that the UI still renders identically. This is a residual, accepted risk per D-04 (which explicitly rejected a manual UAT wave for the decryption paths) — flag it in the plan as a lightweight "spot-check in dev, not a formal UAT pass," not as new scope.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | This phase touches password-based *unlock* of a local cache/signer, not authentication to a remote service |
| V3 Session Management | No | Not applicable — no server sessions in this app |
| V4 Access Control | No | Not applicable to this phase's scope |
| V5 Input Validation | Marginally | The D-05 parse guards (URL, nip19, event tags, JSON lines) are input-validation boundaries; the fix is to handle the failure explicitly (already required by D-05), not to add new validation logic |
| V6 Cryptography | Indirectly | `encrypted-storage.tsx:171`'s swallowed error touches the cache-unlock crypto path, but this phase's D-01 scope is the swallowed exception, not the crypto scheme itself — the AES-CBC-without-authentication and low-PBKDF2-iteration concerns flagged in `CONCERNS.md` are explicitly deferred, not this phase's job |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Swallowed decryption error masking a downgrade/tamper signal | Tampering / Information Disclosure | Not deepened by this phase — the existing behavior (treat any decrypt failure as "wrong password," per all three callers read above) is preserved as-is; a real fix would need to distinguish wrong-key from corrupted-ciphertext, which requires an authenticated cipher mode (AES-GCM) — tracked as a deferred item in CONTEXT.md, not this phase's scope |
| Best-effort fallback loops silently trying alternate sources (blob repair, event-cache backend selection) | Denial of Service (partial) | D-10's "log the cause, stay silent" is the correct mitigation shape for this class of finding — logging preserves investigability without changing the fallback's resilience behavior |

This phase does not introduce any new security-relevant code path; it makes existing failure paths observable (via logging) or explicit (via typed returns), which is a net security improvement (better auditability) with no new attack surface.

## Sources

### Primary (HIGH confidence — measured live this session)
- `pnpm exec aislop scan --json .` (aislop 0.16.1, installed devDependency) — full re-scan, bucket-B extraction, drift comparison against `.planning/research/aislop-scan-2026-09-11.json`
- `pnpm exec aislop rules` — confirmed `ai-slop/silent-recovery` and `ai-slop/swallowed-exception` default severities directly from the tool
- `pnpm exec aislop scan --help` / `pnpm exec aislop commands` — confirmed no rule/severity CLI filter exists
- Three disposable in-repo probe files (created under `src/`, scanned with `--include`, deleted; `git status --short` confirmed clean before/after) — reproduced and corrected the D-05/D-07 probe table
- Direct reads of all 33 bucket-B files' actual source (or the relevant function for larger files), plus all 3 D-09 call sites and all 3 `EncryptedStorage.unlock()` cache-path callers

### Secondary (MEDIUM confidence)
- `.planning/research/aislop-scan-2026-09-11.md` / `.json` — the recorded baseline; confirmed byte-for-byte reproducible for bucket B, drift only in unrelated bucket J
- `AGENTS.md` §Linting, §"Inline ignores", §Error Handling — existing project convention, target for D-03's addition
- `.planning/codebase/CONVENTIONS.md` §Error Handling / §Logging, `.planning/codebase/CONCERNS.md` — background on `useAsyncAction`, the `debug` logger pattern, and the crypto concerns explicitly deferred

### Tertiary (LOW confidence)
- None — every claim in this document was either measured directly this session or cited from a committed project doc.

## Metadata

**Confidence breakdown:**
- Standard stack: N/A — no new stack; existing `useAsyncAction` / `helpers/debug.ts` patterns confirmed HIGH by direct source read
- Baseline counts (D-01/D-04): HIGH — re-measured live, zero drift found in bucket B, one severity-classification correction identified and documented
- Probe table (D-05/D-07): HIGH — re-measured live with disposable test files, one correction identified (`aislop-ignore-file` position independence)
- Wave-1 site mechanics: HIGH — every site's actual source and every caller was read directly
- D-13 stray mechanics: HIGH for 3 of 4 (mechanical), MEDIUM for `native-scanner.ts:15` (a genuine refactor with more than one valid shape — see Assumption A2)

**Research date:** 2026-09-14
**Valid until:** Effectively indefinite for the bucket-B counts and probe behavior (tied to the exact-pinned `aislop@0.16.1`, which only changes on a deliberate upgrade per Phase 2 D-14) — but re-run the quick-form rescan command before planning if any `src/` commits have landed between this research and plan execution, since this document's "before" state assumes zero drift since 2026-09-11.
