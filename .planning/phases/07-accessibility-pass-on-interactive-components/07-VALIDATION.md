---
phase: 7
slug: accessibility-pass-on-interactive-components
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-10-06
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `tsc` + aislop rescan as the real verifiers; vitest 5.0.1 (node env) for regression only — no component tests (D-15: no new test infra) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm build` (runs `tsc --project tsconfig.json && vite build`, ~30 s) |
| **Full suite command** | `pnpm build && pnpm test` plus the bucket-F rescan |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** `pnpm build` (D-14)
- **After every plan wave:** `pnpm build && pnpm test` + full bucket-F rescan
- **Before `/gsd-verify-work`:** rescan 43 → 0 reported, ignore inventory = 1 line, manual UAT signed
- **Max feedback latency:** 60 seconds

### Bucket-F rescan

```bash
pnpm exec aislop scan --json . > "$TMPDIR/scan.json"
node -e 'const d=require(process.argv[1]);const c={};let n=0;for(const x of d.diagnostics)if(x.rule.startsWith("jsx-a11y/")&&x.filePath.startsWith("src/")){c[x.rule]=(c[x.rule]||0)+1;n++}console.log(n,c,d.score)' "$TMPDIR/scan.json"
grep -rnE "aislop-ignore[a-z-]* jsx-a11y/" src   # expect exactly 1 line: views/settings/privacy/index.tsx (D-12)
```

---

## Per-Task Verification Map

Filled in by the planner per task; every task carries `pnpm build` plus a targeted rescan assertion.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements (no test files to create; D-15).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Converted buttons are keyboard operable | D-07 | No jsdom/Testing Library (D-15) | Wallet select button and RelayIconStack: Tab focus visible, Enter/Space activate; Remove on a wallet card does not select it |
| Landmarks and names in the accessibility tree | D-04, D-06, D-09, D-19, D-20 | Browser-only | DevTools AX tree: one `main` per page; article page structure; `dialog` + `navigation "Main navigation"` in the mobile drawer; iframe titles |
| No page-wide live region | D-04 | Screen reader behavior | On a `VerticalPageLayout` view, content refreshes are no longer announced |
| Composite widgets still work | D-10, D-11, D-12 | Interactive | Composer @-mention / emoji autocomplete; relay URL input datalist suggestions; privacy share-service suggestions |
| Visual parity | D-13 | Visual | Light/dark, mobile/desktop: wallet cards, relay icon stack, article page, tags row, cards, loading-nostr-link list, drawer, side nav, invoice modal |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
