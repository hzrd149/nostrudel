---
phase: 06-close-type-safety-escape-hatches
plan: 07
subsystem: forms-hooks-types
tags: [typescript, type-safety, directives, aislop]
requires: [06-01, 06-02, 06-03]
provides:
  - "isSetter<T>() type predicate (module-private) in use-route-state-value.ts"
  - "AutocompleteTextareaProps = Omit<TextareaProps, 'color'> (module-private) in magic-textarea.tsx"
  - "useTextAreaUploadFile().onPaste typed ClipboardEventHandler<HTMLTextAreaElement | HTMLInputElement>"
affects: [magic-textarea consumers, useTextAreaUploadFile consumers]
tech-stack:
  patterns: [type predicate narrowing, explicit hook generics, rule-scoped aislop ignore + expect-error]
key-files:
  modified:
    - src/hooks/use-route-state-value.ts
    - src/views/groups/components/group-message-form.tsx
    - src/views/new/picture/picture-post-form.tsx
    - src/hooks/use-textarea-upload-file.ts
    - src/views/pictures/picture/media-post-comment-form.tsx
    - src/views/streams/stream/stream-chat/stream-chat-form.tsx
    - src/components/magic-textarea.tsx
decisions:
  - "MagicInput keeps the phase's only surviving TS directive: expect-error with TS2344 reason under a rule-scoped aislop-ignore"
metrics:
  tasks: 3
  files: 7
completed: 2026-10-05
status: complete
---

# Phase 6 Plan 07: Shared form/hook directives Summary

Eight directive findings in the shared form/hook layer resolved: seven fixed with real types, one retained as a reasoned, rule-scoped `@ts-expect-error` on `MagicInput`.

## Tasks

| Task | Commit | Change |
| ---- | ------ | ------ |
| 1 | af6359c99 | `isSetter` predicate in `useRouteStateValue`; `useCacheForm<{ content: string }>` and `useCacheForm<FormValues>` |
| 2 | 8cd1fcfb4 | `onPaste` typed for textarea or input; two `onPaste` directives removed |
| 3 | 5c7a1787c | `AutocompleteTextareaProps`, `innerRef` conditional, MagicInput two-line directive |

## Verification

- `pnpm build` exits 0 after each task (tsc type-checks all `useTextAreaUploadFile`, `MagicInput`, `MagicTextArea`, `RefType` consumers).
- aislop scan: 0 `ai-slop/ts-directive|double-type-assertion|unsafe-type-assertion` findings across the seven files; `magic-textarea.tsx` has 10 findings total (all pre-existing, at the plan's limit).
- Prettier clean on all touched files. `use-cache-form.ts` untouched.
- Surviving directive: tsc reports `TS2344: Type 'InputProps' does not satisfy the constraint 'TextareaHTMLAttributes<HTMLTextAreaElement>'` (onChange handler element mismatch) at the type-argument line, which is the line directly under the directive.

## Deviations from Plan

None - plan executed as written. The `innerRef` conditional was re-wrapped across lines by hand to match prettier's expected layout (prettier reported unchanged).

## Outstanding (manual, for /gsd-verify-work)

- @-mention autocomplete still opens in a note composer (MagicTextArea) and stream chat (MagicInput).
- Pasting an image into stream chat still uploads it.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

Commits af6359c99, 8cd1fcfb4, 5c7a1787c exist; all seven modified files present.
