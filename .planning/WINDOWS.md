---
schema_version: 1
open_count: 2
waived_count: 0
fixed_count: 0
total_count: 2
last_updated: 2026-08-19T16:45:43.871Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | unrun-verify | src/hooks/use-user-mute-actions.ts |  | M-9: merged isMuted flip from Mute to Unmute on hidden-mutes unlock without reload — needs a live signer/relay session, not run in this environment | open |  | 2026-08-19T16:45:43.767Z |  |
| 2 | 01 | unrun-verify | src/components/menu/mute-user.tsx |  | M-8 part 1: public unmute regression (published kind-10000 drops p tag and stale mute_expiration tag) — needs a live signer/relay session, not run in this environment | open |  | 2026-08-19T16:45:43.871Z |  |

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
  }
]
````
