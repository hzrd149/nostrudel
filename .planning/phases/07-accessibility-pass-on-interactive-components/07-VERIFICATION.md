---
phase: 07-accessibility-pass-on-interactive-components
verified: 2026-10-06T22:00:00Z
status: human_needed
score: 16/20 must-haves verified
behavior_unverified: 4
overrides_applied: 0
gaps: []
behavior_unverified_items:
  - truth: "D-07 / D-13: wallet cards and RelayIconStack are real native buttons that are keyboard-operable and visually unchanged"
    test: "Settings > Wallet: Tab to a card, Enter and Space select it, Remove does not select. Notes tab: Tab to the relay icon stack, Enter/Space/click open the popover, inset focus ring not clipped."
    expected: "Native button activation and a visible focus ring; same look as before in light and dark."
    why_human: "Native element, onClick and focus style are present in code; keyboard activation and rendered focus ring cannot be observed without a browser."
  - truth: "D-11: composer @-mention / :emoji autocomplete still works after dropping role=option and aria-labels from the item spans"
    test: "Type @ali and :smi in the composer; navigate with arrow keys + Enter and by click."
    expected: "Suggestions appear with avatar, name and emoji; both input methods insert."
    why_human: "Item components are changed but react-textarea-autocomplete runtime behaviour has no test."
  - truth: "D-10 / D-12: relay URL input and privacy share-service datalists still show their suggestions"
    test: "Type in a relay URL input; open Settings > Privacy > Share service."
    expected: "Datalist suggestions appear (four share services; relay suggestions); Enter/blur normalise to wss://."
    why_human: "Native datalist rendering is browser behaviour."
  - truth: "D-04 / D-06 / D-19 / D-20: landmarks, names and the absent live region as exposed in the accessibility tree and by a screen reader"
    test: "DevTools AX tree on article, thread, timeline, torrents/new, webxdc/new and the mobile drawer; screen reader on a timeline refresh."
    expected: "Exactly one main per page; named article/region/list/navigation/dialog as listed in 07-BASELINE.md row 4; no announcements of page content changes."
    why_human: "Accessibility-tree exposure and screen-reader announcement are browser-only. Source has the attributes in place."
human_verification:
  - test: "Wallet cards keyboard-selectable (07-BASELINE manual row 1)"
    expected: "Tab ring, Enter/Space select, Remove independent, same look light and dark"
    why_human: "Keyboard/focus behaviour"
  - test: "RelayIconStack keyboard-operable (row 2)"
    expected: "Inset ring not clipped; Enter/Space/click open popover; row-reverse order unchanged on user notes tab"
    why_human: "Keyboard/focus behaviour"
  - test: "Compact note Show More (row 3)"
    expected: "Looks identical, not a Tab stop, not announced as a button"
    why_human: "Accessibility tree"
  - test: "Landmarks in AX tree (row 4)"
    expected: "One main per page including torrents/webxdc creation pages (forms still submit); article page main 'Article Content' with article and list 'Article tags'; list 'Available relays'; region 'Link details'; region 'Payment options'; dialog 'Main navigation menu' containing navigation 'Main navigation'; desktop navigation 'Main navigation'; article 'Note content'. NOTE: row 4 still says 'a footer inside it' for the article page, which is stale after CR-01 (the byline is now a plain div)."
    why_human: "Accessibility tree"
  - test: "No page-wide live region (row 5)"
    expected: "Screen reader no longer announces VerticalPageLayout content changes"
    why_human: "Screen reader behaviour"
  - test: "Composer autocomplete (row 6)"
    expected: "@ali / :smi suggestions appear and insert by keyboard and click"
    why_human: "Runtime interaction"
  - test: "Relay URL input (row 7)"
    expected: "Datalist suggestions appear; Enter/blur normalise to wss://"
    why_human: "Runtime interaction"
  - test: "Privacy share service (row 8)"
    expected: "Same four suggestions"
    why_human: "Runtime interaction"
  - test: "Iframe titles (row 9)"
    expected: "'SoundCloud player', 'Song.link player', webxdc app name in the AX tree; webxdc app still loads"
    why_human: "Accessibility tree and runtime"
  - test: "Visual parity, light/dark, mobile/desktop (row 10)"
    expected: "Wallet cards, relay icon stack, article page (byline now a div), article/thread/app cards (overlay covers card), loading-nostr-link list, mobile drawer, side nav, invoice modal, VerticalPageLayout pages incl. creation forms"
    why_human: "Visual appearance (D-13)"
