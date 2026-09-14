# Phase 3: Audit swallowed exceptions and silent failure paths - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-14
**Phase:** 3-audit-swallowed-exceptions-and-silent-failure-paths
**Areas discussed:** Completion bar & scope, How a deliberate guard is written, How failures reach the user, Background logging channel

All four offered gray areas were selected for discussion.

---

## Completion bar & scope

**Q1 — What counts as Phase 3 being done?**

| Option | Description | Selected |
|--------|-------------|----------|
| Zero bucket-B errors in `src/` | All 31 swallowed-exception + 1 silent-recovery cleared; warnings may remain | ✓ |
| Zero bucket-B findings at all | All 59 cleared, warnings included | |
| Every site triaged, count is an outcome | Review all 33 files; count is whatever triage produces | |

**User's choice:** Zero bucket-B errors in `src/` → D-01
**Notes:** Error severity is what actually fails `lint:ci` on a touched file, which is the friction Phase 2's calibration measured.

**Q2 — How should the work be sequenced across the 33 files?**

| Option | Description | Selected |
|--------|-------------|----------|
| Decryption/signer wave first | Wave 1 = sites where a swallowed error hides user-facing failure; wave 2 = the rest | ✓ |
| Group by remedy, not by risk | One wave per treatment; uniform commits, risk spread out | |
| Group by file cluster / directory | Work through `src/` by area | |

**User's choice:** Decryption/signer wave first → D-02
**Notes:** Matches the roadmap goal's "resolved first" wording.

**Q3 — Should this phase also write the error-handling convention down?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add it to AGENTS.md | Extend §Error Handling, per the Phase 2 precedent | ✓ |
| No — code only this phase | Lint rule + CI gate is the enforcement | |
| Only if the fixes reveal a rule worth stating | Decide at the end | |

**User's choice:** Yes — add it to AGENTS.md → D-03

**Q4 — How should Phase 3 prove it worked, given no test framework?**

| Option | Description | Selected |
|--------|-------------|----------|
| Scoped rescan + manual UAT on the risky wave | Scan evidence plus exercising the decryption paths in the app | |
| Scoped rescan only | Finding count 32 → 0 with a per-file before/after table | ✓ |
| Add the first real tests here | Introduce vitest, cover the pure helpers | |

**User's choice:** Scoped rescan only → D-04

---

## How a deliberate guard is written

Before this area, a probe measured which remedies actually clear `ai-slop/swallowed-exception`,
using variants of the shape of `src/helpers/parse.ts`. Result: a comment alone does **not** clear
the rule; an explicit `return` does; a narrowed rethrow clears everything. The options below were
written from that evidence rather than from assumption.

**Q1 — Default treatment for genuine parse guards?**

| Option | Description | Selected |
|--------|-------------|----------|
| Narrow + rethrow anything unexpected | Only fully-clean remedy; needs per-site error-type judgment | |
| Explicit return + reason comment | Clears error and no-empty; uniform; no error-type judgment | ✓ |
| Rule-scoped inline ignore with reason | Smallest diff; leaves no-empty; reads as silencing the linter | |

**User's choice:** Explicit return + reason comment → D-05

**Q2 — Fix the leftover `no-unused-vars` on the `(e)` binding in passing?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — bare `catch {` where `e` is unused | Touched files carry no residue into future PRs | ✓ |
| No — leave the binding, that's Phase 4 | Cleaner phase boundary | |
| Only where the line is already being rewritten | Same set; states the rule as "no drive-by edits" | |

**User's choice:** Yes — bare `catch {` → D-06

**Q3 — Is a rule-scoped inline ignore ever the right answer?**

| Option | Description | Selected |
|--------|-------------|----------|
| Last resort, needs a stated justification | Reason must say why the code couldn't be fixed instead | ✓ |
| Off the table for this phase | Every error site gets a real code change | |
| Fine wherever the guard is genuinely deliberate | Equal standing with the explicit return | |

**User's choice:** Last resort with stated justification → D-07

**Q4 — How prescriptive should the reason comment be?**

| Option | Description | Selected |
|--------|-------------|----------|
| Free-form but must name what failed and why it's safe | AGENTS.md states the bar; review enforces | ✓ |
| Fixed prefix convention | Greppable marker; boilerplate-ish | |
| No requirement beyond being present | Content is the author's judgment | |

**User's choice:** Free-form with a required substance bar → D-08

---

## How failures reach the user

