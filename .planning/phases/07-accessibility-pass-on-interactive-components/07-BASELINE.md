# Phase 7 Baseline: bucket-F jsx-a11y findings

**Measured:** 2026-10-06 on `next`. Score 86/100, 605 whole-repo diagnostics (579 under `src/`), 43 bucket-F (`jsx-a11y/*`) findings, all under `src/`.
**Commit:** `b32ae8eaa` (planner measurement), `src/` identical to `1479dc08a` (CONTEXT D-02). Live re-confirmation by plan 07-01 ran at `e739dfddb` with `src/` still pristine (`git diff --stat 1479dc08a HEAD -- src` empty). The live scan (`pnpm exec aislop scan --json .`) returned 26 / 6 / 5 / 2 / 2 / 1 / 1, score 86, 605 diagnostics (579 in `src/`), and its 43 `file:line` locations are identical to the table below. No discrepancy.

These measured values supersede the ROADMAP's earlier 47 (2026-09-11 baseline). The phase compares `src/` only: the whole-repo total also includes `security/vulnerable-dependency` advisories on `package.json`, which track live advisory data and drift independently of source changes.

## Per-rule before/after (D-14)

Closed by plan 07-08 from a live rescan (`pnpm exec aislop scan --json .`, 2026-10-06, merged checkout on top of `0c5ed23ba`) restricted to `src/`. Score 86/100, `src/` total 536 (was 579, delta -43), 0 `jsx-a11y/*` findings anywhere in the scan. Whole-repo total 562 (was 605): the 26 diagnostics outside `src/` are unchanged in count and are mostly `security/vulnerable-dependency` advisories on `package.json`, which track live advisory data; they are not part of the comparison.

The five privacy findings (rows 39-43) are suppressed by one rule-scoped ignore after being collapsed onto one mapped line (D-12); the other 38 were fixed. D-18 deleted the two redundant `ButtonGroup` group roles (rows 2 and 4) instead of ignoring them.

| Rule | Before | After | Delta |
|---|---|---|---|
| `jsx-a11y/prefer-tag-over-role` | 26 | 0 | -26 |
| `jsx-a11y/role-has-required-aria-props` | 6 | 0 | -6 |
| `jsx-a11y/control-has-associated-label` | 5 | 0 | -5 |
| `jsx-a11y/no-redundant-roles` | 2 | 0 | -2 |
| `jsx-a11y/iframe-has-title` | 2 | 0 | -2 |
| `jsx-a11y/alt-text` | 1 | 0 | -1 |
| `jsx-a11y/role-supports-aria-props` | 1 | 0 | -1 |
| **Total** | **43** | **0** | **-43** |

## Per-finding dispositions (D-01)

Every finding carries a disposition (fix, delete, convert, name or ignore-with-reason) and an owning plan; none is left un-triaged and none is marked out of scope. File paths are relative to `src/`; rules drop the `jsx-a11y/` prefix.

