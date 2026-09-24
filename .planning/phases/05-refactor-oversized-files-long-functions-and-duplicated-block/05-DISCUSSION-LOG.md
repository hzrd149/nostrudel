# Phase 5: Refactor oversized files, long functions, and duplicated blocks - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-24
**Phase:** 05-refactor-oversized-files-long-functions-and-duplicated-blocks
**Areas discussed:** The "done" bar, Split depth (napplet-shell + wallets), Target set vs. stale roadmap, Refactor safety & verification

---

## The "done" bar

### What "done" means for Phase 5

| Option | Description | Selected |
|--------|-------------|----------|
| Every finding cleared or ignored | All 33 end at zero or carry a rule-scoped ignore with a reason (P3 D-01 / P4 D-01 precedent) | ✓ |
| Extract what's real, leave false positives standing | Fix the genuine items; leave data-table hits and load-bearing wrappers as documented standing warnings | |
| Extract what's real, ignore-with-reason the rest | Same fixes, every deliberate survivor carries an ignore at the site | |

**User's choice:** Every finding cleared or ignored
**Notes:** Surfaced during the question that **every bucket-H rule is warning severity**, so unlike Phase 3 nothing here gates CI — the completion bar was a genuine choice rather than a mechanical requirement. Became D-01.

### Clearing torrents.ts's five findings

| Option | Description | Selected |
|--------|-------------|----------|
| One file-level ignore | A single rule-scoped `aislop-ignore-file` at the top of the file (P2 D-11 precedent) | ✓ |
| Five adjacent line-ignores | A rule-scoped `aislop-ignore-next-line` at each of :119, :121, :131, :150, :152 | |
| Restructure the taxonomy | Hoist repeated leaves into shared constants so the duplication genuinely disappears | |

**User's choice:** One file-level ignore
**Notes:** All five findings are leaves inside the static `torrentCatagories` literal — repeated `{name:"Mac",tag:"mac"}` / `{name:"iOS",tag:"ios"}` entries across category subtrees. This is the ROADMAP's headline target and it is a false positive. Became D-06.

### Default for the ~8 borderline duplicate-block sites

| Option | Description | Selected |
|--------|-------------|----------|
| Default to extraction | Extract unless it would couple unrelated things; most principled under the D-08 ignore bar | |
| Default to ignore, extract only clear wins | Extract the unambiguous ones, ignore-with-reason the looser JSX shape-similarity | ✓ |
| Per-site judgment, no default | Leave every borderline site to the planner to call individually | |

**User's choice:** Default to ignore, extract only clear wins
**Notes:** Clear wins identified during discussion: the three `useAsyncAction` convention violations, magic-textarea's twin `forwardRef` components, direct-message-form's twin inbox lists, and error-logger's shared console loop. Became D-05.

### Disposition of relay-stats.ts

| Option | Description | Selected |
|--------|-------------|----------|
| Delete all the dead symbols | Remove `getRelayURL`, `getRTT`, `getRTTTag`, `MONITOR_METADATA_KIND`; keep the three used symbols | ✓ |
| Delete getRelayURL, fix and keep getRTT | Honor Phase 4's handoff literally by fixing the `getRTTTag` parameter bug | |
| Delete getRelayURL only, defer the bug again | Clear just the thin-wrapper finding, promote the bug to backlog | |

**User's choice:** Delete all the dead symbols
**Notes:** Scouting established this was not a thin-wrapper problem at all — `getRelayURL`'s only repo-wide occurrence outside planning docs is its own definition, and `getRTT` has no consumers. Phase 4 explicitly deferred the `getRTTTag` bug *to this phase* (`04-11-SUMMARY.md:202`) because the file was a named Phase 5 target. Became D-13.

---

## Split depth: napplet-shell + wallets

### How far the napplet-shell-provider split should go

| Option | Description | Selected |
|--------|-------------|----------|
| Full CONCERNS.md split | Adapters into `services/napplet-shell/*`, thin provider, modals extracted | ✓ |
| Split in place under providers/global/ | Break into sibling modules without promoting to `services/` | |
| Minimum to clear the thresholds | Extract just enough to get under 600 lines and both function budgets | |

