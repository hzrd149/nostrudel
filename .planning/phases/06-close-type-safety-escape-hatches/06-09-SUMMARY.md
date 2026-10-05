---
phase: 06-close-type-safety-escape-hatches
plan: 09
subsystem: database
tags: [idb, indexeddb, typescript, type-safety, migrations]
requires:
  - phase: 06-04
    provides: identities clearCacheData fix (D-07) and v5 destructure (D-08)
provides:
  - SchemaV1..SchemaV13 as DBSchema-assignable exported type aliases
  - atSchema helper holding the single remaining cast in database/index.ts
affects: [src/services/database, all IndexedDB consumers]
tech-stack:
  added: []
  patterns: ["Omit<Prev, K> & { ... } type aliases for idb schema versions", "single reasoned cast helper behind a rule-scoped aislop-ignore"]
key-files:
  created: []
  modified:
    - src/services/database/schema.ts
    - src/services/database/index.ts
key-decisions:
  - "Schemas are type aliases (not interfaces extending DBSchema) so they are assignable to DBSchema without Omit collapsing keys"
  - "SchemaV6.channelMetadata gained indexes: { created: number } to match the v6 migration's createIndex call"
requirements-completed: [D-05, D-06, D-13, D-15, D-16]
status: complete
duration: 10min
completed: 2026-10-05
---

# Phase 6 Plan 09: IndexedDB schema typing and atSchema helper Summary

SchemaV1..V13 are now DBSchema-assignable type aliases so idb's `StoreNames`/`StoreValue` checking is real, and the 16 `as unknown as` migration casts collapse into one `atSchema` helper with a rule-scoped ignore, in a single green commit.

## Commit

- `c70b83e80` refactor(06-09): type IndexedDB schemas as DBSchema aliases and collapse migration casts into atSchema (only `schema.ts` and `index.ts`)

## Verification

- `tsc --noEmit` clean; `pnpm build` exits 0; `pnpm test` 28/28 pass.
- Full aislop scan: 0 findings for `src/services/database/index.ts` and `schema.ts`.
- `grep -c 'as unknown as'` in index.ts = 1, directly preceded by the `aislop-ignore-next-line ai-slop/double-type-assertion -- ` directive; `at<SchemaV` count = 16.
- 13 `export type SchemaVn = ` declarations, 0 `export interface`; `indexes: { created: number }` count = 2.
- Diff audit: every removed line in index.ts is a cast declaration or the idb import line (0 others). `await db.clear("identities")` and the `const { useExtension, ...rest } = account;` destructure are still present.
- `prettier --check` was run via `--write` on both files (no manual formatting changes).

## D-05 type probe

Temporary `schema-probe.ts` (deleted, not committed) with five constants. tsc output:

```
src/services/database/schema-probe.ts(6,14): error TS2322: Type '"dnsIdentifiers"' is not assignable to type '"relayInfo" | "relayScoreboardStats" | "accounts" | "misc" | "userSearch" | "read" | "identities" | "kv"'.
src/services/database/schema-probe.ts(7,14): error TS2322: Type '"totally-not-a-store"' is not assignable to type '"relayInfo" | "relayScoreboardStats" | "accounts" | "misc" | "userSearch" | "read" | "identities" | "kv"'.
```

Exactly two errors (dnsIdentifiers at V13, arbitrary string); `"identities"` and `"kv"` at V13 and `"dnsIdentifiers"` at V11 compile. Probe removed; `git status` clean.

## Deviations from Plan

None. The plan executed as written; no consumer file errored, so none was edited.

## Outstanding (manual, for /gsd-verify-work)

- Fresh profile (clear site data) boots with no console errors (v0 -> v13 migration chain).
- Existing profile boots with accounts intact. No fake-indexeddb exists, so this is not automated and is not assumed from the passing build.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- Commit c70b83e80 exists; schema-probe.ts absent; both modified files present.