A survey of the eleven candidate sites ran before this area's follow-ups. It showed that several
sites the scan's "top files" reading implies are user-facing are actually parse/filter guards
(`stream-top-zappers.tsx:19`, `app-handler-modal:138`, `receive-token-modal:36`,
`relay-url-input:62`, `import-events-button:22`); these were reclassified to the D-05 rule rather
than asked about.

**Q1 — Default way a swallowed error in a user-triggered action reaches the user?**

| Option | Description | Selected |
|--------|-------------|----------|
| Convert to `useAsyncAction` and let it throw | The AGENTS.md REQUIRED pattern; toasts and logs | ✓ |
| Inline `useToast` at the catch site | Smaller diffs; second pattern in components | |
| Per-site judgment, no single default | Most faithful per call site; no rule to document | |

**User's choice:** Convert to `useAsyncAction` → D-09

**Q2 — What do the deliberate best-effort fallbacks need?**

| Option | Description | Selected |
|--------|-------------|----------|
| Log the cause, keep the fallback silent | UX identical; cause recoverable when investigating | ✓ |
| Comment only — the fallback is the handling | Smallest change; no trace of a WebLN/wallet failure | |
| Surface the final failure, log the attempts | Most diagnostic; touches surrounding logic | |

**User's choice:** Log the cause, keep the fallback silent → D-10

**Q3 — How should `decrypt-placeholder.tsx:23`'s failure show?**

| Option | Description | Selected |
|--------|-------------|----------|
| Use the hook's existing `error` state | Failure stays attached to the message; no new mechanism | ✓ |
| `useAsyncAction` toast, consistent with the rest | Uniform; transient app-level toast per message | |
| Both — toast the action, keep the inline state | Best feedback; risks double-reporting | |

**User's choice:** Use the hook's existing error state → D-11
**Notes:** A follow-up check of `hooks/use-legacy-message-plaintext.ts` confirmed `unlock()` already
catches internally and sets `error`, so it never throws — the component's try/catch is redundant and
should simply be deleted. This made the chosen option strictly simpler than it appeared when asked.

---

## Background logging channel

**Q1 — Which logging channel for service/hook sites and the logged fallbacks?**

| Option | Description | Selected |
|--------|-------------|----------|
| Namespaced debug logger (`helpers/debug.ts`) | Existing services pattern; silent in prod; no console-leftover | ✓ |
| `console.warn` / `console.error` | Always visible; adds bucket-G findings | |
| Split by failure kind | Most informative; per-site judgment; still adds findings | |

**User's choice:** Namespaced debug logger → D-12

**Q2 — Are the four warning-severity strays in scope?**

| Option | Description | Selected |
|--------|-------------|----------|
| In scope — they're the same audit | Bounded set; closes bucket B properly | ✓ |
| Only the error, defer the four warnings | Tightest scope; no overlap with Phase 4's sqlite file | |
| Case by case once I've seen them | Decide per stray after review | |

**User's choice:** In scope → D-13
**Notes:** `services/sqlite/index.ts` is shared with Phase 4's deliberate dead code; flagged so the
two phases don't collide.

**Q3 — How should `use-timeline-cache-key.ts:14`'s hidden-fallback be treated?**

| Option | Description | Selected |
|--------|-------------|----------|
| False positive — ignore with a reason | Keep the code; reason states the nanoid is the first-render value | ✓ |
| Restructure so there's no fallback expression | Clears it with no directive; changes working semantics | |
| Leave it entirely — not this phase's problem | No diff; next person re-litigates it | |

**User's choice:** False positive, ignore with a reason → D-14
**Notes:** The first exercise of the D-07 last-resort clause.

**Q4 — How should `index.tsx:49`'s silent-recovery be fixed?**

| Option | Description | Selected |
|--------|-------------|----------|
| Log via the namespaced logger, including the error | Consistent with D-12; also removes a console-leftover finding | ✓ |
| `console.error` with the error included | Visible without enabling a namespace; keeps the finding | |
| Drop the log, comment why it's ignorable | Simplest; nothing records that registration failed | |

**User's choice:** Namespaced logger including the error → D-15

---

## Claude's Discretion

None — the user selected a concrete option for every question.

## Deferred Ideas

- Making `import-events-button`'s "Imported N events" count honest about silently dropped lines.
- The wider `encrypted-storage.tsx` crypto concerns (AES-CBC without authentication, low PBKDF2
  work factor) that the swallowed error at :171 partly masks.
- Surfacing event-cache buffered write failures to callers.
- Adding a test framework — considered as this phase's verification and rejected (D-04).
