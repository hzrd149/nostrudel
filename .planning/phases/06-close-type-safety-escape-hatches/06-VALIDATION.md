---
phase: 6
slug: close-type-safety-escape-hatches
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-10-05
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 5.0.1 (`environment: "node"`), plus `tsc` as the primary verifier for type-only edits |
| **Config file** | `vitest.config.ts` (`include: ["src/**/*.test.ts"]`) |
| **Quick run command** | `pnpm exec tsc --noEmit -p tsconfig.json && pnpm test` |
| **Full suite command** | `pnpm build && pnpm test` plus the bucket-E rescan (below) |
| **Estimated runtime** | ~45 seconds (tsc ~35 s, vitest ~1 s, vite build ~5 s, scan ~12 s) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec tsc --noEmit -p tsconfig.json && pnpm test` (D-13: `pnpm build` must pass after every task)
- **After every plan wave:** Run `pnpm build && pnpm test` and the bucket-E rescan
- **Before `/gsd-verify-work`:** Full suite must be green, rescan shows 68 → 0 reported, ignore inventory matches
- **Max feedback latency:** 60 seconds

### Bucket-E rescan

```bash
pnpm exec aislop scan --json . > "$TMPDIR/scan.json"
node -e 'const d=require(process.argv[1]);const c={};for(const x of d.diagnostics)if(/^ai-slop\/(ts-directive|double-type-assertion|unsafe-type-assertion)$/.test(x.rule)&&x.filePath.startsWith("src/"))c[x.rule]=(c[x.rule]||0)+1;console.log(c,d.score)' "$TMPDIR/scan.json"
```

Ignored findings vanish from the scan, so the D-13 inventory is by grep:

```bash
grep -rnE "aislop-ignore[a-z-]* ai-slop/(ts-directive|double-type-assertion|unsafe-type-assertion)" src
grep -rnE "@ts-ignore|@ts-expect-error|as unknown as|\bas any\b" src --exclude-dir=lib
```

---

## Per-Task Verification Map

Filled in by the planner per task; every task carries an automated `tsc` / `pnpm test` / rescan command.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | D-01, D-02, D-04, D-13, D-16 | T-06-02 | baseline counts measured, not transcribed | doc check | 68-row `grep -cE` count on 06-BASELINE.md | ✅ | ✅ green |
| 6-01-02 | 01 | 1 | D-03 | T-06-01 | ROADMAP edited by scoped Edit only | roadmap validate | `gsd-tools roadmap validate` + phase-heading count 14 | ✅ | ✅ green |
| 6-02-01 | 02 | 1 | D-09 | T-06-04 | globals stay inside DEV blocks | typecheck + scan | `pnpm build` + bucket-E jq (loaders, pool, event-store, outbox-cache, relay-info) = 0 | ✅ | ✅ green |
| 6-02-02 | 02 | 1 | D-09 | T-06-04 | globals stay inside DEV blocks | typecheck + scan | `pnpm build` + bucket-E jq (event-cache x2, read-status, relay-scoreboard) = 0; database directive = 1 | ✅ | ✅ green |
| 6-02-03 | 02 | 1 | D-09 | T-06-04 | globals stay inside DEV blocks | typecheck + scan | `pnpm build` + bucket-E jq (dns-identity-loader, preferences, social-graph, wallets/index, xml-feeds) = 0 | ✅ | ✅ green |
| 6-03-01 | 03 | 1 | D-10 | T-06-09 | N/A | typecheck + scan | `pnpm build` + bucket-E jq (mentions, quotes, replies) = 0 | ✅ | ✅ green |
| 6-03-02 | 03 | 1 | D-10 | T-06-09 | N/A | typecheck + scan | `pnpm build` + bucket-E jq (all notifications views) = 0 | ✅ | ✅ green |
| 6-03-03 | 03 | 1 | D-04, D-09, D-12 | T-06-07, T-06-08 | debug API removed on disable | typecheck + scan | `pnpm build` + bucket-E jq (nostr-build, polyfill, vite-env, debug-api) = 0; vite-env.d.ts is 3 lines | ✅ | ✅ green |
| 6-04-01 | 04 | 2 | D-07 | T-06-10 | cache clear resolves, reload reachable | typecheck + grep | `pnpm build` + `db.clear("identities")` = 1, deleted-store clear = 0 | ✅ | ✅ green |
| 6-04-02 | 04 | 2 | D-08 | T-06-11 | v5 stored account shape unchanged | typecheck + scan | `pnpm build` + database directive = 0, double = 16 | ✅ | ✅ green |
| 6-05-01 | 05 | 2 | D-11 | T-06-13, T-06-14 | pool surface narrowed to 3 methods; filters copied unchanged | typecheck + scan | `pnpm build` + bucket-E jq (adapter.ts) = 0 | ✅ | ✅ green |
| 6-05-02 | 05 | 2 | D-11 | — | N/A | typecheck + scan | `pnpm build` + all findings (common-actions.ts) = 0 | ✅ | ✅ green |
| 6-05-03 | 05 | 2 | D-11 | T-06-16 | N/A | typecheck + scan | `pnpm build` + bucket-E jq (webln.ts, webln.d.ts) = 0 | ✅ | ✅ green |
| 6-06-01 | 06 | 2 | D-11, D-14, D-15 | T-06-19 | guard accepts all old-accepted envelopes | unit | `pnpm test src/components/webxdc/jsonrpc.test.ts` + `pnpm build` | ✅ | ✅ green |
| 6-06-02 | 06 | 2 | D-11, D-15 | T-06-17, T-06-18 | origin/source checks stay first; non-string methods still get -32601 | typecheck + scan | `pnpm build` + bucket-E jq (webxdc.tsx) = 0 | ✅ | ✅ green |
| 6-06-03 | 06 | 2 | D-11 | T-06-20 | N/A | typecheck + scan | `pnpm build` + all findings (use-webxdc.ts) = 0 | ✅ | ✅ green |
| 6-07-01 | 07 | 2 | D-12 | — | N/A | typecheck + scan | `pnpm build` + bucket-E jq (use-route-state-value, two forms) = 0 | ✅ | ✅ green |
| 6-07-02 | 07 | 2 | D-11, D-12 | T-06-21 | N/A | typecheck + scan | `pnpm build` + bucket-E jq (use-textarea-upload-file, two forms) = 0 | ✅ | ✅ green |
| 6-07-03 | 07 | 2 | D-11, D-12 | T-06-22, T-06-23 | surviving directive is expect-error + rule-scoped ignore | typecheck + scan | `pnpm build` + bucket-E jq (magic-textarea) = 0 + one expect-error | ✅ | ✅ green |
| 6-08-01 | 08 | 2 | D-14, D-18 | T-06-24 | unit letters map case-insensitively | unit + scan | `pnpm test src/views/tools/event-console/process.test.ts` + `pnpm build` + all findings (process.ts) = 0 | ✅ | ✅ green |
| 6-08-02 | 08 | 2 | D-12 | T-06-25 | N/A | typecheck + scan | `pnpm build` + bucket-E jq (event-publisher index/process) = 0 | ✅ | ✅ green |
| 6-08-03 | 08 | 2 | D-17 | T-06-26 | N/A | typecheck + scan | `pnpm build` + all findings (vertex.ts) = 0 | ✅ | ✅ green |
| 6-09-01 | 09 | 3 | D-05, D-06 | T-06-27, T-06-28, T-06-29 | migration statements untouched (diff audit) | typecheck + scan | `pnpm build` + all findings (database index/schema) = 0, one `as unknown as`, 16 `at<SchemaV` | ✅ | ✅ green |
| 6-09-02 | 09 | 3 | D-05 | T-06-30 | StoreNames rejects deleted/unknown stores | type probe | temporary probe file + `tsc --noEmit` (2 expected errors), then removed; clean `git status` | ✅ | ✅ green |
| 6-10-01 | 10 | 4 | D-01, D-12, D-13 | T-06-31 | inventory from grep, counts from live scan | scan + grep | `pnpm build && pnpm test` + bucket-E jq (src) = 0 + ignore grep = 3 lines | ✅ | ✅ green |
| 6-10-02 | 10 | 4 | D-13, D-16 | T-06-32, T-06-33 | ROADMAP refreshed by handler | roadmap validate | `gsd-tools roadmap validate` + phase-heading count 14 | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/components/webxdc/jsonrpc.ts` + `jsonrpc.test.ts` — the webxdc JSON-RPC message guard (D-11, D-14); must accept every envelope the old `as any` code accepted (D-15)
- [x] `src/views/tools/event-console/process.test.ts` — the typed relative-time unit parser (D-18): every unit letter `h w m s d` in both cases maps to hour/week/minute/second/day; no unit → hour

*vitest itself is already installed (Phase 5).*

Both test files are created test-first inside the tasks that need them, not in a separate wave: `jsonrpc.ts` + `jsonrpc.test.ts` by task 6-06-01, and `process.test.ts` by task 6-08-01 (which lands it in the same commit as the D-18 parser).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Clear cache data" completes | D-07 | No `fake-indexeddb` in the repo; IndexedDB runs only in the browser | Settings → Cache → Database → Clear cache data: the button stops spinning and the page reloads, no `NotFoundError` in the console |
| IndexedDB migrations still run | D-05/D-06/D-08 | Same | Fresh profile (clear site data) boots without console errors; an existing profile boots and its accounts are intact |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-06

## Validation Audit 2026-10-06
| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 26 tasks carry an automated command (tsc via `pnpm build`, the bucket-E rescan, or vitest); both Wave 0 test files exist and pass (`pnpm test`: 4 files, 29 tests, including the WR-01 unknown-unit case added in 5e92a0b5b). The two Manual-Only rows (D-07 clear-cache, D-05/D-06/D-08 migrations) were confirmed by the maintainer in 06-UAT.md (7/7 passed).
