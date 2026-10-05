---
phase: 06-close-type-safety-escape-hatches
fixed_at: 2026-10-05T16:00:00Z
review_path: .planning/phases/06-close-type-safety-escape-hatches/06-REVIEW.md
iteration: 1
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 6: Code Review Fix Report

**Fixed at:** 2026-10-05T16:00:00Z
**Source review:** .planning/phases/06-close-type-safety-escape-hatches/06-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 1 (fix scope is Critical + Warning; IN-01, IN-02 and IN-03 were left alone)
- Fixed: 1
- Skipped: 0

## Fixed Issues

### WR-01: `parseTimeUnit` silently maps unknown unit letters to hours

**Files modified:** `src/views/tools/event-console/process.ts`, `src/views/tools/event-console/process.test.ts`
**Commit:** 5e92a0b5b
**Applied fix:** `TIME_UNITS` is now an `as const satisfies Record<string, ManipulateType>` table. A new `isTimeUnitLetter` guard uses `Object.hasOwn`, so inherited keys such as `toString` are not treated as units. `parseTimeUnit` still returns `"hour"` when no letter is given (D-18). It lowercases the letter, throws `Unknown time unit <letter>` for anything not in the table, and otherwise returns the table entry. The `?? "hour"` fallback is gone. I kept the regex in `processDateString` as it was. It can only capture `[hwmsd]`, case-insensitive, and each of those lowercases to a table key. I checked in node that non-ASCII lookalikes (`ſ`, `İ`, `ı`, Kelvin sign) do not match the regex. So the set of inputs `processDateString` accepts has not changed, and D-15 still holds. One new vitest case covers the changed `parseTimeUnit` contract: it throws for `y`, `X` and `toString`.

**Verification:**
- `tsc --noEmit -p tsconfig.json`: passes.
- `vitest run`: 4 files and 29 tests pass.
- `aislop scan --changes`: 100/100, no findings.

I ran tsc and vitest through `node_modules/.bin` because `pnpm exec` and `pnpm test` stopped on pnpm's deps-status check in the temporary worktree.

**Status note:** This changes the contract of an exported function. It now throws where it used to fall back silently. No reachable input from `processDateString` behaves differently. It is still worth a quick human look.

---

_Fixed: 2026-10-05T16:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
