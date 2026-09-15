---
phase: 03
slug: audit-swallowed-exceptions-and-silent-failure-paths
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-09-15
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: **authored at plan time** — all six PLAN files (03-01 … 03-06) carry a parseable
`<threat_model>` block. Verification depth: ASVS L1 (grep-level mitigation presence), block threshold
`high`.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| user PIN → `EncryptedStorage.unlock()` | Untrusted secret crosses into the local AES-CBC decrypt path | Password, derived key, decrypted plaintext (high sensitivity) |
| remote blossom server → `RepairBlobButton` | Untrusted remote bytes enter the repair/upload flow | Blob bytes, blob + server URLs |
| stored ciphertext → `decryptionCacheStats$` | Locally stored records read for size estimation only | Ciphertext lengths (low sensitivity) |
| remote event / relay content → parse guards | Untrusted nostr event tags, nip19 strings, URLs and pasted tokens cross into parsers | Untrusted strings |
| user-supplied file → `import-events-button` | Untrusted newline-delimited JSON parsed per line | Arbitrary JSON |
| remote LNURL endpoint → `fetchMetadata` | Untrusted JSON from a remote lightning address | LNURL metadata |
| WebLN provider → `invoice-modal-provider` / `inline-invoice-card` | Browser extension mediates a payment | Invoices, payment results |
| localStorage → `use-cache-form` | Locally persisted form JSON is parsed | User form field values |
| native camera → `qr-code-scanner-button` | Scanned barcode payload enters the app | Arbitrary scanned payload |
| browser API → `registerProtocolHandler` | Optional `web+nostr` handler registration, may be refused | None |
| local SQLite → `openConnection` / `deleteDatabase` | Native database connection and deletion | Local cached events |
| user click → destructive action | User-initiated removal or full cache wipe mutates storage/state | Mint, relay, database records |
| thrown Error → toast | An Error's `message` is rendered into the UI by `useAsyncAction` | Application error messages |

Plan 03-06 crosses no trust boundary — it edits one documentation file and runs read-only
verification commands.

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Information Disclosure | `logger.extend("EncryptedStorage")` in `unlock()` | low | mitigate | Caught Error only; never password, derived key or plaintext. Grep for secret-bearing logger arguments across `src/` returns zero hits. `debug` logger silent in production unless namespace enabled. | closed |
| T-03-02 | Tampering | `encrypted-storage.tsx` conflates wrong-PIN with corrupt ciphertext | medium | accept | Pre-existing, unchanged by this phase; root cause (unauthenticated AES-CBC + 10k-iteration PBKDF2) recorded in `.planning/codebase/CONCERNS.md` and deferred by CONTEXT.md. Local storage only, not a remote boundary — ASVS L1 permits acceptance. | closed — accepted (R-03-01) |
| T-03-03 | Information Disclosure | `logger.extend("BlobRepair")` log calls | low | accept | Logs a blob URL, a server URL and an Error — all already user-visible in the repair UI. | closed — accepted (R-03-02) |
| T-03-04 | Denial of Service | Blob repair fallback loop | low | accept | Loop bounds, break condition and terminal throw unchanged; only logging added. | closed — accepted (R-03-03) |
| T-03-05 | Tampering | All thirteen parse/filter guards | low | accept | Guard behavior unchanged — malformed input still rejected and treated as absent. No validation logic added, removed or loosened. | closed — accepted (R-03-04) |
| T-03-06 | Denial of Service | `stream-top-zappers.tsx` reduce accumulator | medium | mitigate | Verified: `src/views/streams/stream/components/stream-top-zappers.tsx:21` returns `dir` from the `catch`, not `undefined`, so the accumulator survives the next iteration. Confirmed independently in 03-02-SUMMARY.md:94. | closed |
| T-03-07 | Information Disclosure | Reason comments (D-08) | low | accept | Comments describe failure classes only; no secret, key or user content named. | closed — accepted (R-03-05) |
| T-03-08 | Information Disclosure | Five new `logger.extend` log calls | low | mitigate | Logs only the caught Error plus an already-user-visible identifier. No invoice preimage, payment secret, cached form value or scanned payload logged — repo-wide grep for those terms alongside a logger call returns zero hits. | closed |
| T-03-09 | Repudiation | Payment failures previously discarded without trace | low | mitigate | Delivered as the plan's purpose: `inline-invoice-card`, `pay-step` and `invoice-modal-provider` failures now emit a namespaced log entry. | closed |
| T-03-10 | Denial of Service | `event-cache` fallback loop and `pay-step` invoice loop | medium | mitigate | No control-flow statement added inside either catch; `return null;` and `setPayingAll(false)` remain reachable per the plan's acceptance criteria, confirmed in 03-03-SUMMARY.md. | closed |
| T-03-11 | Tampering | Console channel bypass | low | mitigate | Verified: scan of the phase's touched `src/` files returns zero `console.log/error/warn` occurrences. The only `console-leftover` allowance is the file-scoped directive in `src/sw/client/error-logger.ts`, whose stated purpose is console output. | closed |
| T-03-12 | Information Disclosure | `useAsyncAction` toasting `e.message` on three converted handlers | low | accept | Hook toasts only when `e instanceof Error`; these actions throw application errors (removal/wipe failures), not credential or key material. Pattern already REQUIRED by `AGENTS.md`. | closed — accepted (R-03-06) |
| T-03-13 | Repudiation | Destructive actions failing with no feedback | medium | mitigate | Delivered as the plan's purpose — failed mint removal, relay removal and database wipe now surface a toast and a log instead of silently appearing to succeed. | closed |
| T-03-14 | Denial of Service | Button stuck in a loading state after conversion | low | mitigate | `useAsyncAction` clears `loading` on both success and failure. `pnpm build` passed after Tasks 1 and 2 and again at wave end, type-gating every render call site. **Residual:** purely visual spinner rendering is unverified — recorded in 03-04-SUMMARY.md:113 and carried in 03-UAT.md. Low severity, below the `high` block threshold. | closed |
| T-03-15 | Denial of Service | `native-scanner.ts` promise settlement after the refactor | medium | mitigate | Verified: all three terminal cases in `src/components/qr-code/native-scanner.ts` (lines 22, 38, 42) call `sub?.remove()`, so the installer promise cannot hang. **Residual:** native-only path, not exercisable without a Capacitor build — accepted in 03-05-PLAN.md and listed under 03-VALIDATION.md "Manual-Only Verifications". | closed |
| T-03-16 | Tampering | `sqlite/index.ts` error propagation after removing the wrappers | low | mitigate | Verified: zero `Promise.reject` occurrences remain in `src/services/sqlite/index.ts`; `openConnection` is still `async` and its `return db;` path survives (line 37), so an uncaught throw still yields a rejected promise — semantically identical to the removed wrapper. | closed |
| T-03-17 | Information Disclosure | `logger.extend("Index")` log call | low | accept | Logs a fixed message plus the caught Error from a browser API refusal; no user data, key or credential involved. | closed — accepted (R-03-07) |
| T-03-18 | Repudiation | Suppressing `hidden-fallback` with an inline directive | low | mitigate | Verified: exactly one such directive exists — `src/hooks/timeline/use-timeline-cache-key.ts:14` — and it is rule-scoped to `ai-slop/hidden-fallback` with a `--` reason explaining the line is initialization, not error recovery. Every other rule still applies to that line. | closed |
| T-03-19 | Tampering | `AGENTS.md` edited with the wrong tool | medium | mitigate | Verified: `#### Error Patterns` (line 126) and `### Linting` (line 187) both still present, so the canonical guide was extended by Edit rather than overwritten by a whole-file Write. | closed |
| T-03-20 | Repudiation | A convention that documents suppression too permissively | low | mitigate | The new subsection frames a rule-scoped ignore as a last resort whose reason must justify why the code could not be fixed, matching D-07. | closed |
| T-03-21 | Information Disclosure | Rescan JSON output embedded in the SUMMARY | low | accept | Output contains repo-relative file paths, rule names and line numbers only — all already public in the committed baseline reports. | closed — accepted (R-03-08) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (`high`) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

