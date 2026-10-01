---
status: testing
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
source: [05-VERIFICATION.md]
started: 2026-10-01T15:43:17Z
updated: 2026-10-01T15:43:17Z
---

## Current Test

number: 1
name: Napplet consent flow: load a napplet that requests ungranted capabilities; choose Deny, Allow once, Always allow; dismiss with ESC/overlay; trigger an intent with no/multiple handlers
expected: |
  Modal appears; deny refuses on next request; allow-once does not survive frame reload; always-allow persists and skips the prompt; dismissal is treated as deny; intent-choice routes to the chosen napplet and cancel resolves with no handler
awaiting: user response

## Tests

### 1. Napplet consent flow: load a napplet that requests ungranted capabilities; choose Deny, Allow once, Always allow; dismiss with ESC/overlay; trigger an intent with no/multiple handlers
expected: Modal appears; deny refuses on next request; allow-once does not survive frame reload; always-allow persists and skips the prompt; dismissal is treated as deny; intent-choice routes to the chosen napplet and cancel resolves with no handler
result: [pending]

### 2. Napplet services end-to-end: Blossom upload, resource.bytes / resource.bytesMany with and without resource:fetch grant, common actions (follow/react/report), signature verification via the late-bound verifyEvent
expected: Unapproved non-Blossom origins denied; batch returns per-URL results; valid/invalid signatures accepted/rejected
result: [pending]

### 3. Wallets: connect WebLN, NWC and NIP-60 wallets; balance, history, create invoice, pay, rename, remove, unlock
expected: Identical to pre-split behaviour
result: [pending]

### 4. Post-modal composer: plain post, PoW mine-and-publish, dismiss mid-mine; webxdc mini-app calling sendUpdate/setUpdateListener/getAllUpdates/sendToChat/importFiles and realtime channel join/send/leave
expected: Exactly one publish; no re-mine loop; dismissal tears down workers and publishes nothing; webxdc requests and unknown-method error unchanged; leave() aborts subscription
result: [pending]

### 5. Background-worker settings cards: per-row Clear spinner, Clear All, Update offline cache, Check for Update (three toast variants); and the error toast on a forced failure
expected: Loading/disabled states render per row; toasts appear. Note the error toast is now `description: e.message` only (see WR-02)
result: [pending]

### 6. Magic autocomplete (:, @ triggers in MagicInput and MagicTextArea, ref focus), article-reader voice sliders, error-logger console grouping, notifications loaders replay on re-open
expected: Unchanged behaviour (05-05, 05-06 outstanding lists)
result: [pending]

### 7. Direct-message settings modal: relay lists and NIP-17-self empty-state Alert; send one NIP-17 and one NIP-04 message
expected: Correct relay lists and empty states; send completes to the right relay set (highest-stakes item: encrypted DM path, 05-06)
result: [pending]

### 8. Notifications index at zero count (WR-01): open /notifications with a time range that yields zero for some category
expected: Zero-count rows should look as before (no extra 8px gap). Currently expected to FAIL; fix first, then confirm
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
