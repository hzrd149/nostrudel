# Phase 7 Baseline: bucket-F jsx-a11y findings

**Measured:** 2026-10-06 on `next`. Score 86/100, 605 whole-repo diagnostics (579 under `src/`), 43 bucket-F (`jsx-a11y/*`) findings, all under `src/`.
**Commit:** `b32ae8eaa` (planner measurement), `src/` identical to `1479dc08a` (CONTEXT D-02). Live re-confirmation by plan 07-01 ran at `e739dfddb` with `src/` still pristine (`git diff --stat 1479dc08a HEAD -- src` empty). The live scan (`pnpm exec aislop scan --json .`) returned 26 / 6 / 5 / 2 / 2 / 1 / 1, score 86, 605 diagnostics (579 in `src/`), and its 43 `file:line` locations are identical to the table below. No discrepancy.

These measured values supersede the ROADMAP's earlier 47 (2026-09-11 baseline). The phase compares `src/` only: the whole-repo total also includes `security/vulnerable-dependency` advisories on `package.json`, which track live advisory data and drift independently of source changes.

## Per-rule before/after (D-14)

Closed by plan 07-08 from a live rescan restricted to `src/`.

| Rule | Before | After | Delta |
|---|---|---|---|
| `jsx-a11y/prefer-tag-over-role` | 26 | TBD (07-08) | TBD (07-08) |
| `jsx-a11y/role-has-required-aria-props` | 6 | TBD (07-08) | TBD (07-08) |
| `jsx-a11y/control-has-associated-label` | 5 | TBD (07-08) | TBD (07-08) |
| `jsx-a11y/no-redundant-roles` | 2 | TBD (07-08) | TBD (07-08) |
| `jsx-a11y/iframe-has-title` | 2 | TBD (07-08) | TBD (07-08) |
| `jsx-a11y/alt-text` | 1 | TBD (07-08) | TBD (07-08) |
| `jsx-a11y/role-supports-aria-props` | 1 | TBD (07-08) | TBD (07-08) |
| **Total** | **43** | TBD (07-08) | TBD (07-08) |

## Per-finding dispositions (D-01)

Every finding carries a disposition (fix, delete, convert, name or ignore-with-reason) and an owning plan; none is left un-triaged and none is marked out of scope. File paths are relative to `src/`; rules drop the `jsx-a11y/` prefix.

