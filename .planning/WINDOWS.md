---
schema_version: 1
open_count: 9
waived_count: 0
fixed_count: 0
total_count: 9
last_updated: 2026-08-19T17:12:08.254Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | unrun-verify | src/hooks/use-user-mute-actions.ts |  | M-9: merged isMuted flip from Mute to Unmute on hidden-mutes unlock without reload — needs a live signer/relay session, not run in this environment | open |  | 2026-08-19T16:45:43.767Z |  |
| 2 | 01 | unrun-verify | src/components/menu/mute-user.tsx |  | M-8 part 1: public unmute regression (published kind-10000 drops p tag and stale mute_expiration tag) — needs a live signer/relay session, not run in this environment | open |  | 2026-08-19T16:45:43.871Z |  |
| 3 | 01 | unrun-verify | src/services/pending-unlock-mutes.ts |  | M-4 (D-07): timelines silently under-filter while hidden mutes are locked, no banner appears anywhere - needs a live signer/relay session, not run in this environment | open |  | 2026-08-19T16:55:29.272Z |  |
| 4 | 01 | unrun-verify | src/index.tsx |  | M-3 (D-06): a cross-device mute-list replacement returns the mutes pending count to 1 with no automatic re-unlock - needs a live signer/relay session, not run in this environment | open |  | 2026-08-19T16:55:29.373Z |  |
| 5 | 01 | unrun-verify | src/services/pending-unlock-cache.ts |  | M-6 mechanism half (D-09): pending decryption-cache item visible via debug console at default encryptDecryptionCache=true, count drops to zero after correct password - needs a live browser session with enableDebugApi on, not run in this environment | open |  | 2026-08-19T16:55:29.468Z |  |
| 6 | 01 | unrun-verify | src/components/layout/components/pending-unlock-button.tsx |  | M-2 (D-02/D-03/D-09): side-nav pending count 2, collapse-to-icon-badge, unlock-one-drops-to-1, cache-unlock-hides-affordance, plus mobile drawer parity - needs a live signer/relay session, not run in this environment | open |  | 2026-08-19T17:04:03.716Z |  |
| 7 | 01 | unrun-verify | src/components/pending-unlock/pending-unlock-modal.tsx |  | M-5 (D-08): rejecting the signer prompt in the nav modal toasts once, leaves count unchanged, and Unlock is immediately retryable with no reload - needs a live signer/relay session, not run in this environment | open |  | 2026-08-19T17:04:03.829Z |  |
| 8 | 01 | unrun-verify | src/components/pending-unlock/pending-unlock-modal.tsx |  | M-6 (D-09): decryption-cache password row reachable and functional from the side-nav affordance without visiting /messages - needs a live browser session with a real signer, not run in this environment | open |  | 2026-08-19T17:04:03.936Z |  |
| 9 | 01 | unrun-verify | src/views/settings/privacy/index.tsx |  | D-04/D-05 manual UAT procedure (Task 2) not executed — requires a live signer session with a hidden mute list; deferred to end-of-phase UAT alongside plans 01-01 and 01-03's deferred manual checks. | open |  | 2026-08-19T17:12:08.254Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "src/hooks/use-user-mute-actions.ts",
    "line": null,
    "description": "M-9: merged isMuted flip from Mute to Unmute on hidden-mutes unlock without reload — needs a live signer/relay session, not run in this environment",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T16:45:43.767Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "src/components/menu/mute-user.tsx",
    "line": null,
    "description": "M-8 part 1: public unmute regression (published kind-10000 drops p tag and stale mute_expiration tag) — needs a live signer/relay session, not run in this environment",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T16:45:43.871Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "src/services/pending-unlock-mutes.ts",
    "line": null,
    "description": "M-4 (D-07): timelines silently under-filter while hidden mutes are locked, no banner appears anywhere - needs a live signer/relay session, not run in this environment",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T16:55:29.272Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "src/index.tsx",
    "line": null,
    "description": "M-3 (D-06): a cross-device mute-list replacement returns the mutes pending count to 1 with no automatic re-unlock - needs a live signer/relay session, not run in this environment",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T16:55:29.373Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "src/services/pending-unlock-cache.ts",
    "line": null,
    "description": "M-6 mechanism half (D-09): pending decryption-cache item visible via debug console at default encryptDecryptionCache=true, count drops to zero after correct password - needs a live browser session with enableDebugApi on, not run in this environment",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T16:55:29.468Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "src/components/layout/components/pending-unlock-button.tsx",
    "line": null,
    "description": "M-2 (D-02/D-03/D-09): side-nav pending count 2, collapse-to-icon-badge, unlock-one-drops-to-1, cache-unlock-hides-affordance, plus mobile drawer parity - needs a live signer/relay session, not run in this environment",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T17:04:03.716Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "src/components/pending-unlock/pending-unlock-modal.tsx",
    "line": null,
    "description": "M-5 (D-08): rejecting the signer prompt in the nav modal toasts once, leaves count unchanged, and Unlock is immediately retryable with no reload - needs a live signer/relay session, not run in this environment",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T17:04:03.829Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "src/components/pending-unlock/pending-unlock-modal.tsx",
    "line": null,
    "description": "M-6 (D-09): decryption-cache password row reachable and functional from the side-nav affordance without visiting /messages - needs a live browser session with a real signer, not run in this environment",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T17:04:03.936Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "src/views/settings/privacy/index.tsx",
    "line": null,
    "description": "D-04/D-05 manual UAT procedure (Task 2) not executed — requires a live signer session with a hidden mute list; deferred to end-of-phase UAT alongside plans 01-01 and 01-03's deferred manual checks.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T17:12:08.254Z",
    "resolved_at": null
  }
]
````
