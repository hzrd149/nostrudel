---
phase: 7
slug: accessibility-pass-on-interactive-components
status: draft
nyquist_compliant: true
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
| 7-01-01 | 01 | 1 | D-01, D-02, D-05, D-14, D-16, D-17, D-18 | T-07-02 | baseline counts measured, not transcribed | doc check | 43-row `grep -cE` on 07-BASELINE.md + TSV is 317 lines summing to 579 (43 bucket-F) | ✅ | ⬜ pending |
| 7-01-02 | 01 | 1 | D-03 | T-07-01 | ROADMAP edited by scoped Edit only | roadmap validate | `gsd-tools roadmap validate` + phase-heading count 14 + Phase 7 entry greps | ✅ | ⬜ pending |
| 7-02-01 | 02 | 1 | D-06, D-13, D-17 | T-07-04 | creation forms keep `onSubmit` on a form element | build + scan | `pnpm build` + jq bucket-F (vertical-page-layout, torrents/new, webxdc/new) = 0, other = 1 | ✅ | ⬜ pending |
| 7-02-02 | 02 | 1 | D-06, D-18, D-17 | T-07-06 | no ignore added | build + scan | `pnpm build` + jq all rules (side-nav, note-filter-type-buttons, invoice-modal) = 0 | ✅ | ⬜ pending |
| 7-02-03 | 02 | 1 | D-04, D-06, D-19, D-17 | T-07-05 | drawer close-on-click and focus return kept | build + scan + grep | `pnpm build` + jq all rules (vertical-page-layout, nav-drawer) = 0 + no live region | ✅ | ⬜ pending |
| 7-03-01 | 03 | 1 | D-10, D-17 | T-07-07 | URL normalization lines untouched | build + scan | `pnpm build` + jq bucket-F (relay-url-input) = 0, other = 3 | ✅ | ⬜ pending |
| 7-03-02 | 03 | 1 | D-11, D-17 | T-07-09 | N/A | build + scan | `pnpm build` + jq bucket-F (magic-textarea) = 0, other = 4 | ✅ | ⬜ pending |
| 7-04-01 | 04 | 1 | D-06, D-17 | — | N/A | build + scan | `pnpm build` + jq bucket-F on compact-note:47 and loading-nostr-link:195 = 0, 4 left in the two files | ✅ | ⬜ pending |
| 7-04-02 | 04 | 1 | D-04, D-06, D-07, D-08, D-13, D-17 | T-07-12 | toggle handler and pressed state kept | build + scan + grep | `pnpm build` + jq all rules (compact-note, loading-nostr-link) = 1 + no tabIndex | ✅ | ⬜ pending |
| 7-04-03 | 04 | 1 | D-07, D-13, D-17 | T-07-10, T-07-11 | `type="button"`; popover handlers cloned by PopoverTrigger | build + scan + grep | `pnpm build` + jq all rules (relay-icon-stack) = 0 + no tabIndex | ✅ | ⬜ pending |
| 7-05-01 | 05 | 1 | D-09, D-17 | T-07-14, T-07-15 | iframe allow/src lines unchanged | build + scan | `pnpm build` + jq bucket-F (user-avatar, music) = 0, other = 3 | ✅ | ⬜ pending |
| 7-05-02 | 05 | 1 | D-09, D-17 | T-07-13, T-07-14 | app name passed as a plain string prop | build + scan | `pnpm build` + jq bucket-F (webxdc, webxdc-player) = 0, other = 12 | ✅ | ⬜ pending |
| 7-06-01 | 06 | 2 | D-06, D-13, D-20, D-17 | T-07-17 | layout renders main before the view's role prop is removed | build + scan | precondition grep + `pnpm build` + jq bucket-F article.tsx (except line 42) = 0, article-tags = 0 | ✅ | ⬜ pending |
| 7-06-02 | 06 | 2 | D-06, D-13, D-17 | T-07-16 | overlay bounded by LinkBox | build + scan | `pnpm build` + jq all rules (article-card, thread, app-card) = 0 | ✅ | ⬜ pending |
| 7-06-03 | 06 | 2 | D-08, D-20, D-17 | — | N/A | build + scan + grep | `pnpm build` + jq all rules (article.tsx) = 0 + 3 remaining non-finding roles | ✅ | ⬜ pending |
| 7-07-01 | 07 | 2 | D-07, D-13, D-17 | T-07-18, T-07-19 | Remove is a sibling of the select button; `type="button"` | build + scan + grep | `pnpm build` + jq all rules (wallet) = 0 + no propagation stop | ✅ | ⬜ pending |
| 7-07-02 | 07 | 2 | D-12, D-17, D-18 | T-07-20, T-07-21 | same four URLs; one reasoned ignore | build + scan + grep | `pnpm build` + jq all rules (privacy) = 0 + one ignore line + prettier diff only the pre-existing 4 lines | ✅ | ⬜ pending |
| 7-08-01 | 08 | 3 | D-01, D-14, D-16, D-17, D-18 | T-07-22 | after counts measured; no-other-change diff mechanical | build + test + scan + diff | `pnpm build && pnpm test` + bucket-F under src/ = 0 + ignore grep = 1 + snapshot diff vs 07-BASELINE-DIAGNOSTICS.tsv empty | ✅ | ⬜ pending |
| 7-08-02 | 08 | 3 | D-05, D-15 | T-07-23, T-07-24 | ROADMAP via handler; UAT never marked verified | roadmap validate | `gsd-tools roadmap validate` + phase-heading count 14 + no 07-UAT.md | ✅ | ⬜ pending |

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
| Creation forms keep one `main` and still submit | D-06 (planner-found guard, 07-02) | Browser-only | Torrents and webxdc "new" pages: AX tree shows one `main` containing the form; submitting still publishes |

The full checklist with steps is recorded by plan 07-08 in `07-BASELINE.md` ("Manual verification outstanding"); /gsd-verify-work turns it into `07-UAT.md`.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s (per-task gate: build ~30 s + scan ~12 s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