| # | Rule | File:Line | Disposition | Decision | Plan | Resolved |
|---|---|---|---|---|---|---|
| 1 | prefer-tag-over-role | `components/layout/desktop/side-nav.tsx:23` | delete: redundant navigation role (element is already a nav) | D-06 | 07-02 | TBD |
| 2 | prefer-tag-over-role | `components/layout/desktop/side-nav.tsx:49` | delete: redundant group role (ButtonGroup emits it) | D-18 | 07-02 | TBD |
| 3 | prefer-tag-over-role | `components/layout/mobile/nav-drawer.tsx:35` | convert: role off DrawerContent, DrawerBody becomes a nav | D-06, D-19 | 07-02 | TBD |
| 4 | prefer-tag-over-role | `components/note-filter-type-buttons.tsx:12` | delete: redundant group role (ButtonGroup emits it) | D-18 | 07-02 | TBD |
| 5 | prefer-tag-over-role | `components/invoice-modal.tsx:112` | convert: ModalBody as section | D-06 | 07-02 | TBD |
| 6 | prefer-tag-over-role | `components/vertical-page-layout.tsx:9` | convert: inner Flex as main | D-06, D-04 | 07-02 | TBD |
| 7 | prefer-tag-over-role | `components/magic-textarea.tsx:40` | delete: option role on autocomplete item | D-11 | 07-03 | TBD |
| 8 | role-has-required-aria-props | `components/magic-textarea.tsx:40` | delete: option role on autocomplete item | D-11 | 07-03 | TBD |
| 9 | prefer-tag-over-role | `components/magic-textarea.tsx:48` | delete: option role on autocomplete item | D-11 | 07-03 | TBD |
| 10 | role-has-required-aria-props | `components/magic-textarea.tsx:48` | delete: option role on autocomplete item | D-11 | 07-03 | TBD |
| 11 | prefer-tag-over-role | `components/magic-textarea.tsx:55` | delete: option role on autocomplete item | D-11 | 07-03 | TBD |
| 12 | role-has-required-aria-props | `components/magic-textarea.tsx:55` | delete: option role on autocomplete item | D-11 | 07-03 | TBD |
| 13 | prefer-tag-over-role | `components/relay-url-input.tsx:89` | delete: hand-added combobox ARIA on the native list input | D-10 | 07-03 | TBD |
| 14 | role-has-required-aria-props | `components/relay-url-input.tsx:89` | delete: hand-added combobox ARIA on the native list input | D-10 | 07-03 | TBD |
| 15 | no-redundant-roles | `components/relay-url-input.tsx:105` | delete: listbox role and label on the datalist | D-10 | 07-03 | TBD |
| 16 | no-redundant-roles | `components/relay-url-input.tsx:107` | delete: option role and label on each option | D-10 | 07-03 | TBD |
| 17 | role-has-required-aria-props | `components/relay-url-input.tsx:107` | delete: option role and label on each option | D-10 | 07-03 | TBD |
| 18 | prefer-tag-over-role | `components/compact-note-content.tsx:47` | convert: Box as article | D-06 | 07-04 | TBD |
| 19 | prefer-tag-over-role | `components/compact-note-content.tsx:52` | delete: fake button role and tab stop on Show More (no handler) | D-07, D-04 | 07-04 | TBD |
| 20 | prefer-tag-over-role | `components/loading-nostr-link.tsx:85` | convert: Flex as ul | D-06 | 07-04 | TBD |
| 21 | prefer-tag-over-role | `components/loading-nostr-link.tsx:96` | delete: listitem role on the toggle Button; li wrapper added | D-08, D-04 | 07-04 | TBD |
| 22 | role-supports-aria-props | `components/loading-nostr-link.tsx:97` | delete: cleared by the listitem removal (aria-pressed is valid on a button) | D-08 | 07-04 | TBD |
| 23 | prefer-tag-over-role | `components/loading-nostr-link.tsx:195` | convert: Box as section | D-06 | 07-04 | TBD |
| 24 | prefer-tag-over-role | `components/relay-icon-stack.tsx:30` | convert: Flex as native button | D-07, D-13 | 07-04 | TBD |
| 25 | alt-text | `components/user/user-avatar.tsx:23` | name: empty alt (decorative identicon) | D-09 | 07-05 | TBD |
| 26 | iframe-has-title | `components/content/links/music.tsx:132` | name: title SoundCloud player | D-09 | 07-05 | TBD |
| 27 | iframe-has-title | `components/webxdc/webxdc.tsx:292` | name: title threaded from the app name | D-09 | 07-05 | TBD |
| 28 | prefer-tag-over-role | `views/articles/article.tsx:40` | delete: main role prop (VerticalPageLayout renders main) | D-06 | 07-06 | TBD |
| 29 | prefer-tag-over-role | `views/articles/article.tsx:42` | delete: heading role on the header Box (the h1 is the heading) | D-08 | 07-06 | TBD |
| 30 | role-has-required-aria-props | `views/articles/article.tsx:42` | delete: heading role on the header Box | D-08 | 07-06 | TBD |
| 31 | prefer-tag-over-role | `views/articles/article.tsx:52` | convert: Box as footer | D-06 | 07-06 | TBD |
| 32 | prefer-tag-over-role | `views/articles/article.tsx:86` | convert: Box as article | D-06, D-20 | 07-06 | TBD |
| 33 | prefer-tag-over-role | `views/articles/components/article-card.tsx:37` | convert: LinkBox as article | D-06 | 07-06 | TBD |
| 34 | prefer-tag-over-role | `views/articles/components/article-tags.tsx:6` | convert: Box as ul | D-06 | 07-06 | TBD |
| 35 | prefer-tag-over-role | `views/articles/components/article-tags.tsx:10` | convert: Link as li, inline | D-06 | 07-06 | TBD |
| 36 | prefer-tag-over-role | `views/other-stuff/component/app-card.tsx:30` | convert: LinkBox as article, display flex | D-06 | 07-06 | TBD |
| 37 | prefer-tag-over-role | `views/thread/index.tsx:47` | convert: LinkBox as article | D-06 | 07-06 | TBD |
| 38 | prefer-tag-over-role | `views/settings/wallet/index.tsx:48` | convert: select area becomes a native button, Card loses its role | D-07, D-13 | 07-07 | TBD |
| 39 | control-has-associated-label | `views/settings/privacy/index.tsx:210` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | TBD |
| 40 | control-has-associated-label | `views/settings/privacy/index.tsx:211` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | TBD |
| 41 | control-has-associated-label | `views/settings/privacy/index.tsx:212` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | TBD |
| 42 | control-has-associated-label | `views/settings/privacy/index.tsx:213` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | TBD |
| 43 | control-has-associated-label | `views/settings/privacy/index.tsx:214` | ignore-with-reason: collapsed onto one mapped option line | D-12 | 07-07 | TBD |

