---
phase: 07-accessibility-pass-on-interactive-components
plan: 02
subsystem: ui
tags: [a11y, landmarks, aria, chakra-ui, jsx-a11y]
requires: []
provides:
  - "VerticalPageLayout renders a native main element (one main landmark per page)"
  - "Mobile drawer is a named dialog containing a named nav"
affects: [07-06]
tech-stack:
  added: []
  patterns: ["native element via Chakra `as` instead of explicit role", "delete roles Chakra already renders"]
key-files:
  created: []
  modified:
    - src/components/vertical-page-layout.tsx
    - src/views/torrents/new.tsx
    - src/views/webxdc/new.tsx
    - src/components/layout/desktop/side-nav.tsx
    - src/components/note-filter-type-buttons.tsx
    - src/components/invoice-modal.tsx
    - src/components/layout/mobile/nav-drawer.tsx
decisions:
  - "Two creation views nest their form inside VerticalPageLayout so the layout's main is not overridden (planned)"
metrics:
  tasks: 3
  files: 7
completed: 2026-10-06
status: complete
---

# Phase 7 Plan 02: Layout and navigation landmarks Summary

VerticalPageLayout now renders a native `main` with no page-wide live region, redundant nav/group roles are deleted, the invoice modal body is a named `section`, and the mobile drawer is a named dialog containing a named `nav`.

## Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 1 | aaa4daea0 | refactor(07-02): render VerticalPageLayout content as a main element |
| 2 | 9dc1ac859 | refactor(07-02): drop redundant nav and group roles, render invoice body as a section |
| 3 | 7a50a0ea3 | fix(07-02): stop announcing page content changes and name the mobile nav dialog |

## Results

- `pnpm build` passed after each task.
- Bucket-F findings in the seven files went 6 to 0; the only remaining diagnostic is the pre-existing `react/incompatible-library` in `src/views/torrents/new.tsx`.
- No `aislop-ignore` directive added. Outer scroll Box of VerticalPageLayout untouched. `views/articles/article.tsx` not edited.
- `onSubmit={onSubmit}` moved unchanged onto the nested form Flex in `torrents/new.tsx` and `webxdc/new.tsx` (T-07-04); `onClick={handleClickItem}` and `returnFocusOnClose={true}` still present on the drawer (T-07-05).

## Deviations from Plan

None - plan executed exactly as written.

## Manual UAT items for /gsd-verify-work (D-15)

- Exactly one `main` landmark per page, including the torrents and webxdc creation pages; both forms still submit.
- Screen readers no longer announce content changes on VerticalPageLayout pages.
- Mobile drawer exposes a dialog named "Main navigation menu" containing a nav named "Main navigation".
- Visual parity of the drawer, desktop side nav, invoice modal and VerticalPageLayout pages (including the form pages' spacing and width).

## Known Stubs

None.

## Self-Check: PASSED

All seven modified files exist; commits aaa4daea0, 9dc1ac859, 7a50a0ea3 present in git log.
