---
phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
plan: 03
subsystem: observability
tags: [error-handling, logging, debug, aislop, lightning, webln]

requires:
  - phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
    provides: "03-01's namespaced-logger pattern (logger.extend) established as the D-10/D-12 remedy channel"
provides:
  - "Eight best-effort fallback sites now log their caught error through a namespaced debug logger instead of swallowing it silently"
  - "Five new module-private logger constants: LNURLMetadata, EventTags, InlineInvoiceCard, InvoiceModal, ZapPayStep"
affects: [03-06]

tech-stack:
  added: []
  patterns:
    - "D-10 'log the cause and stay silent': logger.extend(<Name>) call added inside a catch whose post-catch code must keep running, with no control-flow statement added"

key-files:
  created: []
  modified:
    - src/services/lnurl-metadata.ts
    - src/components/debug-modal/event-tags.tsx
    - src/components/lightning/inline-invoice-card.tsx
    - src/providers/route/invoice-modal-provider.tsx
    - src/components/event-zap-modal/pay-step.tsx
    - src/hooks/use-cache-form.ts
    - src/components/qr-code/qr-code-scanner-button.tsx
    - src/services/event-cache/index.ts

key-decisions:
  - "All eight sites got D-10's log-only remedy (no return/continue added) because each has load-bearing code after the catch: a pending-map cleanup, a JSX fallback return, setLoading(false), a manual-payment-modal fallback, or the next loop iteration"
  - "Three sites (use-cache-form.ts, qr-code-scanner-button.tsx, event-cache/index.ts) reused their existing in-scope logger rather than adding a new one, per the plan's logger inventory"
  - "event-cache/index.ts's null-type fallback loop copies its sibling loop's exact log shape (log(\"Failed to load fallback\", fallback, error)) verbatim"

patterns-established:
  - "Module-private logger constant named after the component/service (logger.extend(\"Name\")) placed immediately after imports, reused by every catch in that module"

requirements-completed: [D-01, D-05, D-08, D-10, D-12]

coverage:
  - id: D1
    description: "Five fallback sites needing a new module-scope logger (LNURLMetadata, EventTags, InlineInvoiceCard, InvoiceModal, ZapPayStep) now log their caught error with zero error-severity bucket-B findings"
    requirement: "D-10"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq bucket-B filter over the five files -> 0"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Three fallback sites whose logger was already in scope (use-cache-form.ts, qr-code-scanner-button.tsx, event-cache/index.ts) now log their caught error using the existing logger, with zero new logger constants"
    requirement: "D-10"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq bucket-B filter over the three files -> 0"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false

duration: ~10min
completed: 2026-09-15
status: complete
---

# Phase 03 Plan 03: Log eight best-effort fallback failures Summary

**Eight best-effort fallback catches (LNURL metadata, tag decode, WebLN payments x3, cached-form restore, native QR scan, event-cache fallback loop) now log their cause through the namespaced `debug` logger with zero control-flow changes.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-09-15T14:31:35Z
- **Completed:** 2026-09-15T14:37:37Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Five files gained a new module-scope `logger.extend(...)` constant and a log call inside their target catch, with every post-catch statement (pending-map cleanup, JSX fallback, `setLoading(false)`, manual-invoice-modal fallback, remaining-loop-iterations + `setPayingAll(false)`) confirmed still reachable
- Three files reused their existing in-scope `log` binding, adding no new logger constant, with `event-cache/index.ts`'s null-type fallback loop copying its sibling loop's log shape verbatim
- All eight files confirmed zero error-severity `ai-slop/swallowed-exception`/`ai-slop/silent-recovery` findings via the plan's jq assertions; zero `ai-slop/console-leftover` findings introduced
- `pnpm build` passed after both tasks
- Whole-repo bucket-B error-severity count is 4 (informational only — this plan runs in parallel with 03-02/03-04/03-05, so the plan does not assert on the whole-repo total per its own verification note)

## Log messages added (for 03-06's D-04 table)