---

# Phase 7: Accessibility pass on interactive components Verification Report

**Phase Goal:** The interactive components that screen readers currently misreport (custom roles that should be plain tags, roles missing their required ARIA props, and unlabelled controls) are corrected, starting with the shared components that every view inherits.
**Verified:** 2026-10-06
**Status:** human_needed
**Re-verification:** No, initial verification

All source-observable work is done and independently measured. The remaining items are the browser-only checks that D-15 deliberately assigned to a manual UAT. No FAILED truth, no blocker.

## Live measurements (taken by the verifier, not copied from SUMMARY)

| Check | Result |
|---|---|
| `pnpm exec aislop scan --json .` | exits 1 by design; JSON: score 86, 562 diagnostics (536 in `src/`), **0 `jsx-a11y/*`** anywhere (baseline 43) |
| `src/` snapshot vs `07-BASELINE-DIAGNOSTICS.tsv` minus `jsx-a11y/` lines | `diff` empty (292 lines): no other (file, rule, count) moved |
| `grep -rnE "aislop-ignore[a-z-]* jsx-a11y/" src` | exactly 1 line: `src/views/settings/privacy/index.tsx:214`, rule named, `-- reason` present |
| `pnpm build` | exit 0 |
| `pnpm test` | exit 0, 4 files, 29/29 |
| `package.json`, `pnpm-lock.yaml`, `.aislop` diff since `1479dc08a` | empty (no new dependencies or test infra, D-15) |
| `TBD`/`FIXME`/`XXX` in the 24 files changed under `src/` | none |
| Remaining `role=` in `src/` | only `role="toolbar"` (x4) and `role="doc-subtitle"`; all valid and not flagged |
| `aria-live` on `VerticalPageLayout` | gone; `<Flex ... {...props} as="main">` |

