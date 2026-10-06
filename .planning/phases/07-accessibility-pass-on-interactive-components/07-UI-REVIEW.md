# Phase 7 — UI Review

**Audited:** 2026-10-06
**Baseline:** 07-UI-SPEC.md (approved, with checker resolutions)
**Screenshots:** not captured (code-only audit; maintainer UAT 10/10 covered visual parity)
**Scope:** `git diff e739dfddb..HEAD -- src` (24 files)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Accessible names match the spec; webxdc iframe title can be the raw app name with no "app" context, and `"Webxdc app"` fallback is bypassed when the name is empty-string-like |
| 2. Visuals | 3/4 | Parity preserved; two different focus-ring treatments introduced (outline vs `boxShadow: outline`) |
| 3. Color | 4/4 | No new colors; focus ring uses `primary.500` token; wallet active border unchanged |
| 4. Typography | 4/4 | No size/weight changes; `Text as="span"` inside the wallet button keeps the same styles |
| 5. Spacing | 3/4 | Legacy `p="3"` / `gap="0.5"` kept per D-13; one new `mr="3"` on the Remove button added to rebuild padding |
| 6. Experience Design | 3/4 | Real buttons, single `main`, no page live region; leftover named generic div (scroll container) and Remove has no confirmation |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Inconsistent focus indicators** — keyboard users see a 2px inset outline on the relay icon stack (`relay-icon-stack.tsx` `_focusVisible={{ outline: "2px solid", outlineColor: "primary.500", outlineOffset: "-2px" }}`) but Chakra's `boxShadow: "outline"` ring on the wallet select button (`settings/wallet/index.tsx`). — Pick one (Chakra `boxShadow: "outline"` with an inset variant where clipping is a concern) and use it in both places.
2. **Scroll container still carries `aria-label="Main content"` on a generic `div` with `tabIndex={0}`** (`vertical-page-layout.tsx`) — `aria-label` on a role-less div is prohibited ARIA and not reliably announced; screen readers hear an unnamed focus stop before `main`. — Remove the label (the `main` inside is the landmark), or give it `role="region"` deliberately. Pre-existing, but this file was touched in this phase.
3. **Wallet "Remove" is a one-click destructive action** (`settings/wallet/index.tsx`) — now that it is a separate Tab stop next to the select button, an accidental Enter deletes a wallet. — Add a confirm step (Chakra `AlertDialog` or `window.confirm`), consistent with other destructive actions in the app.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- PASS: iframe titles `"Song.link player"`, `"SoundCloud player"` (`content/links/music.tsx`) match the spec table.
- PASS: `aria-label="Use {wallet.name}"` / `"Remove {wallet.name}"`, `"Available relays"`, `"Link details"`, `"Article tags"`, `"Main navigation"` all match.
- WARNING: `webxdc-player.tsx` passes `title={getWebxdcName(event)}`; the result is the bare app name (prefix `Webxdc app:` is stripped), so the frame announces e.g. "Chess" with no indication it is an embedded app. Default `title = "Webxdc app"` in `webxdc.tsx` only applies when the prop is `undefined`, not `""`. Suggest `` title={`${name || "Webxdc"} app`} ``.
- WARNING: drawer now has two near-duplicate names: dialog `"Main navigation menu"` wrapping navigation `"Main navigation"` (`nav-drawer.tsx`). Acceptable, but slightly redundant when announced.

### Pillar 2: Visuals (3/4)
- PASS: "Show More" keeps `fontWeight="bold" ml="4"` and is no longer a fake button (`compact-note-content.tsx`).
- PASS: `LinkBox as="article"` on article and app cards keeps `position: relative`, so `HoverLinkOverlay` still covers the card (per checker resolution).
- WARNING: two focus ring styles (see Fix 1).
- WARNING: wallet select button uses `rounded="inherit"` on a button that only fills the left part of the card, so the focus ring corners on the right side are rounded where the card is not. Small visual glitch; UAT did not flag it.

### Pillar 3: Color (4/4)
- No hardcoded colors added. The only color token added is `primary.500` on the relay stack focus outline; `color="inherit"`/`bg="transparent"` resets on converted buttons keep the look the same. Tag links keep `blue.500`.

### Pillar 4: Typography (4/4)
- No font size or weight changes in the diff. `Text as="span"` for wallet name/balance keeps `fontWeight="bold"` / `fontSize="sm"`; `lineHeight="inherit"` stops the button's own line-height from shifting the layout.

### Pillar 5: Spacing (3/4)
- PASS: legacy `p="3"`, `gap="0.5"` preserved (D-13, checker flag resolved).
- WARNING: the card's `p="3"` moved onto the button and `mr="3"` was added to the Remove `IconButton` to make up the spacing. The values are on-scale, but the layout now depends on two places that must stay in sync.
- PASS: `ul` lists use `listStyleType="none"`; Chakra's CSS reset removes the default `ul` padding, so no indent appears.

### Pillar 6: Experience Design (3/4)
- PASS: `role="button"` divs replaced by real `<button type="button">` (wallet, relay stack); `stopPropagation` hack removed because the buttons are now siblings.
- PASS: `VerticalPageLayout` pins `as="main"` after spreading props, so there is exactly one `main`; `aria-live="polite"` removed (D-04).
- PASS: ARIA removed from the native `datalist`/combobox (D-10); `role="heading"` / `role="contentinfo"` misuse removed from the article header.
- WARNING: named generic scroll div (Fix 2).
- WARNING: no confirmation on Remove wallet (Fix 3).

---

## Registry Safety

shadcn is not initialized (Chakra project) and no dependencies were added. Registry audit skipped.

---

## Files Audited
src/components/compact-note-content.tsx, src/components/content/links/music.tsx, src/components/invoice-modal.tsx, src/components/layout/desktop/side-nav.tsx, src/components/layout/mobile/nav-drawer.tsx, src/components/loading-nostr-link.tsx, src/components/magic-textarea.tsx, src/components/note-filter-type-buttons.tsx, src/components/relay-icon-stack.tsx, src/components/relay-url-input.tsx, src/components/timeline-page/index.tsx, src/components/user/user-avatar.tsx, src/components/vertical-page-layout.tsx, src/components/webxdc/webxdc.tsx, src/views/articles/article.tsx, src/views/articles/components/article-card.tsx, src/views/articles/components/article-tags.tsx, src/views/other-stuff/component/app-card.tsx, src/views/settings/privacy/index.tsx, src/views/settings/wallet/index.tsx, src/views/thread/index.tsx, src/views/torrents/new.tsx, src/views/webxdc/components/webxdc-player.tsx, src/views/webxdc/new.tsx