| # | Rule | File:Line | Disposition | Decision | Plan | Resolved |
|---|---|---|---|---|---|---|
| 1 | prefer-tag-over-role | `components/layout/desktop/side-nav.tsx:23` | delete: redundant navigation role (element is already a nav) | D-06 | 07-02 | 07-02, `9dc1ac859` |
| 2 | prefer-tag-over-role | `components/layout/desktop/side-nav.tsx:49` | delete: redundant group role (ButtonGroup emits it) | D-18 | 07-02 | 07-02, `9dc1ac859` |
| 3 | prefer-tag-over-role | `components/layout/mobile/nav-drawer.tsx:35` | convert: role off DrawerContent, DrawerBody becomes a nav | D-06, D-19 | 07-02 | 07-02, `7a50a0ea3` |
| 4 | prefer-tag-over-role | `components/note-filter-type-buttons.tsx:12` | delete: redundant group role (ButtonGroup emits it) | D-18 | 07-02 | 07-02, `9dc1ac859` |
| 5 | prefer-tag-over-role | `components/invoice-modal.tsx:112` | convert: ModalBody as section | D-06 | 07-02 | 07-02, `9dc1ac859` |
| 6 | prefer-tag-over-role | `components/vertical-page-layout.tsx:9` | convert: inner Flex as main | D-06, D-04 | 07-02 | 07-02, `aaa4daea0` |
| 7 | prefer-tag-over-role | `components/magic-textarea.tsx:40` | delete: option role on autocomplete item | D-11 | 07-03 | 07-03, `27fe785e5` |
| 8 | role-has-required-aria-props | `components/magic-textarea.tsx:40` | delete: option role on autocomplete item | D-11 | 07-03 | 07-03, `27fe785e5` |
| 9 | prefer-tag-over-role | `components/magic-textarea.tsx:48` | delete: option role on autocomplete item | D-11 | 07-03 | 07-03, `27fe785e5` |
| 10 | role-has-required-aria-props | `components/magic-textarea.tsx:48` | delete: option role on autocomplete item | D-11 | 07-03 | 07-03, `27fe785e5` |
| 11 | prefer-tag-over-role | `components/magic-textarea.tsx:55` | delete: option role on autocomplete item | D-11 | 07-03 | 07-03, `27fe785e5` |
| 12 | role-has-required-aria-props | `components/magic-textarea.tsx:55` | delete: option role on autocomplete item | D-11 | 07-03 | 07-03, `27fe785e5` |
| 13 | prefer-tag-over-role | `components/relay-url-input.tsx:89` | delete: hand-added combobox ARIA on the native list input | D-10 | 07-03 | 07-03, `6dd24993a` |
| 14 | role-has-required-aria-props | `components/relay-url-input.tsx:89` | delete: hand-added combobox ARIA on the native list input | D-10 | 07-03 | 07-03, `6dd24993a` |
| 15 | no-redundant-roles | `components/relay-url-input.tsx:105` | delete: listbox role and label on the datalist | D-10 | 07-03 | 07-03, `6dd24993a` |
| 16 | no-redundant-roles | `components/relay-url-input.tsx:107` | delete: option role and label on each option | D-10 | 07-03 | 07-03, `6dd24993a` |
| 17 | role-has-required-aria-props | `components/relay-url-input.tsx:107` | delete: option role and label on each option | D-10 | 07-03 | 07-03, `6dd24993a` |
| 18 | prefer-tag-over-role | `components/compact-note-content.tsx:47` | convert: Box as article | D-06 | 07-04 | 07-04, `fe26f0325` |
| 19 | prefer-tag-over-role | `components/compact-note-content.tsx:52` | delete: fake button role and tab stop on Show More (no handler) | D-07, D-04 | 07-04 | 07-04, `e1ecef553` |
| 20 | prefer-tag-over-role | `components/loading-nostr-link.tsx:85` | convert: Flex as ul | D-06 | 07-04 | 07-04, `e1ecef553` |
| 21 | prefer-tag-over-role | `components/loading-nostr-link.tsx:96` | delete: listitem role on the toggle Button; li wrapper added | D-08, D-04 | 07-04 | 07-04, `e1ecef553` |
| 22 | role-supports-aria-props | `components/loading-nostr-link.tsx:97` | delete: cleared by the listitem removal (aria-pressed is valid on a button) | D-08 | 07-04 | 07-04, `e1ecef553` |
| 23 | prefer-tag-over-role | `components/loading-nostr-link.tsx:195` | convert: Box as section | D-06 | 07-04 | 07-04, `fe26f0325` |
| 24 | prefer-tag-over-role | `components/relay-icon-stack.tsx:30` | convert: Flex as native button | D-07, D-13 | 07-04 | 07-04, `1234cf3f2` |
| 25 | alt-text | `components/user/user-avatar.tsx:23` | name: empty alt (decorative identicon) | D-09 | 07-05 | 07-05, `d34f29255` |
| 26 | iframe-has-title | `components/content/links/music.tsx:132` | name: title SoundCloud player | D-09 | 07-05 | 07-05, `d34f29255` |
| 27 | iframe-has-title | `components/webxdc/webxdc.tsx:292` | name: title threaded from the app name | D-09 | 07-05 | 07-05, `2c34ce26d` |
| 28 | prefer-tag-over-role | `views/articles/article.tsx:40` | delete: main role prop (VerticalPageLayout renders main) | D-06 | 07-06 | 07-06, `6ec426968` |
| 29 | prefer-tag-over-role | `views/articles/article.tsx:42` | delete: heading role on the header Box (the h1 is the heading) | D-08 | 07-06 | 07-06, `b004fdc86` |
| 30 | role-has-required-aria-props | `views/articles/article.tsx:42` | delete: heading role on the header Box | D-08 | 07-06 | 07-06, `b004fdc86` |
| 31 | prefer-tag-over-role | `views/articles/article.tsx:52` | convert: Box as footer, then plain Box (CR-01: no footer inside header) | D-06 | 07-06 | 07-06, `6ec426968`; CR-01 `1d81e264c` |
| 32 | prefer-tag-over-role | `views/articles/article.tsx:86` | convert: Box as article | D-06, D-20 | 07-06 | 07-06, `6ec426968` |
| 33 | prefer-tag-over-role | `views/articles/components/article-card.tsx:37` | convert: LinkBox as article | D-06 | 07-06 | 07-06, `72f8eebe8` |
| 34 | prefer-tag-over-role | `views/articles/components/article-tags.tsx:6` | convert: Box as ul | D-06 | 07-06 | 07-06, `6ec426968` |
| 35 | prefer-tag-over-role | `views/articles/components/article-tags.tsx:10` | convert: Link as li, inline | D-06 | 07-06 | 07-06, `6ec426968` |
| 36 | prefer-tag-over-role | `views/other-stuff/component/app-card.tsx:30` | convert: LinkBox as article, display flex | D-06 | 07-06 | 07-06, `72f8eebe8` |
| 37 | prefer-tag-over-role | `views/thread/index.tsx:47` | convert: LinkBox as article | D-06 | 07-06 | 07-06, `72f8eebe8` |
| 38 | prefer-tag-over-role | `views/settings/wallet/index.tsx:48` | convert: select area becomes a native button, Card loses its role | D-07, D-13 | 07-07 | 07-07, `9aed46b20` |
| 39 | control-has-associated-label | `views/settings/privacy/index.tsx:210` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | 07-07, `01bab98e6` (ignored with reason) |
| 40 | control-has-associated-label | `views/settings/privacy/index.tsx:211` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | 07-07, `01bab98e6` (ignored with reason) |
| 41 | control-has-associated-label | `views/settings/privacy/index.tsx:212` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | 07-07, `01bab98e6` (ignored with reason) |
| 42 | control-has-associated-label | `views/settings/privacy/index.tsx:213` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | 07-07, `01bab98e6` (ignored with reason) |
| 43 | control-has-associated-label | `views/settings/privacy/index.tsx:214` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | 07-07, `01bab98e6` (ignored with reason) |

