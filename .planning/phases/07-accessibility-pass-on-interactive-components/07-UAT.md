---
status: testing
phase: 07-accessibility-pass-on-interactive-components
source: [07-VERIFICATION.md]
started: 2026-10-06T00:00:00Z
updated: 2026-10-06T00:00:00Z
---

## Current Test

number: 1
name: Wallet cards are keyboard-selectable (D-07)
expected: |
  Settings > Wallet: Tab reaches each card's select button with a visible focus ring; Enter/Space select it; Tab then reaches Remove; Remove does not select; clicking the card (except Remove) selects
awaiting: user response

## Tests

### 1. Wallet cards are keyboard-selectable (D-07)
expected: Tab reaches each card's select button with a visible focus ring; Enter/Space select it; Tab then reaches Remove; Remove does not select; clicking the card (except Remove) selects
result: [pending]

### 2. Relay icon stack is a real button (D-07)
expected: Tab focus shows an inset ring that is not clipped; Enter, Space and click open the relay popover
result: [pending]

### 3. "Show More" is no longer a fake control (D-04/D-07)
expected: In a compact note (notifications), "Show More" looks the same, is not a Tab stop and is not announced as a button
result: [pending]

### 4. Landmarks in the accessibility tree (D-06/D-19/D-20)
expected: DevTools AX tree shows exactly one `main` per page (including torrents/webxdc "new" pages, whose forms still submit); article page `main "Article Content"` containing an `article` and `list "Article tags"`; `list "Available relays"`; `region "Link details"`; `region "Payment options"`; mobile drawer is a named `dialog` containing `navigation "Main navigation"`; desktop `navigation "Main navigation"`
result: [pending]

### 5. No page-wide live region (D-04)
expected: With a screen reader on a VerticalPageLayout view (e.g. timeline refresh), content changes are no longer announced
result: [pending]

### 6. Composer autocomplete (D-11)
expected: Typing `@ali` and `:smi` shows suggestions; arrow/Enter and click both insert; items show avatar/name/emoji as before
result: [pending]

### 7. Relay URL input suggestions (D-10)
expected: Typing in a relay URL input shows datalist suggestions; Enter and blur normalize to `wss://`
result: [pending]

### 8. Privacy share-service suggestions (D-12)
expected: Settings > Privacy "Share service" input shows the same four suggestions
result: [pending]

### 9. Iframe titles and webxdc (D-09)
expected: SoundCloud, song.link and webxdc iframes expose titles in the AX tree; webxdc apps still load and run
result: [pending]

### 10. Visual parity (D-13)
expected: Light/dark, mobile/desktop: wallet cards, relay icon stack, article page and tags row, article/thread/app cards (hover overlay covers the whole card), relay filter list, drawer, side nav, invoice modal all look as before
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0
blocked: 0

## Gaps
