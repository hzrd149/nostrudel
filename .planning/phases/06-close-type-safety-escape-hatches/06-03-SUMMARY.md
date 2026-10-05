---
phase: 06-close-type-safety-escape-hatches
plan: 03
subsystem: type-safety
tags: [typescript, react-window, ts-directives, aislop]
requires: []
provides:
  - "ScrollableList module-private type in use-scroll-restore.ts"
  - "Six notification views pass scroll.ref without a cast"
  - "Three dead ts directives and unused pwa-register/react declaration removed"
  - "debug-api disable path uses Reflect.deleteProperty"
affects: [src/hooks/use-scroll-restore.ts, src/views/notifications, src/vite-env.d.ts, src/services/debug-api.ts]
tech-stack:
  added: []
  patterns: ["structural type for shared library surface instead of any cast"]
key-files:
  modified:
    - src/hooks/use-scroll-restore.ts
    - src/views/notifications/mentions/index.tsx
    - src/views/notifications/quotes/index.tsx
    - src/views/notifications/replies/index.tsx
    - src/views/notifications/reposts/index.tsx
    - src/views/notifications/threads/index.tsx
    - src/views/notifications/zaps/index.tsx
    - src/helpers/media-upload/nostr-build.ts
    - src/polyfill.ts
    - src/vite-env.d.ts
    - src/services/debug-api.ts
decisions:
  - "D-10: ref callback typed against { scrollTo(scrollOffset: number): void }, hook not made generic"
  - "D-12: dead directives deleted, not converted"
  - "D-04/D-09: delete operator replaced by Reflect.deleteProperty"
metrics:
  tasks: 3
  files: 11
completed: 2026-10-05
status: complete
---

# Phase 6 Plan 03: Scroll ref typing and dead directive removal Summary

Typed the scroll-restore hook's list ref against the shared `scrollTo` surface (removing six `as any` casts in the notification views), deleted three dead `@ts-ignore`/`@ts-expect-error` directives plus the unused PWA React-register module declaration, and replaced the `debug-api.ts` removal directive with `Reflect.deleteProperty`.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | ScrollableList type + mentions/quotes/replies casts | f92f0d2db |
| 2 | reposts/threads/zaps casts | ddcae80d2 |
| 3 | Dead directives, vite-env.d.ts cleanup, debug-api Reflect.deleteProperty | a9df51365 |

## Verification

- `pnpm build` passed after each task (tsc + vite build), proving the four other hook consumers still compile and the deleted directives suppressed nothing.
- aislop bucket-E (ts-directive / double-type-assertion / unsafe-type-assertion) count is 0 for all touched files; `src/vite-env.d.ts` is 3 lines; no `pwa-register/react` references remain.
- prettier --check passes on all touched files.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

Commits f92f0d2db, ddcae80d2, a9df51365 exist on the worktree branch.