Per-plan tally: 07-02 6, 07-03 11, 07-04 7, 07-05 3, 07-06 10, 07-07 6 (= 43).

## Unflagged, in scope (D-04)

Three adjacent harms from commit `7e6b7795b`, on lines this phase touches, are fixed alongside the findings even though the linter does not flag them:

- The page-wide live region on `VerticalPageLayout` (plan 07-02).
- The fake "Show More" control with a button role and tab stop but no handler (plan 07-04, row 19).
- The listitem role plus pressed state on the relay toggle `Button` in `loading-nostr-link.tsx` (plan 07-04, rows 21-22).

Planner-found regression guard (no finding): `views/torrents/new.tsx` and `views/webxdc/new.tsx` pass `as="form"` into `VerticalPageLayout`, which would override the new `main` element and leave those two pages with no `main` landmark. Plan 07-02 nests their form inside the layout.

## Surviving-ignore inventory (D-12, D-14, D-18)

Ignored findings vanish from the scan, so this inventory comes from grep, run against the merged checkout:

```bash
grep -rnE "aislop-ignore[a-z-]* jsx-a11y/" src
```

Exactly one line matches:

- File: `src/views/settings/privacy/index.tsx`, line 214
- Rule: `jsx-a11y/control-has-associated-label`
- Directive: `aislop-ignore-next-line`
- Full text: `// aislop-ignore-next-line jsx-a11y/control-has-associated-label -- a datalist option's value is its accessible name; a visible label would change the suggestion dropdown`
- Resolves: rows 39-43 (five findings collapsed onto one mapped `<option key={url} value={url} />` line, plan 07-07, commit `01bab98e6`).