## Goal Achievement: Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Custom roles that should be plain tags are native elements (roadmap goal) | VERIFIED | `prefer-tag-over-role` 26 -> 0 live. Code: `VerticalPageLayout as="main"`, `DrawerBody as="nav"`, `ModalBody as="section"`, `Box as="article"` in compact-note, `Flex as="ul"` + `Box as="li"` in loading-nostr-link, `Box as="section"` link details, `Box as="ul"` / `Link as="li"` in article-tags, `LinkBox as="article"` in article-card, app-card, thread |
| 2 | Roles missing required ARIA props are corrected (roadmap goal) | VERIFIED | `role-has-required-aria-props` 6 -> 0, `no-redundant-roles` 2 -> 0, `role-supports-aria-props` 1 -> 0. Option, combobox, listbox, heading roles deleted from `magic-textarea.tsx`, `relay-url-input.tsx`, `article.tsx` |
| 3 | Unlabelled controls get names (roadmap goal) | VERIFIED | `alt=""` on identicon; `title="SoundCloud player"`, `title="Song.link player"`; webxdc iframe `title={title}` fed by `getWebxdcName(event)` with `"Webxdc app"` default; `iframe-has-title` 2 -> 0, `alt-text` 1 -> 0 |
| 4 | Shared components went first (roadmap goal, D-16) | VERIFIED | Wave 1 = layout/nav, composite widgets, shared controls, names; Wave 2 = views; commit order in 07-BASELINE and `git log` |
| 5 | D-01 every finding fixed or carries a scoped ignore with reason | VERIFIED | 0 findings live; one ignore with named rule and reason (see above) |
| 6 | D-02 43-finding baseline measured and recorded | VERIFIED | 07-BASELINE.md per-rule table and 43-row disposition table; TSV 317 lines |
| 7 | D-03 ROADMAP Phase 7 entry corrected | VERIFIED | ROADMAP shows 43 findings, per-rule counts, concentrations (6/5/5/5/4), 8/8 plans |
| 8 | D-04 adjacent harms fixed (aria-live, fake Show More, listitem+aria-pressed) | VERIFIED | `vertical-page-layout.tsx` has no `aria-live`; compact-note Show More is `<Text as="span">`, no role/tabIndex; toggle `Button` has `aria-pressed` and sits in a `Box as="li"` |
| 9 | D-05 no wider audit | VERIFIED | Diff is limited to the 24 files in scope; deferred ideas logged in 07-BASELINE |
| 10 | D-06 landmark/structure roles become native elements | VERIFIED | See truth 1; `side-nav.tsx` keeps `as="nav"` and the redundant role is deleted. Note: article byline became a plain `Box` rather than `as="footer"` after review CR-01 (footer inside header is invalid HTML); the role is gone and the rule is clean (see Deviations) |
| 11 | D-07 clickable non-buttons become real buttons; non-interactive loses role/tabIndex | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `Flex as="button" type="button"` with `_focusVisible` in `relay-icon-stack.tsx`; wallet card `Flex as="button" type="button" onClick aria-pressed` in `settings/wallet/index.tsx`; Show More role/tabIndex removed. Keyboard activation and focus ring not exercised |
| 12 | D-08 wrong roles deleted | VERIFIED | `role="heading"` gone (`<Heading as="h1">` inside `<Box as="header">`); listitem role gone from the toggle `Button` |
| 13 | D-09 iframe titles and decorative alt | VERIFIED | See truth 3 |
| 14 | D-10 relay-url-input drops hand-added combobox ARIA | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `Input list="relay-suggestions"` with `aria-describedby`; no `role`, `aria-expanded`, `aria-autocomplete`; plain `<datalist>`/`<option>`. Suggestions appearing is browser behaviour |
| 15 | D-11 autocomplete items lose `role="option"` | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Three item `<span>`s are plain; image `alt={name}` kept; `aria-label`s also dropped by WR-01 (D-11 left them to the planner). Autocomplete still working is not exercised |
| 16 | D-12 privacy datalist from one array behind one reasoned ignore | VERIFIED | `SHARE_SERVICES` array (4 entries) mapped to one `<option>` at `:214`; the ignore comment sits on line 214 and covers the `<option>` on the next line (grep and the scan agree); URLs not moved to `src/const.ts` (Phase 8) as decided |
| 17 | D-13 conversions keep current styling | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Resets present in code (`bg="transparent"`, `p`, `textAlign="start"`, `color="inherit"`, `lineHeight="inherit"`, `display="flex"` on app-card, `display="inline"` tags). Visual parity needs a browser |
| 18 | D-14 scoped rescan 43 -> N table plus ignore inventory; build passes | VERIFIED | 07-BASELINE.md table 43 -> 0 matches live scan; inventory matches grep; build exit 0 |
| 19 | D-15 no new test infrastructure; manual UAT checklist recorded | VERIFIED | No dependency or lockfile change; 10-row "Manual verification outstanding" list in 07-BASELINE.md (becomes `07-UAT.md` via verify-work) |
| 20 | D-16/D-17/D-18/D-19/D-20 waves, commit split, rulings | VERIFIED | Wave order held. D-17: `refactor(07-NN)` vs `fix(07-NN)` split holds except the documented nav-drawer role removal inside fix commit `7a50a0ea3`. D-18: both `ButtonGroup`s keep `aria-label` with no `role` and no ignore. D-19: `DrawerContent aria-label="Main navigation menu"` plus `DrawerBody as="nav"`. D-20: inner `Box as="article"`, `Box as="header"` stays inside outer `<article>` |

**Score:** 16/20 truths verified; 4 present and wired but behavior-unverified (11, 14, 15, 17). None failed.

## D-ID accounting