**User's choice:** Full CONCERNS.md split
**Notes:** Scouting found consumer churn is near zero — the 1162-line file exports only `NappletShellProvider` and `useNappletShell` across three import sites, and the seams are already module-level functions. CONCERNS.md §23–26 prescribes this split verbatim. Became D-08.

### Internal shape of the wallets.ts split

| Option | Description | Selected |
|--------|-------------|----------|
| By backend | `services/wallets/{types,webln,nwc,nutwallet,index}.ts` | ✓ |
| Types + backends out, keep the rest | Extract only shared types and the three backend factories | |
| Minimum to clear 400 lines | Move whichever single chunk gets the file under threshold | |

**User's choice:** By backend
**Notes:** Confirmed zero-churn — `moduleResolution: "Bundler"` plus unanimous in-repo precedent (`event-cache`, `database`, `sqlite` are all directory modules imported by bare path). Also confirmed no import cycle constrains the split. Became D-10.

### Where the two extracted modals should live

| Option | Description | Selected |
|--------|-------------|----------|
| components/napplets/ | Beside the existing napplet-frame, napplet-info-drawer and napplet-menu | ✓ |
| Inside services/napplet-shell/ | Keep each modal next to the adapter code that raises it | |
| A local providers/global/napplet-shell/ folder | Keep them private to the provider that owns them | |

**User's choice:** components/napplets/
**Notes:** Putting JSX under `services/` would cut against the architecture's layer separation. Became D-09.

### Scope guard on the sibling napplet services

| Option | Description | Selected |
|--------|-------------|----------|
| Leave them alone | `services/napplet-shell/` holds only what comes out of the provider | ✓ |
| Absorb all napplet services | Move installed-napplets, napplet-intent-delivery, recent-napplets in too | |
| Name the directory to fit | Do the split but pick a narrower name and document why siblings stay | |

**User's choice:** Leave them alone
**Notes:** The three carry no bucket-H findings; moving them would inherit their existing findings into the diff under the whole-file gate. Became D-11.

---

## Target set vs. stale roadmap

### Treatment of findings the roadmap didn't anticipate

| Option | Description | Selected |
|--------|-------------|----------|
| All 33 are in scope | The phase is defined by the bucket, not the roadmap's stale illustration of it | ✓ |
| Roadmap targets get fixed, strays get ignored | Real work only on named files; clear the 14 strays with ignores | |
| All 33, but strays are triage-only | Every finding examined, strays held to a lower fix bar | |

**User's choice:** All 33 are in scope
**Notes:** Precise tally established during discussion: the roadmap names 19 of the 33 findings; 14 sit in files it never mentions (8 duplicate-block, 6 function-too-long). Became D-02.

### Whether to correct the stale ROADMAP entry

| Option | Description | Selected |
|--------|-------------|----------|
| Correct it as part of this phase | Update to re-measured reality before planning completes | ✓ |
| Leave it, capture the truth in CONTEXT.md | Treat CONTEXT.md as the authoritative target list | |
| Correct it at phase close | Plan against CONTEXT.md, true up the roadmap at completion | |

**User's choice:** Correct it as part of this phase
**Notes:** Three specific staleness points identified: torrents.ts framed as a real target, napplet-shell described as ">600 lines" when it is 1162, and relay-stats framed as "inline or justify" when it is dead code. Became D-04.

### Default remedy for the six long functions

| Option | Description | Selected |
|--------|-------------|----------|
| Split by kind | Extract the three non-component sites; ignore-with-reason the three page components | ✓ |
| Extract all six | Break every over-budget function into sub-components or helpers | |
| Extract only the worst two | Fix `useWebxdc` (+154) and `PollFormInner` (+142), ignore the rest | |

