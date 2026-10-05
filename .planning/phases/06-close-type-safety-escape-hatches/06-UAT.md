---
status: testing
phase: 06-close-type-safety-escape-hatches
source: [06-VERIFICATION.md]
started: 2026-10-05T17:15:00Z
updated: 2026-10-05T17:15:00Z
---

## Current Test

number: 1
name: Clear cache data completes (D-07)
expected: |
  Settings > Cache > Database > Clear cache data: spinner stops, page reloads, no NotFoundError in the console
awaiting: user response

## Tests

### 1. Clear cache data completes (D-07)
expected: Settings > Cache > Database > Clear cache data: spinner stops, page reloads, no NotFoundError in the console
result: [pending]

### 2. IndexedDB migrations still run (D-05/D-06/D-08)
expected: Fresh profile (clear site data) boots with no console errors (v0 -> v13); an existing profile boots with its accounts intact
result: [pending]

### 3. Napplet subscribe and publish (D-11)
expected: Inside a napplet, a subscription returns events and a publish reports success
result: [pending]

### 4. WebLN wallet balance (D-11)
expected: With a WebLN provider connected, the wallet view still shows the balance
result: [pending]

### 5. webxdc app lifecycle (D-11/D-14/D-15)
expected: A webxdc app loads, receives webxdc.init, and can send and receive a state update
result: [pending]

### 6. @-mention autocomplete (D-11/D-12)
expected: Typing @ in a note composer (MagicTextArea) and in stream chat (MagicInput) opens the autocomplete
result: [pending]

### 7. Paste-to-upload in stream chat (D-11)
expected: Pasting an image into the stream chat input uploads it
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
