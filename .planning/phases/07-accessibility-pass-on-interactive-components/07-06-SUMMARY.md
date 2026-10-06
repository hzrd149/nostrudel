---
phase: 07-accessibility-pass-on-interactive-components
plan: 06
subsystem: ui
tags: [a11y, jsx-a11y, chakra-ui, landmarks, semantic-html]

requires:
  - phase: 07-accessibility-pass-on-interactive-components
    provides: "07-02 VerticalPageLayout renders its inner Flex as main"
provides:
  - "Article page with a single main, native footer and article elements, no wrong heading role"
  - "ArticleTags as a native ul/li inline list"
  - "ArticleCard, thread ParentCard and AppCard as LinkBox articles"
affects: [07-verify-work, accessibility UAT]

tech-stack:
  added: []
  patterns:
    - "LinkBox as=article instead of Box/Flex as={LinkBox} role=article (keeps position relative for HoverLinkOverlay)"
    - "Chakra Box as=ul + Link as=li display=inline listStyleType=none for inline tag lists"

key-files:
  created: []
  modified:
    - src/views/articles/article.tsx
    - src/views/articles/components/article-tags.tsx
    - src/views/articles/components/article-card.tsx
    - src/views/thread/index.tsx
    - src/views/other-stuff/component/app-card.tsx

key-decisions:
  - "Removed the view's own main role because VerticalPageLayout (07-02) already renders main"
  - "Deleted role=heading on the article header instead of adding aria-level (D-08)"
  - "AppCard uses LinkBox as=article display=flex rather than Flex as=article, preserving position relative"

patterns-established:
  - "Native element over ARIA role for structure and landmarks (D-06)"

requirements-completed: [D-06, D-08, D-13, D-14, D-16, D-17, D-20]

duration: 10min
completed: 2026-10-06
status: complete
---

# Phase 07 Plan 06: Article views and link cards Summary

**Article page and three link cards converted from ARIA roles to native footer/article/ul/li and LinkBox-as-article elements, clearing 10 jsx-a11y findings with no visual change.**

## Accomplishments

- `article.tsx`: removed the duplicate `main` role (layout provides it), author block is now `<Box as="footer">`, content block is `<Box as="article">`, header Box lost `role="heading"` (the `h1` is the only heading). Remaining `role=` attributes are `doc-subtitle` and the two `toolbar`s, untouched as planned.
- `article-tags.tsx`: `Box as="ul"` with `Link as="li" display="inline"` and `listStyleType="none"` on both; no list role added back.
- `article-card.tsx`, `thread/index.tsx`, `app-card.tsx`: `LinkBox as="article"` roots with the role removed; `HoverLinkOverlay` still bounded by the LinkBox's `position: relative`.
- Bucket-F findings in the five files went 10 -> 0, and the full scan shows 0 diagnostics of any rule in them.

## Task Commits

1. Task 1 (article footer, content, tags): `6ec426968` refactor(07-06)
2. Task 2 (link cards as LinkBox articles): `72f8eebe8` refactor(07-06)
3. Task 3 (delete article header heading role): `b004fdc86` fix(07-06)

## Deviations from Plan

### Auto-fixed Issues

None for code. One cosmetic discrepancy in an acceptance check: Prettier wraps the `Link` in `article-tags.tsx` onto one prop per line, so the literal grep `grep -c 'as="li" display="inline"'` prints 0 instead of 1. `as="li"`, `display="inline"` and both `listStyleType="none"` (count 2) are present; the intent of the criterion is met.

## Verification

- Precondition `grep -c 'as="main"' src/components/vertical-page-layout.tsx` = 1.
- `pnpm build` passed after each task; `tsc --noEmit` clean after Task 2 (ref type change from Box to LinkBox is accepted).
- Full-project `aislop scan`: 0 diagnostics in the five files after each task (after Task 1, only the two line-42 findings remained, as planned).
- `prettier --check` passes; `grep -c 'role=' article.tsx` = 3; `aria-level` count = 0.

## Manual UAT for /gsd-verify-work (D-15)

- Article page AX tree shows exactly one `main "Article Content"`, an `article`, a `footer` inside it, and `list "Article tags"`.
- Article page (title, subtitle, author row with floated avatar, date, tags, toolbars, comments) looks unchanged; the tags row is inline, blue, no bullets, with the `mr="2"` gap.
- Article card, thread parent card and app card keep their box model and the overlay click area covers the whole card, in light and dark mode and at mobile and desktop widths.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- Files modified exist; commits 6ec426968, 72f8eebe8, b004fdc86 present in git log.
