---
phase: 07
slug: accessibility-pass-on-interactive-components
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-10-06
---

# Phase 07 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: **authored at plan time.** All eight PLAN files (07-01 … 07-08) carry a parseable
`<threat_model>` block. Together they declare 24 distinct IDs (T-07-01 … T-07-24), and no ID is
shared between plans, so nothing needed merging. Verification depth is ASVS L1 (each mitigation
must be present, checked at grep level). The block threshold is `high`.

Evidence basis: every check below was run against the current tree. Nothing was copied from a
SUMMARY. HEAD was `4761d2e5a` when the audit started. The orchestrator then committed `065b8ebd5`,
which touches only `07-UI-REVIEW.md` and `.planning/ui-reviews/.gitignore`, so `src/` did not
change during the audit. The phase range is `e739dfddb..HEAD`: 24 `src/` files, +305/-279. This
audit ran these measurements itself:

- `tsc --noEmit` exits 0.
- `vitest run` passes 4 files and 29 tests.
- A production `vite build` into a scratch `outDir` exits 0.
- A live `aislop scan --json .` of HEAD.
- An `aislop scan --json .` of the exported pre-phase tree `e739dfddb`. Its `src/` is identical to
  `1479dc08a` (`git diff --stat` is empty), `.aislop/` config is the same, and `node_modules` is
  linked.
- `gsd-tools roadmap validate`.
- A source check of `@webscopeio/react-textarea-autocomplete@4.9.2`'s dist bundle.

