---
phase: 5
slug: refactor-oversized-files-long-functions-and-duplicated-block
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-24
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `05-RESEARCH.md` § Validation Architecture and CONTEXT.md D-15 / D-19.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest, exact-pinned `5.0.1` — **new to this phase**, does not exist yet (D-15) |
| **Config file** | `vitest.config.ts` — new, repo root, standalone (do NOT extend `vite.config.ts`) |
| **Quick run command** | `pnpm exec vitest run <path>.test.ts` (single file) |
| **Full suite command** | `pnpm test` (Wave 3 onward, once the `package.json` script exists) |
| **Estimated runtime** | TBD — no suite exists until Wave 3; not measurable at planning time |

**Pre-Wave-3 gates.** Until vitest lands, the only automated gates are `pnpm build`
(`tsc --project tsconfig.json && vite build`) and `pnpm exec aislop scan --json .`. Waves 1 and 2
are validated entirely by those two — this is expected, not a coverage gap (D-17 explicitly
rejects harness-first ordering).

---

## Sampling Rate

- **After every task commit:** `pnpm build` — D-19 requires this after *every* task, not only at
  wave boundaries. It is the type-check gate and the real backstop for relocation errors across
  all ~16 consumer sites. From Wave 3, additionally
  `pnpm exec vitest run <changed-file>.test.ts` for any task that adds or touches a test.
- **After every plan wave:** scoped `pnpm exec aislop scan --json .`, filtered to the four
  bucket-H rules, compared against the running 33 → N before/after table.
- **Before `/gsd-verify-work`:** `pnpm build` green, `pnpm test` green (Wave 3+), and the complete
  33 → N table with every surviving ignore's reason listed.
- **Max feedback latency:** TBD — `pnpm build` wall time not measured this session.

> `pnpm lint` always exits non-zero (`AGENTS.md`) — never chain it with `&&`.

---

## Per-Task Verification Map

Task IDs do not exist until plans are written; this table is populated during planning.

This project has **no `REQUIREMENTS.md` and no REQ-IDs** (confirmed absent). The locked decisions
**D-01…D-19 function as the requirement set**, each carrying its own verification method. The
decision-level map below is the authoritative contract; per-task rows inherit from it.

| Decision | Behavior to prove | Test Type | Automated Command |
|---|---|---|---|
| D-01 / D-19 | Every bucket-H finding fixed **or** carrying a rule-scoped ignore with a reason | scoped rescan + before/after table | `pnpm exec aislop scan --json .` filtered to the 4 bucket-H rules |
| D-04 | ROADMAP Phase 5 entry corrected via the `gsd-tools` roadmap handler (never a direct edit) | handler diff review | review handler output against D-04's three staleness points |
| D-06 | `helpers/nostr/torrents.ts` 5 findings cleared by **one** file-level ignore | scoped rescan | confirm `duplicate-block` 5 → 0 in that file |
| D-07 | 3 handlers converted to `useAsyncAction`; `duplicate-block` **clears, not relocates** | scoped rescan, function-level | rescan `cached-files-card.tsx` + `service-worker-status-card.tsx` before/after |
| D-08 / D-09 / D-10 | Splits preserve the 3-site (napplet-shell) and ~13-site (wallets) consumer surfaces unchanged | typecheck | `pnpm build` after **every** relocation task |
| D-12 | `useWebxdc` / `renderBody` / `handleRequest` extracted; `function-too-long` clears | scoped rescan | confirm those 3 findings are gone |
| D-13 | Dead symbols deleted, zero consumers broken | typecheck + grep | `pnpm build`; `grep -rn "getRelayURL\|getRTT\b\|getRTTTag\|MONITOR_METADATA_KIND" src` returns nothing |
| D-14 | `verify-event.ts` behaviorally unchanged, ignore added | diff review | `git diff` shows only the added ignore comment |
| D-15 | Newly-extracted pure functions have vitest coverage | unit | `pnpm exec vitest run` |
| D-16 | Pure-move commits separated from behavior-touching edits | commit-shape review | each relocation commit diffs as move-only |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All four items below belong to **Wave 3**, not Wave 0 — the functions worth testing do not exist
as independently-testable units until D-08 / D-10 extraction happens. This is D-17's ordering,
which explicitly rejects harness-first.

- [ ] `vitest.config.ts` — repo root, minimal, standalone
- [ ] `package.json` → `"test": "vitest run"` (no `test` script exists today)
- [ ] `vitest` devDependency, **exact-pinned `5.0.1`**, gated behind a `checkpoint:human-verify`
      task — the legitimacy audit returns `SUS` / `too-new` on the bare `vitest` name, which is
      expected for a 73.8M-weekly-download official package, not a slopsquat signal (P2 D-14)
- [ ] First `*.test.ts` file(s) — must land **in the same commit** as the three items above, never
      earlier (Pitfall 4: flipping `.planning/config.json`'s `test_command` to `pnpm test` before a
      test file exists breaks the per-task gate)

---

## Manual-Only Verifications

| Behavior | Decision | Why Manual | Test Instructions |
|---|---|---|---|
| *(none blocking)* | — | — | — |

**No blocking manual verification in this phase.** Visually spot-checking the napplet consent
modal or a wallet flow after the splits is **optional, human-initiated, and must not be planned as
a blocking task**.

> **Hard constraint:** no validation may depend on a long-running `pnpm dev` session. STATE.md
> records that Phase 3's dev-server verification was killed by OOM with swap exhausted and could
> not be completed (`03-04-SUMMARY.md`). D-08's and D-10's splits are validated by `pnpm build`
> plus unit tests on the extracted pure logic — never by manually exercising the UI.

---

## Validation Sign-Off

- [ ] All tasks have an `<automated>` verify or a declared Wave 3 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify
      (`pnpm build` after every task satisfies this by construction)
- [ ] Wave 3 covers all four harness gaps above
- [ ] No watch-mode flags (`vitest run`, never bare `vitest`)
- [ ] Feedback latency measured and recorded
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