Reason check against the AGENTS.md "Inline ignores" and P4 D-08 bar: the rule is named, the reason follows `-- `, and it states why the finding is a false positive (an `<option>` in a datalist is named by its `value`; the linter wants label content) and why the alternative fix was rejected (visible option text would change what the suggestion dropdown renders). It does not merely say the code is deliberate. It passes the bar.

D-18 deleted the two redundant `ButtonGroup` group roles (rows 2 and 4) instead of ignoring them, so no ignore exists for them.

## src/ diagnostics snapshot

`07-BASELINE-DIAGNOSTICS.tsv` holds the `src/` (file, rule, count) snapshot: 317 lines, tab-separated, no header, `LC_ALL=C` sorted, counts summing to 579 (25 `jsx-a11y/` lines summing to 43, 292 other lines). Plan 07-08 compares a live snapshot against the TSV with the `jsx-a11y/` lines filtered out and expects zero difference, which proves no other diagnostic moved.

## Scope notes

- D-05: no axe run, focus-management work or keyboard audit. The wider accessibility audit is out of scope.
- Untitled `Box as="iframe"` sites (Song.link in `music.tsx`, blossom and relay homepage tabs, napplet frame, code links) are invisible to the linter and out of scope.
- The hardcoded combobox ARIA that react-textarea-autocomplete's `createAutocompleteProps` spreads onto the composer textarea is out of scope (deferred ARIA-listbox idea).
- The outer `VerticalPageLayout` scroll Box keeps its `tabIndex` and `aria-label` (D-05).
- Safari/VoiceOver drops list semantics for unstyled lists. Accepted: it cannot be fixed without re-triggering the rule.
- The pre-existing error-severity `react-hooks/rules-of-hooks` in `components/content/links/music.tsx` belongs to backlog 999.2 and is not touched.

## Executed wave and commit order (D-16, D-17)

Waves ran as planned. Wave 1 plans ran in parallel worktrees, so their commits interleave in `git log`; the order below is per plan.

- Wave 1, shared components: 07-01 (this baseline, snapshot and ROADMAP correction; `docs` commits `e72b5c0c5`, `5ae796016`), 07-02 layout and navigation, 07-03 composite widgets, 07-04 shared controls, 07-05 accessible names.
- Wave 2, views: 07-06 article views and link cards, 07-07 settings views.
- Wave 3, close-out: 07-08 (no source changes).

| Plan | Commit | Type | What |
|---|---|---|---|
| 07-02 | `aaa4daea0` | refactor | VerticalPageLayout inner Flex as `main`; torrents and webxdc creation forms nested inside it |
| 07-02 | `9dc1ac859` | refactor | drop redundant nav and group roles, invoice body as `section` |
| 07-02 | `7a50a0ea3` | fix | remove the page-wide live region, name the mobile nav dialog |
| 07-03 | `6dd24993a` | fix | relay URL input relies on native datalist semantics |
| 07-03 | `27fe785e5` | fix | drop the invalid option role from composer autocomplete items |
| 07-04 | `fe26f0325` | refactor | compact note as `article`, link details as `section` |
| 07-04 | `e1ecef553` | fix | native relay `ul`/`li` list, Show More no longer a fake button |
| 07-04 | `1234cf3f2` | fix | RelayIconStack as a native `button` with inset focus ring |
| 07-05 | `d34f29255` | fix | decorative identicon alt, SoundCloud iframe title |
| 07-05 | `2c34ce26d` | fix | webxdc iframe titled with the app name |
| 07-06 | `6ec426968` | refactor | article footer, content and tags as native elements |
| 07-06 | `72f8eebe8` | refactor | link cards as `LinkBox as="article"` |
| 07-06 | `b004fdc86` | fix | delete the article header heading role |
| 07-07 | `9aed46b20` | fix | wallet cards as keyboard-selectable native buttons |
| 07-07 | `01bab98e6` | chore | share services from one array behind the single reasoned ignore |

