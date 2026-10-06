---
phase: 07-accessibility-pass-on-interactive-components
fixed_at: 2026-10-06T21:48:00Z
review_path: .planning/phases/07-accessibility-pass-on-interactive-components/07-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 07: Code Review Fix Report

**Fixed at:** 2026-10-06T21:48:00Z
**Source review:** .planning/phases/07-accessibility-pass-on-interactive-components/07-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (CR-01, WR-01, WR-02, WR-03; IN-01..IN-04 out of scope and untouched)
- Fixed: 4
- Skipped: 0

**Verification after every fix:** `pnpm build` (tsc + vite) exit 0, `pnpm test` 29/29 passing, and `prettier --check` clean on the touched files. The final `pnpm exec aislop scan --json .` matched the pre-fix scan exactly: score 86, 562 diagnostics, `jsx-a11y/*` under `src/` = 0, and no new diagnostics in any file. The remaining findings in touched files predate this run: `react-hooks/rules-of-hooks` in `music.tsx:110`, and `react/refs` and `react-hooks/exhaustive-deps` in `magic-textarea.tsx`.

## Fixed Issues

### CR-01: `<footer>` nested inside `<header>` is invalid HTML

**Files modified:** `src/views/articles/article.tsx`
**Commit:** 1d81e264c
**Applied fix:** Took the smallest valid fix: dropped `as="footer"` from the byline, so it renders as a plain `Box` (`div`) with the same `py="2"` and children. The `header` now has no `footer` descendant. Visual parity (D-13) is kept because `footer` and `div` are both unstyled block elements under the Chakra reset. D-20 is unaffected: the `header` stays inside the `<article>`.

### WR-01: `aria-label` on generic `<span>`s is now prohibited ARIA (autocomplete items)

**Files modified:** `src/components/magic-textarea.tsx`
**Commit:** 76ce2e042
**Applied fix:** Removed the `aria-label`s from the three autocomplete item `<span>`s (both emoji branches and the person branch). The item content comes from the visible text, the `UserName`, and the emoji `<Image alt={name}>`, which stays. D-11 left the labels to the planner's judgement, so removing them is within that decision.

### WR-02: song.link embed iframe in a touched file still has no accessible name

**Files modified:** `src/components/content/links/music.tsx`
**Commit:** 1b74c6c67
**Applied fix:** Added `title="Song.link player"` to the `Box as="iframe"` in `renderSongDotLinkUrl`. This matches the SoundCloud iframe's provider-name pattern (D-09).

### WR-03: `VerticalPageLayout` lets callers silently override the `main` landmark

**Files modified:** `src/components/vertical-page-layout.tsx`, `src/components/timeline-page/index.tsx`
**Commit:** e882f2918
**Applied fix:** `VerticalPageLayout` no longer has the `ComponentWithAs<"div", FlexProps>` type. It is now a plain function component typed `Omit<FlexProps, "as">`, and `as="main"` sits after `{...props}`, so a spread can no longer replace the landmark at runtime. `TimelinePage` forwards its props to the layout, so `"as"` was added to its `Omit<FlexProps, ...>` list and it no longer advertises the prop either. No caller passed `as` (verified with grep), so no other callers needed changes and nothing broke. `pnpm build` passes.

---

_Fixed: 2026-10-06T21:48:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