No implementation files were modified. The scratch artifacts were deleted.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| planning docs → downstream executors | Plans 07-02 … 07-08 read the baseline and the ROADMAP entry as fact (07-01) | Verification record |
| aislop scan output → baseline table and TSV | Tool output transcribed into markdown and a TSV (07-01) | Verification record |
| user → creation forms (torrents/new, webxdc/new) | The form is re-parented inside the layout. Its submit handler must stay bound to the form element (07-02) | Torrent / webxdc publish |
| user → mobile drawer | The close-on-click handler and focus return must keep working (07-02) | Navigation |
| user → relay URL input | Typed relay URLs are normalized and validated before use (07-03) | Relay URLs |
| network relay list → datalist | Discovered (NIP-66) relay URLs are rendered as option values (07-03) | Untrusted URLs |
| user → relay icon stack button / relay filter toggles | Activation opens a popover, and toggles change the event search set (07-04) | Relay set |
| Nostr event tags → iframe title | The webxdc app name comes from an untrusted event's `name`/`alt` tag or the .xdc filename (07-05) | Untrusted string |
| embedded third-party content → app | SoundCloud, song.link and webxdc iframes run under `allow`/`sandbox` policies (07-05) | Third-party code |
| user → link cards | A click navigates through the `HoverLinkOverlay` link (07-06) | Navigation |
| user → wallet cards | Selecting a card changes which wallet pays zaps. Remove deletes an NWC connection (07-07) | Payment routing |
| user → share-service input | The chosen URL becomes the base for shared nostr links (07-07) | Share URL |
| scan output, snapshot diff and grep → closing record | Later readers trust the closed 43 → 0 table as the phase's result (07-08) | Verification record |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-07-01 | Tampering | `.planning/ROADMAP.md` (07-01) | high | mitigate | Verified: `git log --full-history e739dfddb..HEAD -- .planning/ROADMAP.md` lists 4 non-merge commits. All hunks lie inside Phase 7: lines 329-373 at `e739dfddb`, and Phase 8 starts at 374/380. For `a1748387a` the hunks are at 338-341 and 347, both before the Plans list at line 351, so the Plans list is untouched. The cumulative `e739dfddb..HEAD` diff has hunks only at 336-373. `grep -c '^### Phase '` is 14 at `e739dfddb`, at each of the 4 commits and at HEAD. `roadmap validate` returns `{"warnings": []}`. | closed |
| T-07-02 | Repudiation (false record) | `07-BASELINE.md` and the TSV (07-01) | medium | mitigate | Verified independently. The pre-phase tree scans at score 86, 605 diagnostics (579 under `src/`) and 43 `jsx-a11y/*` (26/6/5/2/2/1/1). Its 43 `rule file:line` locations are byte-identical (`diff`) to the BASELINE disposition table. Its `src/` (file, rule, count) snapshot is byte-identical to `07-BASELINE-DIAGNOSTICS.tsv`, which has 317 lines summing to 579, with 25 `jsx-a11y/` lines summing to 43. | closed |
| T-07-03 | Information Disclosure | n/a (07-01) | low | accept | Accepted as R-07-01. Verified: the 07-01 commits `e72b5c0c5`, `a1748387a` and `5ae796016` touch only `.planning/` files. The TSV holds only file, rule and count. | closed — accepted (R-07-01) |
| T-07-04 | Denial of Service (broken submit) | `views/torrents/new.tsx`, `views/webxdc/new.tsx` (07-02) | medium | mitigate | Verified: `torrents/new.tsx:166` and `webxdc/new.tsx:178` hold `<Flex as="form" direction="column" gap="2" onSubmit={onSubmit}>`, with `onSubmit = handleSubmit(...)` unchanged (lines 102 and 110). The `type="submit"` buttons (lines 261 and 253) sit inside the form, which closes at lines 265 and 261, just before `</VerticalPageLayout>`. `git diff -w` shows only the wrapper swap plus prettier re-wraps. `tsc` and `vite build` exit 0. UAT test 4: forms still submit. | closed |
| T-07-05 | Tampering (navigation behavior) | `nav-drawer.tsx` `DrawerBody` (07-02) | low | mitigate | Verified: `nav-drawer.tsx:47` is `onClick={handleClickItem}` on the `DrawerBody`, and `handleClickItem` (line 26) is unchanged. Line 33 is `returnFocusOnClose={true}`. | closed |
| T-07-06 | Repudiation (silent rule suppression) | layout files (07-02) | low | mitigate | Verified: `grep -c aislop-ignore` returns 0 for side-nav, nav-drawer, vertical-page-layout, note-filter-type-buttons, invoice-modal, timeline-page, torrents/new and webxdc/new. | closed |
| T-07-07 | Tampering (input validation, ASVS V5) | `relay-url-input.tsx` normalization (07-03) | low | mitigate | Verified: the only commit is `6dd24993a`. Its diff removes `role`/`aria-autocomplete`/`aria-expanded` from the input and `role`/`aria-label` from the datalist and options, and nothing else. 0 changed lines mention `normalize`, `handleBlur`, `handleKeyDown`, `nip66Discovery` or `setRelaysJson`. | closed |
| T-07-08 | Spoofing | datalist option values (07-03) | low | accept | Accepted as R-07-02. Verified: `value={url}` and `{url}` as text are unchanged diff context. No `dangerouslySetInnerHTML` was introduced. | closed — accepted (R-07-02) |
| T-07-09 | Denial of Service (autocomplete broken) | `magic-textarea.tsx` Item (07-03) | low | mitigate | Verified: the Item diff removes only `role="option"` (07-03) and the `aria-label`s (WR-01, `76ce2e042`). The content (`{name}`, `<Image alt={name}>`, `UserAvatar`/`UserName`/`UserDnsIdentity`) is unchanged. The library dist never reads item roles: its only `role` is its own `role: "button"` (line 303), and there are 0 `getAttribute` calls. Runtime: `07-UAT.md` test 6 `pass`. | closed |
| T-07-10 | Tampering (accidental form submit) | `relay-icon-stack.tsx` button (07-04) | low | mitigate | Verified: `relay-icon-stack.tsx` has `as="button"` and `type="button"` on the trigger `Flex`. No `<RelayIconStack` caller passes `type=`. | closed |
| T-07-11 | Denial of Service (popover no longer opens) | `RelayIconStack` (07-04) | low | mitigate | Verified: the native button is still the direct child of `<PopoverTrigger>` inside `<Popover isLazy>`. Runtime: `07-UAT.md` test 2 `pass` (Enter, Space and click open the popover). | closed |
| T-07-12 | Tampering (wrong relay toggled) | `SearchOnRelaysModal` list (07-04) | low | mitigate | Verified: `loading-nostr-link.tsx` keeps `colorScheme={relays.has(relay) ? "primary" : undefined}`, `onClick={() => (relays.has(relay) ? actions.remove(relay) : actions.add(relay))}` and `aria-pressed={relays.has(relay)}` verbatim. Only `role="listitem"` is removed. `key={relay}` moves to the `<Box as="li">`. | closed |
| T-07-13 | Spoofing / Tampering (injection) | `WebxdcPlayer` → iframe `title` (07-05) | low | mitigate | Verified: `getWebxdcName` (`helpers/nostr/webxdc.ts:27`) returns `string`. It is passed as the JSX prop `title={getWebxdcName(event)}` (`webxdc-player.tsx:147`) to `<iframe title={title}>` (`webxdc.tsx:295`). No `dangerouslySetInnerHTML` exists under `components/webxdc`, `views/webxdc` or `music.tsx`. The same name is already rendered at `views/webxdc/index.tsx:45` and `app.tsx:40`. | closed |
| T-07-14 | Elevation of Privilege | iframe `allow` / `sandbox` / `src` (07-05) | medium | mitigate | Verified: both commits touching `music.tsx` are +1 line each: `d34f29255` adds `title="SoundCloud player"` and `1b74c6c67` (WR-02) adds `title="Song.link player"`. Neither changes an `allow`, `sandbox` or `src` line. The song.link `sandbox` (line 122) is unchanged. The webxdc `allow="autoplay; fullscreen; gamepad"` (`webxdc-player.tsx:42`) differs only by re-indentation. In `webxdc.tsx` the `src={\`${origin}/\`}` value and the trailing `{...iframeProps}` spread are unchanged. | closed |
| T-07-15 | Repudiation (inherited error) | `music.tsx` rules-of-hooks (07-05) | low | accept | Accepted as R-07-03. Verified: `react-hooks/rules-of-hooks` (error) is at `music.tsx:110` in both the pre-phase and the HEAD scans. It is recorded in `07-05-SUMMARY.md:48` and is owned by backlog 999.2 (`ROADMAP.md:424`). | closed — accepted (R-07-03) |
| T-07-16 | Tampering (click target escapes card) | `article-card.tsx`, `app-card.tsx`, `thread/index.tsx` (07-06) | low | mitigate | Verified: all three roots are `<LinkBox as="article" …>` (article-card `position="relative"`, app-card `display="flex"`, thread ParentCard `thread/index.tsx:38`). `app-card.tsx` has 0 `Flex as="article"`. `HoverLinkOverlay` stays inside the cards (`article-card.tsx:56`, `app-card.tsx:38`). Runtime: `07-UAT.md` test 10 `pass` (the overlay covers the whole card). | closed |
| T-07-17 | Repudiation (silent landmark loss) | `article.tsx` main (07-06) | low | mitigate | Verified: `aaa4daea0` (07-02, 16:19) made the layout `main` before `6ec426968` (07-06, 16:26) removed `role="main"` from `article.tsx`. At HEAD, `vertical-page-layout.tsx` renders `<Flex … {...props} as="main">` with props typed `Omit<FlexProps, "as">` (WR-03, `e882f2918`), so a spread cannot replace the landmark. No caller passes `as` or `role` to `<VerticalPageLayout`. | closed |
| T-07-18 | Tampering (unintended wallet activation) | `WalletCard` select vs Remove (07-07) | medium | mitigate | Verified: in `settings/wallet/index.tsx`, the select `<Flex as="button" type="button" … onClick={() => setActiveWallet(wallet.id)}>` closes at line 71. The Remove `IconButton` with `onClick={onRemove}` is its sibling inside `CardBody` and not a descendant. `Card` and `CardBody` have no `onClick` and no `role`. Runtime: `07-UAT.md` test 1 `pass` (Remove does not select). | closed |
| T-07-19 | Tampering (accidental form submit) | wallet select button (07-07) | low | mitigate | Verified: `type="button"` at `settings/wallet/index.tsx:47`. | closed |
| T-07-20 | Tampering (share-service suggestions altered) | `SHARE_SERVICES` (07-07) | low | mitigate | Verified: `privacy/index.tsx:24` lists `njump.me`, `nostr.com`, `nostr.at` and `nostr.eu`, the same four URLs in the same order as the four removed `<option>` lines. The diff touches only the const and the datalist body. Input registration and validation are untouched. Runtime: `07-UAT.md` test 8 `pass`. | closed |
| T-07-21 | Repudiation (unjustified suppression) | privacy ignore directive (07-07) | low | mitigate | Verified: `grep -rnE "aislop-ignore[a-z-]* jsx-a11y/" src` returns exactly 1 line, `privacy/index.tsx:214`. That line names the single rule `jsx-a11y/control-has-associated-label`, and after `-- ` gives a reason covering both why it is a false positive (the value is the name) and why the alternative fix was rejected (a visible label would change the dropdown). It is inventoried in `07-BASELINE.md`. | closed |
| T-07-22 | Repudiation (false record) | `07-BASELINE.md` After column (07-08) | medium | mitigate | Verified independently, after the review fixes. The live HEAD scan gives 0 `jsx-a11y/*`, 536 under `src/` (579 − 43), 562 whole-repo and score 86. The HEAD `src/` snapshot (292 lines) is byte-identical to the TSV minus its `jsx-a11y/` lines. The ignore grep returns 1 line. The 07-08 `<verify>` gate (`07-08-PLAN.md:110`) contains the scan, the snapshot `diff` and the grep. | closed |
| T-07-23 | Tampering | `.planning/ROADMAP.md` (07-08) | high | mitigate | Verified: the `f55788989` hunks are at 336 and 373, inside Phase 7 (329-379). The wave-tracking commits `0c2f0538d` and `0c5ed23ba` are inside it as well (336, 360-364, 368-369). Phase-heading count is 14 and `roadmap validate` is clean on HEAD (see T-07-01). | closed |
| T-07-24 | Repudiation | unverified browser behaviors (07-08) | medium | mitigate | Verified: at close-out (`cae022420`), `07-BASELINE.md` "Manual verification outstanding" listed all 10 rows as `outstanding` with steps. `07-VERIFICATION.md` routed them to `human_verification`. Statuses changed to `passed` only in the UAT commit `79fa01aaa`, which records `07-UAT.md` 10/10 `pass` and is not based on a build result. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low. Only open threats at or above `workflow.security_block_on` (`high`) count toward threats_open.*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