No threat in this register is rated `high` or `critical`, and every threat resolved to `closed`.
No new attack surface was introduced across the six plans: no new network call, parser, stored data,
exported API or dependency. Package installs: none, so no supply-chain threat applies.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-03-01 | T-03-02 | Unauthenticated AES-CBC conflates wrong-PIN with corrupt ciphertext. Pre-existing, local-storage-only, tracked in `.planning/codebase/CONCERNS.md`; a real fix needs an authenticated cipher mode and is scoped as a separate security item. | hzrd149 (03-01-PLAN.md) | 2026-09-15 |
| R-03-02 | T-03-03 | Blob repair logs only URLs and an Error already visible in the repair UI. | hzrd149 (03-01-PLAN.md) | 2026-09-15 |
| R-03-03 | T-03-04 | Blob repair fallback loop control flow unchanged by the phase. | hzrd149 (03-01-PLAN.md) | 2026-09-15 |
| R-03-04 | T-03-05 | Parse/filter guard behavior unchanged; rejection merely made explicit in source. | hzrd149 (03-02-PLAN.md) | 2026-09-15 |
| R-03-05 | T-03-07 | Reason comments name failure classes only, never secrets or user content. | hzrd149 (03-02-PLAN.md) | 2026-09-15 |
| R-03-06 | T-03-12 | `useAsyncAction` toasts application error messages, an already-REQUIRED codebase pattern. | hzrd149 (03-04-PLAN.md) | 2026-09-15 |
| R-03-07 | T-03-17 | Protocol-handler log carries a fixed message plus a browser refusal Error. | hzrd149 (03-05-PLAN.md) | 2026-09-15 |
| R-03-08 | T-03-21 | Rescan output contains only already-public paths, rule names and line numbers. | hzrd149 (03-06-PLAN.md) | 2026-09-15 |

*Accepted risks do not resurface in future audit runs.*

---

## Residual Items (non-blocking)

These are verification gaps, not open threats — both sit below the `high` block threshold and are
already tracked in the phase's validation and UAT artifacts.

| Ref | Gap | Tracked in |
|-----|-----|------------|
| T-03-14 | Spinner rendering on the three converted destructive actions is type-gated by `pnpm build` but visually unverified. | 03-04-SUMMARY.md, 03-UAT.md |
| T-03-15 | Native scanner promise settlement cannot be exercised without a Capacitor build. | 03-05-PLAN.md, 03-VALIDATION.md "Manual-Only Verifications" |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-15 | 21 | 21 | 0 | /gsd-secure-phase (ASVS L1, block_on: high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-15
