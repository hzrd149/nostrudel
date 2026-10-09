---
phase: quick-261009-ie3
plan: 01
subsystem: user-profile
tags: [napplets, user-profile, app-store]
status: complete
requirements: [QUICK-261009-IE3]
key-files:
  created:
    - src/views/napplets/components/napplet-store-card.tsx
    - src/views/user/tabs/napplets.tsx
    - .changeset/user-napplets-tab.md
  modified:
    - src/helpers/nostr/napplets.ts
    - src/views/app/store.tsx
    - src/views/user/routes.tsx
commits:
  - 5b1c0a14a refactor(quick-261009-ie3): share napplet store card and listing predicate
  - 8a8cd88aa feat(quick-261009-ie3): add Napplets tab to user profiles
completed: 2026-10-09
---

# Quick 261009-ie3: Napplets tab on user profiles

User profiles now have a "Napplets" tab (puzzle-piece icon, after Media) that shows "N napplet(s) published" and a grid of the user's napplets, each with an Open button linking to `/app/<naddr>`.

## What changed

- `isValidNappletStoreEvent` moved from `store.tsx` to `src/helpers/nostr/napplets.ts` (exported, logic unchanged).
- `NappletStoreCard` moved to `src/views/napplets/components/napplet-store-card.tsx`. It is now `Card as={LinkBox}` with a Chakra `LinkOverlay` title link to `/app/store/<naddr>`, which avoids a nested anchor. It has an opt-in `showOpenButton` prop that renders an "Open <title>" button to `/app/<naddr>`. The App Store grid renders it without the button, so it looks and navigates as before.
- `UserNappletsTab` loads kinds 15129 and 35129 by the profile pubkey from the user's outbox relays, filtered by `isValidNappletStoreEvent`. It shows the pluralized count heading or "No napplets found for this user.", a responsive grid and a Load More button.
- Registered in `userProfileTabs` after Media (lazy), so it appears in the tab bar and the Select View modal.
- Added a minor changeset.

## Verification

- `pnpm exec tsc --project tsconfig.json`: exit 0
- `pnpm test`: 4 files, 29 tests passed
- aislop hook: no findings on the new or edited files.
- The worktree had no `node_modules`, so a symlink to the main checkout's `node_modules` was created locally for typecheck and tests. It is not tracked.

## Outstanding manual verification

The manual `pnpm dev` spot-check from the plan was NOT performed. The following remain unverified in a browser: the tab appears in the bar and in the Select View modal, the count matches the cards, the Open button launches `/app/<naddr>`, a card click opens `/app/store/<naddr>`, and App Store Discover cards look and behave the same as before (no Open button).

## Deviations from Plan

None. The plan was executed as written.

## Known Stubs

None.

## Threat Flags

None. The new surface (Open link to `/app/<naddr>`) reuses the existing sandboxed launch route.