Mechanical role-to-tag commits use `refactor(07-NN)` and never share a commit with user-noticeable changes, which use `fix(07-NN)`. The single ignore is in its own `chore(07-07)` commit.

Deviations: none from the wave or commit plan. Two notes. The planner-found nesting of the two creation forms inside VerticalPageLayout (07-02) landed in the `refactor` commit `aaa4daea0` as planned (the diff is mostly re-indentation). The nav-drawer role removal (row 3) shipped in the `fix` commit `7a50a0ea3` with the drawer naming and live-region change rather than in a `refactor` commit.

## Phase close measurements

| Check | Result |
|---|---|
| `pnpm build` | exit 0 |
| `pnpm test` | exit 0, 4 files, 29 of 29 tests passed |
| aislop score | 86/100 (baseline 86) |
| `src/` diagnostics | 536 (baseline 579, delta -43) |
| `jsx-a11y/*` findings | 0 (baseline 43) |
| Live `src/` snapshot vs baseline minus `jsx-a11y/` lines | `diff` empty; live snapshot 292 lines; no non-a11y (file, rule, count) line moved |
| `grep -rnE "aislop-ignore[a-z-]* jsx-a11y/" src` | 1 line (privacy datalist) |
| Whole-repo diagnostics | 562 (baseline 605); the 26 outside `src/` are unchanged in count |

Advisory drift: `security/vulnerable-dependency` findings on `package.json` track live advisory data and are outside `src/`. The orchestrator saw two new advisories since the baseline (sharp, @modelcontextprotocol/sdk); they do not affect the `src/` comparison.

## Manual verification (all 10 passed in 07-UAT.md on 2026-10-06) (D-15)

None of these rows is verified. Each is browser-only or screen-reader-only behavior that a passing build cannot show. `/gsd-verify-work` turns this list into `07-UAT.md` (that file is created by the verify-work workflow, not by this plan). It also covers the rows in the `07-VALIDATION.md` "Manual-Only Verifications" table: keyboard-operable buttons (rows 1-3), landmarks and names (rows 4 and 9), no live region (row 5), composite widgets (rows 6-8), visual parity (row 10) and the creation forms keeping one `main` (row 4).