All 24 threats are `closed`. 21 were mitigated and verified in code, git history or an independent
measurement. 3 are accepted and logged below. None is transferred, and none is open at any
severity. By severity the register holds 2 `high` (T-07-01, T-07-23), 6 `medium` and 16 `low`.
Both high threats are mitigated and verified. All accepted threats are `low`.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-07-01 | T-07-03 | 07-01 reads and writes only planning documents, with no secrets, keys or user data. The audit confirmed that all three 07-01 commits touch only `.planning/` files. | hzrd149 (07-01-PLAN.md) | 2026-10-06 |
| R-07-02 | T-07-08 | Discovered relay URLs were already rendered as option `value` and text before this phase. React escapes both, and this phase renders nothing new. | hzrd149 (07-03-PLAN.md) | 2026-10-06 |
| R-07-03 | T-07-15 | The error-severity `react-hooks/rules-of-hooks` finding at `music.tsx:110` predates the phase and is owned by backlog 999.2. Pushes to `next` are not gated on it. It matters only when a PR branch is cut. | hzrd149 (07-05-PLAN.md) | 2026-10-06 |

*Accepted risks do not resurface in future audit runs.*

---

## Residual Items (non-blocking)

None of these is an open threat. They are notes on verification quality, scope and record drift.

| Ref | Note | Tracked in |
|-----|------|------------|
| T-07-04, T-07-09, T-07-11, T-07-16, T-07-18, T-07-20 | The runtime evidence is human-attested. `07-UAT.md` records 10/10 `pass` (`79fa01aaa`) with result lines only. This audit verified code, diffs, scans and the build independently, but did not run a browser. | `07-UAT.md` |
| T-07-09 | The plan's "labels unchanged" premise no longer holds: WR-01 (`76ce2e042`) removed the item `aria-label`s as prohibited ARIA. The threat (autocomplete broken) is still mitigated. The library does not read labels or roles, and UAT test 6 ran after the fix. | `07-REVIEW-FIX.md` WR-01 |
| T-07-14 | Review fix WR-02 (`1b74c6c67`) came after the plan and added a second `music.tsx` iframe title. The audit applied the same no-`allow`/`sandbox`/`src` check to it. | `07-REVIEW-FIX.md` WR-02 |
| T-07-17 | Review fix WR-03 (`e882f2918`) came after the plan and strengthened the mitigation: the type drops `as` and `as="main"` follows the spread. A caller could still pass a different `role` through `{...props}`. None does today. | `07-REVIEW-FIX.md` WR-03 |
| Record drift | The `07-BASELINE.md` manual section heading says all 10 passed, but its first sentence still reads "None of these rows is verified". `07-VERIFICATION.md` `human_verification` row 4 still mentions "a footer inside it" (stale after CR-01). The 07-08 Task 2 verify command expects `test ! -e 07-UAT.md` and the old "Manual verification outstanding" heading. Both were true at close-out but are false now that UAT has run. This is stale documentation, not a security gap. | `07-BASELINE.md`, `07-VERIFICATION.md`, `07-08-PLAN.md` |
| Scan totals | Today's totals match the records exactly: pre-phase 605 / 579 `src/`, HEAD 562 / 536 `src/`, score 86 in both. Phase 6 saw environment drift between its records and its re-scan; Phase 7 does not. | `07-BASELINE.md` |

Unregistered threat flags: none. Five SUMMARYs (07-03 … 07-07) have a `## Threat Flags` section
that reads "None." (07-04 also cites T-07-10/11/12 as mitigated). 07-01, 07-02 and 07-08 have no
such section. `git diff e739dfddb..HEAD` touches no `package.json`, `pnpm-lock.yaml`, `.aislop/`,
`vite.config.ts` or `tsconfig.json`, so the phase adds no dependency and changes no build
configuration. A diff scan for changed `on*=`, `href=`, `src=`, `allow=`, `sandbox`,
`dangerously`, `fetch(`, `window.`, `localStorage` and `to=` lines finds only three spots. Each
maps to a registered threat:

- The nav-drawer `aria-label` move (T-07-05).
- The webxdc iframe title (T-07-13/14).
- The wallet Remove handler (T-07-18).

The review-fix commits (CR-01, WR-01, WR-02, WR-03) stay within the components of T-07-17,
T-07-09, T-07-14 and T-07-17 respectively.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-06 | 24 | 24 | 0 | /gsd-secure-phase (ASVS L1, block_on: high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-06
