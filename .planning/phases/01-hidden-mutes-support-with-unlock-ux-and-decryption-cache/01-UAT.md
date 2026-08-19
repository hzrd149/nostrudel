---
status: testing
phase: 01-hidden-mutes-support-with-unlock-ux-and-decryption-cache
source: [01-VERIFICATION.md]
started: 2026-08-19T18:45:00Z
updated: 2026-08-19T18:45:00Z
---

## Current Test

number: 1
name: M-1 (D-01) — reload with hidden mutes + locked cache produces zero unprompted signer prompts
expected: |
  No NIP-07/nostr-connect popup at any point with both auto-unlock preferences at default false.
awaiting: user response

## Tests

### 1. M-1 (D-01): reload the app with a hidden-mute-containing list and locked decryption cache; confirm zero signer prompts appear unprompted
expected: No NIP-07/nostr-connect popup at any point with both auto-unlock preferences at default false
result: [pending]

### 2. M-9: merged isMuted flips from Mute to Unmute label on hidden-mutes unlock without reload (WINDOWS.md #1)
expected: Note menu shows "Mute User" while locked, "Unmute User" immediately after unlock with no reload
result: [pending]

### 3. M-8 part 1: public unmute regression — published kind-10000 drops the p tag and any stale mute_expiration tag (WINDOWS.md #2)
expected: Unmuting a publicly-muted pubkey removes it and its expiration tag from the republished event
result: [pending]

### 4. M-4 (D-07): timelines silently under-filter while hidden mutes are locked, no banner appears anywhere (WINDOWS.md #3)
expected: An event from a locked-hidden-muted pubkey is visible pre-unlock, filtered post-unlock, with no banner/warning ever shown
result: [pending]

### 5. M-3 (D-06): cross-device mute-list replacement returns the mutes pending count to 1 with no automatic re-unlock (WINDOWS.md #4)
expected: A replacement kind-10000 event from another device re-locks the category and waits for the user
result: [pending]

### 6. M-6 mechanism half (D-09): pending decryption-cache item visible via debug console, count drops to zero after correct password (WINDOWS.md #5)
expected: decryption-cache category reports pending at default encryptDecryptionCache=true and clears on correct password
result: [pending]

### 7. M-2 (D-02/D-03/D-09): side-nav pending count reads 2, survives collapse as icon+badge, drops on unlock, disappears on full unlock, mobile drawer parity (WINDOWS.md #6)
expected: Nav affordance visible with count 2 (mutes+cache), same behavior collapsed and in the mobile drawer
result: [pending]

### 8. M-5 (D-08): rejecting the signer prompt in the nav modal toasts once, count unchanged, immediately retryable with no reload (WINDOWS.md #7)
expected: Denying the signer request produces exactly one toast, pending count is unchanged, retry works without reload
result: [pending]

### 9. M-6 (D-09) reachability half: decryption-cache password row reachable and functional from the side-nav affordance without visiting /messages (WINDOWS.md #8)
expected: A profile that never visited /messages can still unlock the cache from the nav modal
result: [pending]

### 10. D-04/D-05 manual UAT: Privacy settings shows exactly two rows (Mute lists, Message cache) while unlock-all is off, toggling a row changes app-start prompt behavior, unlock-all hides the rows (WINDOWS.md #9)
expected: Exactly two registry-driven rows, persisted toggle changes app-start signer behavior on the next load
result: [pending]

### 11. M-7 (D-10/D-11/D-12): Private section locked placeholder, unlock, and re-render without reload (WINDOWS.md #10)
expected: Locked placeholder with no count while locked; pubkey-only list after unlock without reload; no duplication with public list; absent entirely with no hidden content
result: [pending]

### 12. M-8 part 2 (D-13/D-14 hidden half): Remove on a Private-section row publishes a real replacement event and survives reload+re-unlock (WINDOWS.md #11)
expected: Removing a private row is a real, non-no-op publish; the pubkey is genuinely absent from getHiddenMutedThings after reload+re-unlock
result: [pending]

### 13. CR-01 design-tradeoff sign-off (D-15): confirm the accepted public-duplicate consequence is still wanted
expected: |
  Pressing Mute on a pubkey that is privately muted but currently locked adds a public duplicate,
  because listAddPerson dedupes only within a half. D-15 in 01-CONTEXT.md explicitly documents and
  accepts this, and cross-half deduplication is listed under Deferred Ideas. The independent code
  review flagged it Critical on privacy grounds (a mute the user meant to keep private becomes
  public). Decide: accept as designed (record an overrides: entry), or schedule a follow-up applying
  the same half-guard to mute() that 01-02 applied to unmute().
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0
blocked: 0

## Gaps
