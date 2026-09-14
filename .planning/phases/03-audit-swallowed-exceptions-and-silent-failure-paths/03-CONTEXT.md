# Phase 3: Audit swallowed exceptions and silent failure paths - Context

**Gathered:** 2026-09-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Every error discarded in `src/` is either a deliberate, documented guard or is surfaced to the user
/ logged with its cause. Concretely: clear all 32 error-severity findings in bucket B of the
[2026-09-11 baseline](../../research/aislop-scan-2026-09-11.md) (31 × `ai-slop/swallowed-exception`
+ 1 × `ai-slop/silent-recovery`) across 33 files, take the four warning-severity strays in the same
bucket with them, and record the resulting convention in `AGENTS.md`.

**In scope:**

- All 33 files carrying bucket-B findings, in two waves (D-02)
- The four warning-severity strays: `redundant-try-catch` ×2 (`services/sqlite/index.ts`),
  `no-async-promise-executor` (`components/qr-code/native-scanner.ts`), `hidden-fallback`
  (`hooks/timeline/use-timeline-cache-key.ts`) (D-13)
- Removing the unused `(e)` binding on catches this phase already rewrites (D-06)
- An `AGENTS.md` "Error Handling" addition stating the convention (D-03)

**Out of scope:** the 23 `eslint/no-empty` warnings as a target in their own right (most fall out of
D-05 anyway), any `no-unused-vars` outside the catch lines being rewritten (Phase 4), the
`console-leftover` sweep (backlog 999.8), and introducing a test framework (D-04).

</domain>

<decisions>
## Implementation Decisions

### Scope & completion

- **D-01:** Done means **zero bucket-B error-severity findings in `src/`** — all 31
  `ai-slop/swallowed-exception` plus the 1 `ai-slop/silent-recovery`. Warning-severity findings may
  remain where the decision was deliberate. This is the bar because an error-severity finding in a
  touched file is what actually fails `pnpm lint:ci` (Phase 2 D-01, `AGENTS.md` §Linting); Phase 2's
  calibration showed two of nine sampled commits failing purely on inherited bucket-B errors.
  Explicitly rejected: clearing all 59 findings including warnings, and "every site triaged" with
  the count as a mere outcome.
- **D-02:** **Two waves, risk first.** Wave 1 is the decryption/signer set where a swallowed error
  hides a user-facing failure: `classes/encrypted-storage.tsx:171`, `services/decryption-cache.ts:95`,
  `helpers/nostr/dms.ts:31`, `components/blob-details-modal.tsx:146/153`,
  `views/messages/chat/components/decrypt-placeholder.tsx:23`. Wave 2 is everything else. Explicitly
  rejected: grouping by remedy, and grouping by directory — both spread the risky sites across
  several commits.
- **D-03:** The convention is **written into `AGENTS.md` §Error Handling**, following the Phase 2
  precedent of documenting its own convention there (D-12 inline ignores). It states when an empty
  catch is legitimate and how to write it, when to surface via `useAsyncAction`, and which logger
  services use.
- **D-04:** Verification is a **scoped rescan only** — rerun the scan and show the bucket-B error
  count going 32 → 0 with a per-file before/after table. No manual UAT wave and no new test
  framework. Explicitly rejected: adding vitest for the pure helpers (its own phase), and a manual
  UAT pass over the decryption paths.

### How a deliberate guard is written

- **D-05:** The default treatment for a genuine parse guard is an **explicit return plus a reason
  comment**:
  ```ts
  catch {
    // <what failed and why discarding it is safe>
    return undefined;
  }
  ```
  Measured (see `<code_context>` → Probe): a comment alone does **not** clear
  `ai-slop/swallowed-exception`; an explicit return does. Explicitly rejected: narrowing the catch
  and rethrowing unexpected errors (fully clean, but demands a per-site judgment about which error
  type is expected and risks throwing from paths that never throw today), and defaulting to an
  inline ignore.
- **D-06:** Where the caught binding is unused, use **bare `catch {`**, so files this phase touches
  carry no `no-unused-vars` residue into future PRs. This reaches into Phase 4's bucket, but only on
  lines already being rewritten.