Per-plan tally: 07-02 6, 07-03 11, 07-04 7, 07-05 3, 07-06 10, 07-07 6 (= 43).

## Unflagged, in scope (D-04)

Three adjacent harms from commit `7e6b7795b`, on lines this phase touches, are fixed alongside the findings even though the linter does not flag them:

- The page-wide live region on `VerticalPageLayout` (plan 07-02).
- The fake "Show More" control with a button role and tab stop but no handler (plan 07-04, row 19).
- The listitem role plus pressed state on the relay toggle `Button` in `loading-nostr-link.tsx` (plan 07-04, rows 21-22).

Planner-found regression guard (no finding): `views/torrents/new.tsx` and `views/webxdc/new.tsx` pass `as="form"` into `VerticalPageLayout`, which would override the new `main` element and leave those two pages with no `main` landmark. Plan 07-02 nests their form inside the layout.

## Expected surviving-ignore inventory (D-12, D-18)

Exactly one rule-scoped ignore is expected to survive: `views/settings/privacy/index.tsx`, naming `jsx-a11y/control-has-associated-label` (the datalist option line, D-12). D-18 deleted the two redundant `ButtonGroup` group roles (rows 2 and 4) instead of ignoring them, so RESEARCH's "3 if D-08 is honored literally" no longer applies.

## src/ diagnostics snapshot

`07-BASELINE-DIAGNOSTICS.tsv` holds the `src/` (file, rule, count) snapshot: 317 lines, tab-separated, no header, `LC_ALL=C` sorted, counts summing to 579 (25 `jsx-a11y/` lines summing to 43, 292 other lines). Plan 07-08 compares a live snapshot against the TSV with the `jsx-a11y/` lines filtered out and expects zero difference, which proves no other diagnostic moved.

## Scope notes

- D-05: no axe run, focus-management work or keyboard audit. The wider accessibility audit is out of scope.
- Untitled `Box as="iframe"` sites (Song.link in `music.tsx`, blossom and relay homepage tabs, napplet frame, code links) are invisible to the linter and out of scope.
- The hardcoded combobox ARIA that react-textarea-autocomplete's `createAutocompleteProps` spreads onto the composer textarea is out of scope (deferred ARIA-listbox idea).
- The outer `VerticalPageLayout` scroll Box keeps its `tabIndex` and `aria-label` (D-05).
- Safari/VoiceOver drops list semantics for unstyled lists. Accepted: it cannot be fixed without re-triggering the rule.
- The pre-existing error-severity `react-hooks/rules-of-hooks` in `components/content/links/music.tsx` belongs to backlog 999.2 and is not touched.

## Waves and commits (D-16, D-17)

- Wave 1, shared components: 07-02 layout and nav, 07-03 composite widgets, 07-04 shared controls, 07-05 accessible names, plus this plan (07-01).
- Wave 2, views: 07-06 article views and link cards, 07-07 settings views.
- Wave 3, close-out: 07-08.

Mechanical role-to-tag commits use the `refactor(07-NN)` type and never share a commit with user-noticeable changes, which use `fix(07-NN)`. The single ignore lands in its own `chore(07-07)` commit.

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