| # | Behavior | Plan | Decision | Steps | Status |
|---|---|---|---|---|---|
| 1 | Wallet cards are keyboard-selectable | 07-07 | D-07, D-13 | Settings, Wallet: Tab reaches the select button with a visible ring; Enter and Space select; Tab then reaches Remove; Remove does not select; clicking anywhere on the card except Remove selects; same look in light and dark | passed (07-UAT.md, 2026-10-06) |
| 2 | RelayIconStack is keyboard-operable | 07-04 | D-07, D-13 | Tab shows the inset ring (not clipped); Enter, Space and click open the popover (broken before this phase); `row-reverse` order unchanged on the user notes tab | passed (07-UAT.md, 2026-10-06) |
| 3 | Compact note "Show More" | 07-04 | D-04, D-07 | Looks identical to before; is not a Tab stop; is not announced as a button | passed (07-UAT.md, 2026-10-06) |
| 4 | Landmarks in the browser accessibility tree | 07-02, 07-04, 07-06 | D-06, D-19, D-20 | DevTools AX tree: exactly one `main` per page, including the torrents and webxdc creation pages (their forms still submit and publish); article page `main "Article Content"` with an `article` (byline is a plain container per CR-01) and `list "Article tags"`; `list "Available relays"` with pressed buttons; `region "Link details"`; `region "Payment options"`; the mobile drawer is a `dialog "Main navigation menu"` containing `navigation "Main navigation"`; desktop `navigation "Main navigation"`; compact note `article "Note content"` | passed (07-UAT.md, 2026-10-06) |
| 5 | No page-wide live region | 07-02 | D-04 | With a screen reader on a VerticalPageLayout view (for example a timeline refresh), content changes are no longer announced | passed (07-UAT.md, 2026-10-06) |
| 6 | Composer autocomplete | 07-03 | D-11 | Type `@ali` and `:smi`: suggestions appear; arrow keys with Enter, and click, both insert; items show avatar, name and emoji as before | passed (07-UAT.md, 2026-10-06) |
| 7 | Relay URL input | 07-03 | D-10 | Typing shows datalist suggestions; Enter and blur normalize to `wss://` | passed (07-UAT.md, 2026-10-06) |
| 8 | Privacy share service | 07-07 | D-12 | Settings, Privacy: the Share service input shows the same four suggestions | passed (07-UAT.md, 2026-10-06) |
| 9 | Iframe titles | 07-05 | D-09 | AX tree: the SoundCloud embed is named "SoundCloud player"; a launched webxdc app's iframe carries the app's name ("Webxdc app" when a caller passes none); the webxdc app still loads and runs | passed (07-UAT.md, 2026-10-06) |
| 10 | Visual parity, light and dark, mobile and desktop | all | D-13 | Wallet cards, relay icon stack, article page (title, subtitle, author row with floated avatar, date, inline blue tags with no bullets, toolbars, comments), article card, thread parent card and app card (overlay still covers the whole card), loading-nostr-link relay list (full-width outlined buttons, no bullets, pressed in primary color), mobile drawer, desktop side nav, invoice modal, VerticalPageLayout pages including the creation forms' spacing and width | passed (07-UAT.md, 2026-10-06) |

## Deferred observations (D-05)

Noticed during the phase and intentionally not acted on:

- The wider accessibility audit (axe run, focus management, keyboard navigation) is out of scope (D-05).
- The outer VerticalPageLayout scroll Box keeps an `aria-label` on a role-less element, which most assistive technology ignores.
- react-textarea-autocomplete's props spread permanently collapsed combobox ARIA onto the composer textarea; fixing it needs the deferred ARIA-listbox rework.
- Untitled `Box as="iframe"` embeds (Song.link in `music.tsx`, blossom and relay homepage tabs, napplet frame, code links) are invisible to the linter.
- Safari/VoiceOver drops list semantics for unstyled lists. Accepted: it cannot be fixed without re-triggering `prefer-tag-over-role`.
- The inherited error-severity `react-hooks/rules-of-hooks` finding in `src/components/content/links/music.tsx` (`useColorMode` after an early return) belongs to backlog 999.2. A future PR-branch cut will hit it.

## Commands

Bucket-F rescan (from `07-VALIDATION.md`):

```bash
pnpm exec aislop scan --json . > "$TMPDIR/scan.json"
node -e 'const d=require(process.argv[1]);const c={};let n=0;for(const x of d.diagnostics)if(x.rule.startsWith("jsx-a11y/")&&x.filePath.startsWith("src/")){c[x.rule]=(c[x.rule]||0)+1;n++}console.log(n,c,d.score)' "$TMPDIR/scan.json"
```

Snapshot (same form as the TSV):

```bash
jq -r '[.diagnostics[]|select(.filePath|startswith("src/"))]|group_by([.filePath,.rule])|.[]|"\(.[0].filePath)\t\(.[0].rule)\t\(length)"' "$TMPDIR/scan.json" | LC_ALL=C sort
```

Ignore inventory:

```bash
grep -rnE "aislop-ignore[a-z-]* jsx-a11y/" src   # expect exactly 1 line: views/settings/privacy/index.tsx (D-12)
```

Baseline for the grep: 0 matching lines today.