- **D-07:** A rule-scoped `aislop-ignore-*` is a **last resort**, allowed only where the catch
  genuinely cannot return a value or log, and its `-- reason` must justify **why the code could not
  be fixed instead** — not merely that the guard is deliberate. Explicitly rejected: banning ignores
  outright (turns any stubborn site into a mid-execution blocker), and treating ignores as
  equal-standing with the explicit-return fix.
- **D-08:** Reason comments are **free-form but must name what failed and why discarding it is
  safe** (typically what the caller does with the absent value). No fixed prefix or template.
  Explicitly rejected: a greppable marker convention, and requiring only that some comment exist.

### How failures reach the user

- **D-09:** For a swallowed error in a **user-triggered action**, the default is to **delete the
  local try/catch, convert the handler to `useAsyncAction`, and let the error throw** — the hook
  toasts `e.message` and logs it. This is the pattern `AGENTS.md` already marks REQUIRED. Applies to
  `components/cashu/mint-control.tsx:28` and
  `views/settings/relays/components/relay-control.tsx:27` (both hand-roll their own `loading` state
  beside the empty catch — `useAsyncAction`'s `loading` replaces it) and
  `views/settings/cache/components/enable-with-delete.tsx:32`. Explicitly rejected: inline
  `useToast` at the catch site, and per-site judgment with no default.
- **D-10:** Deliberate **best-effort fallbacks log the cause and stay silent** to the user — the
  fallback itself is the handling. Applies to `providers/route/invoice-modal-provider.tsx:34` (WebLN
  fails → manual modal), `components/event-zap-modal/pay-step.tsx:171` (per-invoice failure → leave
  for manual payment), `components/blob-details-modal.tsx:146/153` (per-server download fails → try
  the next), and `components/qr-code/qr-code-scanner-button.tsx:48` (user cancel). UX is unchanged;
  the cause becomes recoverable when someone investigates. Explicitly rejected: comment-only with
  nothing logged, and restructuring so the terminal error carries the last attempt's cause.
- **D-11:** `decrypt-placeholder.tsx:23` uses the **hook's existing `error` state**. Verified during
  discussion: `hooks/use-legacy-message-plaintext.ts` already try/catches inside `unlock()` and sets
  `error`, so it **never throws** — the component's `try { await unlock() } catch {}` is catching an
  error that cannot arrive. The fix is to delete the try/catch and render the `error` the component
  already destructures, not to add a toast.

### Logging channel & strays

- **D-12:** Logging uses the **namespaced debug logger** — `logger.extend("<Module>")` from
  `src/helpers/debug.ts`, already the services pattern (`services/event-cache/index.ts`,
  `components/qr-code/native-scanner.ts`). It is silent in production unless the namespace is
  enabled and does not trip `ai-slop/console-leftover`, which Phase 2 (D-07) kept on. Explicitly
  rejected: `console.warn`/`console.error` (adds bucket-G findings), and a split policy by failure
  kind.
- **D-13:** The **four warning-severity strays are in scope** — same audit, bounded set, and
  finishing them closes bucket B rather than leaving the awkward remainder. Note
  `services/sqlite/index.ts` is also touched by Phase 4 (its deliberate dead code below a `throw`);
  the two phases must not fight over that file.
- **D-14:** `hooks/timeline/use-timeline-cache-key.ts:14` is a **false positive** — `return cacheKey
  || fallback` returns a stable `nanoid` for the first render until the effect writes it into route
  state; nothing is failing. Keep the code and add a rule-scoped ignore whose reason says exactly
  that. This is the D-07 last-resort case.
- **D-15:** `src/index.tsx:49` (the lone `silent-recovery`) **logs via the namespaced logger,
  including the caught error**. Registering the `web+nostr` protocol handler is genuinely optional,
  so no user-facing surfacing is warranted. Removes a `console-leftover` finding from bucket G in
  passing. Explicitly rejected: `console.error` with the cause, and dropping the log entirely.

### Claude's Discretion

None — the user selected a concrete option for every question. No "you decide" answers.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase source & evidence

- `.planning/ROADMAP.md` — Phase 3 entry (goal, the bucket-B breakdown, and the named
  decryption/signer priority files)
- `.planning/research/aislop-scan-2026-09-11.md` §B "Error handling" — the 59 findings, per-rule
  counts, and top files this phase is measured against
- `.planning/research/aislop-scan-2026-09-11.json` — raw scan; `diagnostics[]` carries
  `filePath`/`line`/`rule`/`severity` for every finding (this is how the per-file list below was
  built; note the array is `diagnostics`, not `findings`)

### Standard being enforced

- `.aislop/config.yml` — adopted rule policy; `ai-slop/swallowed-exception` and
  `ai-slop/silent-recovery` sit at aislop defaults (error), `ai-slop/console-leftover` is on
- `AGENTS.md` §Linting — how the gate works ("no error-severity findings in touched files") and
  §"Inline ignores" — the rule+reason directive convention D-07 builds on
- `AGENTS.md` §Error Handling — the section D-03 extends
- `.planning/phases/02-adopt-a-lint-config-and-ci-quality-gate/02-CONTEXT.md` — D-01/D-09/D-12
  (gate strategy, rules left at defaults, inline-ignore convention) constrain this phase

### Project conventions

- `.planning/codebase/CONVENTIONS.md` §"Error Handling" and §Logging — `useAsyncAction`, `useToast`,
  `ErrorBoundary`, and the `debug`-package logging pattern
- `.planning/codebase/CONCERNS.md` — flags `src/services/event-cache/index.ts` ("writes are buffered
  without surfacing write failures to callers") and the zap-validation try/catch in notification
  grouping; useful background for two wave-2 sites

No external specs or ADRs exist for this phase — requirements are fully captured in the decisions
above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Probe: which remedies actually clear the rule (measured, not assumed)

Variants of the shape of `src/helpers/parse.ts` (a real firing site), scanned with the adopted
config. This is the evidence behind D-05, D-06 and D-07:

| Remedy | `swallowed-exception` (error) | Leftover |
|---|---|---|
| bare `catch (e) {}` | **fires** | `no-empty`, `no-unused-vars` |
| comment only in catch | **still fires** | `no-unused-vars` |
| comment + `return undefined` | cleared | `no-unused-vars` |
| `aislop-ignore-next-line` (rule + reason) | cleared | `no-empty`, `no-unused-vars` |
| `aislop-ignore-file` (rule + reason) | cleared | `no-empty`, `no-unused-vars` |
| narrowed catch, rethrows non-parse errors | cleared | **nothing** |

Two traps for the planner: the ignore directive must sit immediately above the `} catch` line (one
placed inside the `try` body does not suppress), and `aislop-ignore-file` only works at the top of
the file, not inside a function body. Both were observed failing to suppress during the probe.

### Site classification (all 33 files, from the scan JSON)

**Wave 1 — decryption/signer (D-02):**

- `src/classes/encrypted-storage.tsx:171` — `unlock()` swallows a decryption failure and returns
  `false`, conflating "wrong PIN" with "storage is corrupt"
- `src/services/decryption-cache.ts:95`
- `src/helpers/nostr/dms.ts:31` — `groupIntoConversations` drops any message whose sender/recipient
  can't be read; a malformed DM silently vanishes from the conversation list
- `src/components/blob-details-modal.tsx:146/153` — per-attempt failures inside the repair retry
  loop (D-10)
- `src/views/messages/chat/components/decrypt-placeholder.tsx:23` — redundant try/catch (D-11)

**Parse/filter guards → D-05:** `helpers/parse.ts:4`, `helpers/nip19.ts:11`,
`components/content/transform/bip-notation.ts:42`, `.../nip-notation.ts:42`,
`helpers/nostr/goal.ts:105`, `services/lnurl-metadata.ts:31`, `hooks/use-open-graph-data.ts:34`,
`hooks/use-cache-form.ts:48`, `views/tools/event-publisher/index.tsx:74`,
`components/debug-modal/event-tags.tsx:74`, `components/lightning/inline-invoice-card.tsx:32`,
`views/lists/components/list-history-modal.tsx:319`, `views/wallet/components/receive-token-modal.tsx:36`.

**Reclassified during discussion** — the scan's "top files" reading suggests these are user-facing,
but the code shows they are parse/filter guards and follow D-05, not D-09:
`views/streams/stream/components/stream-top-zappers.tsx:19` (reduce over zaps),
`components/app-handler-modal/index.tsx:138` (search filter),
`components/relay-url-input.tsx:62` (already commented; form validation handles it),
`views/settings/cache/database/components/import-events-button.tsx:22` (per-line JSON parse —
worth noting the importer reports `Imported N events` while silently dropping unparseable lines).

**User actions → D-09:** `components/cashu/mint-control.tsx:28`,
`views/settings/relays/components/relay-control.tsx:27`,
`views/settings/cache/components/enable-with-delete.tsx:32` (calls `location.reload()` on success,
so the failure path is the only one a toast can ever be seen on).

**Best-effort fallbacks → D-10:** `providers/route/invoice-modal-provider.tsx:34`,
`components/event-zap-modal/pay-step.tsx:171`, `components/blob-details-modal.tsx:146/153`,
`components/qr-code/qr-code-scanner-button.tsx:48`.

**Services → D-12:** `services/event-cache/index.ts:40` (the fallback loop's empty catch, while the
sibling loop at :55 already logs — the fix is to match the sibling).

**Strays → D-13/D-14/D-15:** `services/sqlite/index.ts:39/54` (both are
`catch (err) { return Promise.reject(err); }` in already-`async` functions — pure ceremony, the
try/catch can go), `components/qr-code/native-scanner.ts:15` (`new Promise<void>(async …)`),
`hooks/timeline/use-timeline-cache-key.ts:14`, `src/index.tsx:49`.

### Reusable assets

- `src/hooks/use-async-action.ts` — catches, toasts `e.message` when `e instanceof Error`, logs, and
  manages `loading`. The D-09 target; note it only toasts real `Error` instances.
- `src/helpers/debug.ts` — `export const logger = debug("noStrudel")`; `logger.extend(name)` is the
  D-12 pattern, already used by `services/event-cache/index.ts` and
  `components/qr-code/native-scanner.ts`.
- `src/hooks/use-legacy-message-plaintext.ts` — already exposes `{ error, plaintext, unlock }` with
  internal error capture (D-11).
- `src/services/event-cache/index.ts:55` — an in-repo example of the "log the cause, keep going"
  shape D-10 asks for.

### Constraints found while scouting

- The gate scores **whole touched files**: any file this phase edits must come out with zero
  error-severity findings, or the next PR touching it inherits them.
- No test framework exists (`.planning/codebase/CONCERNS.md`), which is why D-04 settles for a
  rescan.
- `services/sqlite/index.ts` is shared with Phase 4 (deliberate dead code below a `throw`); Phase 4
  is sequenced after Phase 3's dependency, so Phase 3 should avoid restructuring that file beyond
  its two `redundant-try-catch` sites.
- `.planning/config.json` does not exist, so research-before-questions and thinking-partner
  features are off.

</code_context>

<specifics>
## Specific Ideas

- The phase goal's wording is the bar for a reason comment: *"no error is discarded without a
  reason"*. A comment that restates the code ("// ignore errors") fails both that bar and
  `ai-slop/trivial-comment`, which Phase 2 (D-07) deliberately kept on — reasons must say what
  failed and what the caller does with the absent value (D-08).
- The maintainer took the `(e)` binding cleanup (D-06) and the bucket-G `console.log` removal at
  `index.tsx:49` (D-15) in passing, but only on lines this phase already rewrites — no drive-by
  sweeps.

</specifics>

<deferred>
## Deferred Ideas

- **Surfacing import-events-button's dropped lines** — the importer reports `Imported N events`
  while silently discarding unparseable ones. Making the count honest (or reporting skipped lines)
  is a UX change beyond clearing the finding; noted, not scoped here.
- **`encrypted-storage.tsx`'s wider error story** — `.planning/codebase/CONCERNS.md` flags AES-CBC
  without authentication and a 10,000-iteration PBKDF2. D-01 clears the swallowed error at :171;
  the crypto weaknesses it partly masks are a separate security item.
- **Event-cache write failures never reaching callers** — `CONCERNS.md` calls this out as a fragile
  area. This phase logs the fallback-loading failure (D-12); surfacing buffered write failures is a
  design change.
- **Adding a test framework** — considered as verification for this phase and rejected (D-04).

</deferred>

---

*Phase: 03-audit-swallowed-exceptions-and-silent-failure-paths*
*Context gathered: 2026-09-14*
