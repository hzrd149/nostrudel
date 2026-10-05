---
phase: 6
slug: close-type-safety-escape-hatches
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 6-xx-xx | xx | 1–3 | D-xx | — | N/A | typecheck / unit / scan | see plan | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/webxdc/jsonrpc.ts` + `jsonrpc.test.ts` — the webxdc JSON-RPC message guard (D-11, D-14); must accept every envelope the old `as any` code accepted (D-15)
- [ ] `src/views/tools/event-console/process.test.ts` — the typed relative-time unit parser (D-18): every unit letter `h w m s d` in both cases maps to hour/week/minute/second/day; no unit → hour

*vitest itself is already installed (Phase 5).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Clear cache data" completes | D-07 | No `fake-indexeddb` in the repo; IndexedDB runs only in the browser | Settings → Cache → Database → Clear cache data: the button stops spinning and the page reloads, no `NotFoundError` in the console |
| IndexedDB migrations still run | D-05/D-06/D-08 | Same | Fresh profile (clear site data) boots without console errors; an existing profile boots and its accounts are intact |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