| File | Logger | Message |
|------|--------|---------|
| src/services/lnurl-metadata.ts | `LNURLMetadata` | `"Failed to fetch LNURL metadata", addressOrLNURL, e` |
| src/components/debug-modal/event-tags.tsx | `EventTags` | `"Failed to render decoded tag", error` |
| src/components/lightning/inline-invoice-card.tsx | `InlineInvoiceCard` | `"Failed to pay invoice with WebLN", e` |
| src/providers/route/invoice-modal-provider.tsx | `InvoiceModal` | `"WebLN payment failed, falling back to the manual invoice modal", e` |
| src/components/event-zap-modal/pay-step.tsx | `ZapPayStep` | `"Failed to pay invoice", pubkey, e` |
| src/hooks/use-cache-form.ts | (existing `CachedForm:${key}`) | `"Failed to restore cached form", e` |
| src/components/qr-code/qr-code-scanner-button.tsx | (existing `QRCodeScanner`) | `"Native QR scan cancelled or failed", error` |
| src/services/event-cache/index.ts | (existing `event-cache`) | `"Failed to load fallback", fallback, error` |

## Task Commits

Each task was committed atomically:

1. **Task 1: Five fallback sites that need a new module-scope logger** - `8fce78508` (feat)
2. **Task 2: Three fallback sites whose logger is already in scope** - `b320c6f3a` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/services/lnurl-metadata.ts` - `fetchMetadata` catch logs the failed LNURL lookup; `this.pending.delete(addressOrLNURL)` cleanup still runs unchanged, not moved into a `finally`
- `src/components/debug-modal/event-tags.tsx` - tag-decode catch logs the failure; the fallback `<Text>` render below it is unchanged
- `src/components/lightning/inline-invoice-card.tsx` - WebLN pay catch logs the failure beside its existing D-08 comment; `setLoading(false)` still runs
- `src/providers/route/invoice-modal-provider.tsx` - WebLN auto-pay catch logs the failure; the manual-payment `createDefer`/`setDefer`/`setInvoice` fallback still runs
- `src/components/event-zap-modal/pay-step.tsx` - per-invoice pay catch logs the failure with the recipient pubkey beside its existing D-08 comment; the loop continues and `setPayingAll(false)` still runs after it
- `src/hooks/use-cache-form.ts` - restore-form catch logs the parse failure using the existing per-key `log`; the effect's `return () => {...}` cleanup registration is unchanged
- `src/components/qr-code/qr-code-scanner-button.tsx` - inner native-scan-cancel catch now logs beside its "user cancel" comment; the outer catch (already logging) is untouched
- `src/services/event-cache/index.ts` - the `type === null` fallback loop's catch now logs each failure, copying its sibling loop's exact shape; `return null;` after the loop is still reachable

## Decisions Made
- All eight sites use D-10's "log the cause and stay silent" remedy exclusively — no `return`/`continue`/`break` was added at any site, since each has load-bearing code after the catch (matches 03-02's D-05 explicit-return remedy applying to a disjoint file set)
- Three sites reused their existing in-scope logger per the plan's logger inventory table, adding no new logger constant
- `event-cache/index.ts`'s null-type fallback loop's new log call is byte-identical in shape to its sibling loop's existing `log("Failed to load fallback", fallback, error)` call

## Deviations from Plan

None - plan executed exactly as written. Two pre-existing `ai-slop/trivial-comment` warnings surfaced by the post-edit hook in `src/hooks/use-cache-form.ts` (lines 36 and 53, "remove the item and keep it in memory" / "save previous key on change or unmount") were confirmed via `git diff` to predate this plan's edit — the edit only touched the catch block between them — and were left untouched per the out-of-scope rule (these belong to backlog phases 999.2-999.10, not this phase).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All eight sites in this plan's scope now satisfy D-10/D-12; 03-06's D-04 table can cite the log messages above
- This plan does not touch the files owned by 03-01, 03-02, 03-04, or 03-05
- Whole-repo bucket-B error-severity count observed at 4 after this plan (informational; not asserted per this plan's verification note since it runs in parallel with sibling plans)

---
*Phase: 03-audit-swallowed-exceptions-and-silent-failure-paths*
*Completed: 2026-09-15*

## Self-Check: PASSED

All 8 modified source files and this SUMMARY.md confirmed present on disk. Both task commits (`8fce78508`, `b320c6f3a`) confirmed present in `git log`.