**User's choice:** Split by kind
**Notes:** Measurement drove this — the three non-component sites run 102–234 lines against an 80-line budget (`useWebxdc` is 234 of its file's 257 lines), while the three page components are 216–302 against a 160-line component budget where much of the length is inherent JSX. Also established that aislop gives React components 2× the configured `maxFunctionLoc`. Became D-12.

---

## Refactor safety & verification

### How the phase proves it didn't break anything

| Option | Description | Selected |
|--------|-------------|----------|
| Add vitest for the extracted pure functions | A runner plus tests for the pure functions this phase creates, as CONCERNS.md prescribes | ✓ |
| Rescan + build only, per precedent | Exactly P3 D-04 / P4 D-14 — before/after table plus `pnpm build` | |
| Rescan + build + targeted manual UAT | Add a manual pass over napplet consent, wallet backends and refactored pages | |

**User's choice:** Add vitest for the extracted pure functions
**Notes:** Deliberately overturns P3 D-04, which rejected a test framework as "its own phase." Justified by this phase relocating ~1,750 lines of behavior-bearing, zero-coverage code. Manual UAT was weakened by STATE.md's record that Phase 3's dev-server verification was killed by OOM with swap exhausted. Confirmed during scouting that the repo has zero test files and no test job in any CI workflow. Became D-15.

### Commit structure

| Option | Description | Selected |
|--------|-------------|----------|
| Pure-move commits, separate from edits | Relocation lands move-only; behavior adjustments follow separately | ✓ |
| One commit per extracted module | Each new module arrives complete, moves and adjustments together | |
| One commit per target file | All work on each file in a single commit | |

**User's choice:** Pure-move commits, separate from edits
**Notes:** Extends P4 D-04 from auto-fixes to relocation, so a reviewer can verify a ~1,000-line split mechanically. Became D-16.

### Wave sequencing

| Option | Description | Selected |
|--------|-------------|----------|
| Low-risk first, big splits last | Mechanical items, then small extractions, then harness and the two big splits | ✓ |
| Risk first, per P3 D-02 | Take the napplet and wallets splits first while budget is greatest | |
| Harness first, then everything else | Stand up vitest before touching any code | |

**User's choice:** Low-risk first, big splits last
**Notes:** Harness-first was noted as partly infeasible — the permission and grant functions are module-private until the extraction happens, so the suite would land nearly empty. Became D-17.

### Policy on latent bugs found mid-refactor

| Option | Description | Selected |
|--------|-------------|----------|
| Fix if trivial, record if not — never drop | Small provable fixes in their own commit; anything larger promoted before phase close | ✓ |
| Always fix in place, in a separate commit | Nothing deferred, nothing forgotten | |
| Flag and defer by default | Keep the refactor strictly structural | |

**User's choice:** Fix if trivial, record if not — never drop
**Notes:** Framed against this project's own history — Phase 4's dormant PoW path grew into two extra waves, and `getRTTTag` was flagged in a summary and then depended on a later phase noticing it. Became D-18.

---

## Claude's Discretion

The user selected a concrete option for every question; there were no "you decide" answers. The
discretion recorded in CONTEXT.md is scoped implementation latitude the decisions deliberately
leave open, not unanswered questions:

- Exact module boundaries and file names within `services/napplet-shell/*` and `services/wallets/*`
- How `useWebxdc` divides into sub-hooks, and the shape of the `renderBody` / `handleRequest` extractions
- Exact wording of each `-- reason` string, subject to the D-08 justification bar
- Which specific pure functions get vitest coverage under D-15's scope boundary
- Plan-to-wave assignment within the D-17 ordering

## Deferred Ideas

- Splitting the three oversized page components (`PollFormInner`, `RelayPage`, `EventPublisherPage`) — ignored-with-reason under D-12
- Consolidating the three sibling napplet services under `services/napplet-shell/` — excluded by D-11
- A general testing initiative beyond D-15's scope boundary
- A shared embed component for `code.tsx` / `youtube.tsx` — rejected under D-05 as coincidental shape
- Restructuring `torrentCatagories` to remove the duplication genuinely — rejected under D-06
- `react-hooks/exhaustive-deps` (999.5) and `rules-of-hooks` (999.2) in restructured files — must not be swept in
- Setting `workflow.ui_safety_gate: false` in `.planning/config.json` — the permanent fix for the gate Phase 4 overrode twice