| D-ID | Status |
|---|---|
| D-01 | Verified (truth 5) |
| D-02 | Verified (truth 6) |
| D-03 | Verified (truth 7) |
| D-04 | Verified (truth 8) |
| D-05 | Verified (truth 9) |
| D-06 | Verified (truth 10) |
| D-07 | Present, behavior unverified (truth 11) |
| D-08 | Verified (truth 12) |
| D-09 | Verified (truth 13) |
| D-10 | Present, behavior unverified (truth 14) |
| D-11 | Present, behavior unverified (truth 15) |
| D-12 | Verified (truth 16) |
| D-13 | Present, behavior unverified (truth 17) |
| D-14 | Verified (truth 18) |
| D-15 | Verified (truth 19) |
| D-16 to D-20 | Verified (truths 4 and 20) |

No D-ID is unaccounted for. REQUIREMENTS.md does not exist and the ROADMAP lists `Requirements: TBD`, so there are no orphaned requirement IDs.

## Key Link Verification

| From | To | Status | Details |
|---|---|---|---|
| `VerticalPageLayout` (`main`) | ~20 views | WIRED | Only `main` source in `src/`; no caller passes `as` (type is `Omit<FlexProps, "as">`, `as="main"` placed after the spread, so it cannot be overridden); build passes |
| `torrents/new.tsx`, `webxdc/new.tsx` | `VerticalPageLayout` | WIRED | `Flex as="form"` nested inside the layout (`new.tsx:178`), so each page keeps exactly one `main` |
| `webxdc-player.tsx` title | `webxdc.tsx` iframe | WIRED | `title={getWebxdcName(event)}` to `WebxdcIframe` to `<iframe title={title}>` |
| `ArticleTags` / `LinkBox` cards | native `ul`/`li`/`article` | WIRED | Confirmed in source |
| `privacy` `<Input list="share-services">` | `<datalist id="share-services">` | WIRED | IDs match |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Bucket F is clear | aislop scan JSON, filter `jsx-a11y/` | 0 | PASS |
| No other diagnostic moved | `diff` of live vs baseline minus a11y lines | empty | PASS |
| Build | `pnpm build` | exit 0 | PASS |
| Unit tests | `pnpm test` | 29/29 | PASS |
| Keyboard, focus, AX tree, screen reader, visual parity | n/a | needs a browser | SKIP, routed to human verification |

## Probe Execution

SKIPPED: the phase declares no probes (`scripts/*/tests/probe-*.sh`) and none are referenced in the plans.

## Anti-Patterns Found

None blocking. No debt markers in changed files. Pre-existing and out of scope: `react-hooks/rules-of-hooks` error in `music.tsx` (backlog 999.2), and `react/refs` / `react-hooks/exhaustive-deps` in `magic-textarea.tsx`. `security/vulnerable-dependency` advisories on `package.json` drift with live data and are outside `src/`.

## Deviations and notes (not gaps)

1. **D-06 literal vs CR-01.** CONTEXT said the article byline (`contentinfo`) becomes `as="footer"`. Post-execution review CR-01 found a `footer` nested in `header` is invalid HTML, and commit `1d81e264c` made it a plain `Box`. The wrong role is gone, the rule is clean, and the D-20 `header`-inside-`article` structure is intact. Accepted as an improvement consistent with the phase goal. Cleanup: `07-BASELINE.md` row 31 ("convert: Box as footer") and manual row 4 ("a `footer` inside it") are now stale and should be edited before UAT is run.
2. **D-17.** The nav-drawer role removal shipped inside the `fix` commit `7a50a0ea3` (documented in 07-BASELINE).
3. **Review fixes.** CR-01 and WR-01 to WR-03 were applied and re-measured by the fixer. The verifier's own scan confirms they introduced no new a11y finding and no other diagnostic delta. Review IN-01 to IN-04 were left open, as scoped.

## Human Verification Required

See the `human_verification` list in the frontmatter (the ten rows of 07-BASELINE "Manual verification outstanding"). Four items (D-07, D-10, D-11, D-13) are behavior-dependent truths that code presence cannot prove.

## Gaps Summary

No gaps. Phase goal is achieved in the source: 43 to 0 `jsx-a11y/*` findings with a single reasoned ignore, no collateral diagnostic movement, build and tests green. The outstanding work is the browser and screen-reader UAT, which D-15 chose over new test infrastructure.

---

_Verified: 2026-10-06_
_Verifier: Claude (gsd-verifier)_
