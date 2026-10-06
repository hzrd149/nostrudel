# Phase 7: Accessibility pass on interactive components - Research

**Researched:** 2026-10-06
**Domain:** `jsx-a11y/*` lint remediation (aislop 0.16.1 / oxlint) on Chakra UI 2.10.10 + React 19.2 components
**Confidence:** HIGH (every remedy class was applied to a scratch worktree and measured with the real scanner, `tsc`, `pnpm build`, `pnpm test`, and a real Chromium accessibility tree)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope & completion**

- **D-01:** Done means **every bucket-F finding in `src/` is either fixed or carries a rule-scoped `aislop-ignore-*` with a reason** — the P4 D-01 / P5 D-01 / P6 D-01 bar. Every rule is warning severity, so nothing here gates CI; this is a chosen bar. Explicitly rejected: fixing only the shared components, and a zero-ignore absolute.
- **D-02:** **The measured starting point is 43 findings** at `next` @ `1479dc08a` (repo score 86), not the ROADMAP's 47: 26 `prefer-tag-over-role`, 6 `role-has-required-aria-props`, 5 `control-has-associated-label`, 2 `no-redundant-roles`, 2 `iframe-has-title`, 1 `alt-text`, 1 `role-supports-aria-props`. Per P4 D-02 / P5 D-03 / P6 D-02 the planner re-measures. (Per-file table: magic-textarea 6, relay-url-input 5, privacy/index 5, articles/article 5, loading-nostr-link 4, side-nav 2, compact-note-content 2, article-tags 2, and singles in music.tsx, invoice-modal, nav-drawer, note-filter-type-buttons, relay-icon-stack, user-avatar, vertical-page-layout, webxdc.tsx, article-card, app-card, wallet/index, thread/index.) Most of these roles were added by one commit, `7e6b7795b`.
- **D-03:** **The ROADMAP Phase 7 entry is corrected before planning completes** with scoped Edits confined to the Phase 7 entry, bracketed by `roadmap validate` (P5 D-04 / P6 D-03 precedent — never Write the whole file). Stale: the 47 count and per-rule numbers, and the concentrations (`magic-textarea.tsx` is 6 now, not 10).
- **D-04:** **Adjacent harms on lines this phase already touches are in scope**, all from `7e6b7795b`: `vertical-page-layout.tsx` `aria-live="polite"` on the whole page content (remove it); `compact-note-content.tsx` "Show More" is a focusable `role="button"` with `tabIndex={0}` and no click handler (a fake control, see D-06); `loading-nostr-link.tsx` puts `role="listitem"` + `aria-pressed` on a toggle `Button` (see D-07). Explicitly rejected: flagged-findings only.
- **D-05:** **A wider accessibility audit is out of scope** (axe run, focus management, keyboard navigation across views) — recorded as a deferred idea.

**Remedy policy**

- **D-06:** **Landmark and structure roles on Chakra containers become the native element** via Chakra's `as` prop — `as="article"` / `"section"` (named region) / `"nav"` / `"main"` / `"footer"` / `"ul"` / `"li"` — and the `role` is dropped. Where `as` already provides it (`side-nav.tsx` has `as="nav"` and `role="navigation"`), the redundant role is simply deleted. `aria-label`s that name a landmark or region stay. Explicitly rejected: keeping roles behind ignores.
- **D-07:** **Clickable non-buttons become real `<button>`s** — `role="button"` on `relay-icon-stack.tsx` and the wallet card in `views/settings/wallet/index.tsx` switch to Chakra `as="button"` (native Enter/Space activation and focus) with a style reset so they look the same. Where the element is not actually interactive — "Show More" in `compact-note-content.tsx` has no handler — the role and `tabIndex` are removed instead. Explicitly rejected: keeping `role="button"` with hand-written `onKeyDown` handlers plus an ignore.
- **D-08:** **Wrong roles are deleted rather than "completed".** `role="heading"` on the article header `Box` that already wraps an `<h1>` is removed (adding `aria-level` would invent a second heading); `role="listitem"` + `aria-pressed` on the toggle `Button` in `loading-nostr-link.tsx` loses the listitem role (the button's pressed state is the real semantics). Where the role is a **correct ARIA pattern the linter dislikes** — `role="group"` + `aria-label` on a set of buttons (`side-nav.tsx:49`, `note-filter-type-buttons.tsx:12`), for which the suggested `fieldset` would wrongly imply a form — it stays behind a rule-scoped ignore whose reason says so. Explicitly rejected: satisfying each rule's literal prescription.
- **D-09:** **Missing accessible names:** the two iframes get a descriptive `title` (the music embed's provider in `content/links/music.tsx`, the webxdc app's name in `webxdc/webxdc.tsx`); the identicon `<img>` in `user/user-avatar.tsx` gets `alt=""` because it is decorative. Explicitly rejected: a descriptive alt on the identicon.

**Composite widgets**

- **D-10:** **`relay-url-input.tsx` drops its hand-added combobox ARIA** — `role="combobox"`, `aria-autocomplete`, `aria-expanded`, and the redundant `role="listbox"` / `role="option"` on the `<datalist>` / `<option>`s. A native `<input list>` + `<datalist>` already exposes combobox/listbox semantics. The existing `aria-describedby` status text stays. Explicitly rejected: a full custom ARIA combobox with its own listbox.
- **D-11:** **`magic-textarea.tsx` autocomplete items lose `role="option"`** on the inner `<span>`s (`:40,48,55`). react-textarea-autocomplete owns the surrounding `<ul>/<li>` markup; an option nested inside an `li` with no `listbox` parent is invalid ARIA. The emoji `<Image>`'s `alt` and the item `aria-label`s may stay or move as the planner finds correct. Explicitly rejected: wrapping/patching the library's list into a proper listbox with `aria-selected`.
- **D-12:** **The privacy `<datalist id="share-services">` options are a false positive** — a datalist option's value is its accessible name. Render the options from one array so the five findings collapse onto one line, and put a single rule-scoped `aislop-ignore-next-line jsx-a11y/control-has-associated-label` with a reason on it. Moving the service URLs into `src/const.ts` is **left to Phase 8** (hardcoded URLs). Explicitly rejected: adding a visible label per option.
- **D-13:** **Conversions keep current styling.** Chakra style props stay; converted buttons get `textAlign="start"`, `w="full"` and a reset where needed. Visual parity is part of the manual UAT (D-15). Explicitly rejected: accepting small visual drift.

**Verification & process**

- **D-14:** Verification is a **scoped rescan with a per-rule before/after table (43 → N)** plus an inventory of every surviving ignore with its reason. **`pnpm build` must pass after every task.**
- **D-15:** **No new test infrastructure** — no jsdom / Testing Library / axe. Instead a **manual UAT checklist**: Tab/Enter/Space on the converted buttons, landmarks visible in the browser accessibility tree, composer @-mention/emoji autocomplete still works, relay URL input suggestions still appear, pages are no longer announced via `aria-live`, and visual parity of every converted element. Explicitly rejected: adding vitest + jsdom + Testing Library + axe.
- **D-16:** **Waves run shared components first**: layout/nav (`side-nav`, `nav-drawer`, `vertical-page-layout`), `magic-textarea`, `relay-url-input`, `loading-nostr-link`, `compact-note-content`, `user-avatar`, `relay-icon-stack`, `note-filter-type-buttons`, `invoice-modal`, and the two iframes; then the views (`articles/*`, `settings/privacy`, `settings/wallet`, `thread`, `other-stuff/app-card`). Explicitly rejected: grouping by rule.
- **D-17:** **Mechanical role → `as` conversions land in their own commits**, separate from user-noticeable changes (the `aria-live` removal, button conversions, combobox ARIA removal) — P4 D-04 / P5 D-16 precedent. Explicitly rejected: one commit per file.

### Claude's Discretion

- The exact Chakra element/`as` value per container where more than one is defensible.
- The exact style reset used to keep converted buttons visually identical.
- The exact wording of every `-- reason` string, subject to the P4 D-08 justification bar.
- Plan-to-wave assignment within D-16's ordering.

### Deferred Ideas (OUT OF SCOPE)

- A full accessibility audit (axe-core run, focus management, keyboard navigation through every view).
- A proper ARIA listbox for react-textarea-autocomplete suggestions (aria-selected / active-descendant).
- Adding jsdom + Testing Library + axe for automated a11y regression tests.
</user_constraints>

<phase_requirements>
## Phase Requirements

No REQUIREMENTS.md exists and the roadmap lists `Requirements: TBD`. D-01..D-17 are the requirement set.

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01 | 43 findings fixed or rule-scoped ignored with reason | Probe: all 43 cleared with 1 ignore (3 if D-08 is honored literally) — see Probe Results |
| D-02 | Re-measure | Re-measured: 43 at HEAD `523acd591` (identical to `1479dc08a`), exact lines in Measured Baseline |
| D-03 | Correct ROADMAP Phase 7 entry | Exact corrected numbers in Measured Baseline (26/6/5/2/2/1/1; ROADMAP says 28/8/5/2/2/1/1) |
| D-04 | `aria-live` removal etc. | Grep: nothing depends on the page-level `aria-live`; see Q7 |
| D-06..D-09 | Remedy policy | Per-file verified edits in Conversion Table; two deviations/refinements flagged |
| D-10..D-13 | Composite widgets | Verified against a real Chromium AX tree |
| D-14, D-15 | Verification, no new infra | Validation Architecture section |
| D-16, D-17 | Waves, commit separation | Wave and Commit Plan section |
</phase_requirements>

## Summary

Every remedy class in CONTEXT/UI-SPEC was applied to a scratch worktree and measured: with the planned edits **all 43 `jsx-a11y/*` findings clear**, leaving exactly **one** rule-scoped ignore (the privacy datalist option, D-12). `tsc --noEmit` is clean, `pnpm build` passes (~30 s), `pnpm test` (29 tests) passes, repo score stays 86, and a diff of per-file/per-rule diagnostics shows **only** the 43 a11y findings changed (604 → 561 total); nothing new appears anywhere else. `[VERIFIED: scratch worktree, aislop 0.16.1 + tsc + vite build]`

Three findings change how the planner should write tasks. (1) Chakra's `ButtonGroup` already renders `role="group"` internally, so the two `role="group"` attributes that D-08 keeps behind ignores (`side-nav.tsx`, `note-filter-type-buttons.tsx`) are **redundant and can simply be deleted** with a byte-identical DOM and zero ignores; the ignore form also works if the user insists (placement verified). (2) Real-browser probing showed the wallet card (`role="button"` without a tabIndex) and `relay-icon-stack` (`role="button" tabIndex={0}` with no key handler) are currently **not keyboard-operable at all**; the `as="button"` conversions fix real defects, not just lint. (3) The UI-SPEC wallet snippet needs two corrections to type-check and look right: Chakra 2 has no `font` style prop (`TS2322`), and the focus ring should add `outline: "none"` to avoid a double ring.

**Primary recommendation:** Apply the UI-SPEC conversion table as written (all verified to type-check, render pixel-identical bounding boxes, and emit no React DOM-nesting warnings), with the corrections in "Verified deviations" below; use `// aislop-ignore-next-line` between JSX attributes / after `return (`, and `{/* ... */}` only for JSX-child position.

## Measured Baseline (D-02 re-measure)

`pnpm exec aislop scan --json .` at HEAD `523acd591` (only docs commits after `1479dc08a`): **43** bucket-F findings, `[VERIFIED: aislop scan]`. Rule split matches CONTEXT: 26 / 6 / 5 / 2 / 2 / 1 / 1. Total diagnostics 604 (540 warning, 48 error, 16 info); score 86.

| File | Lines (rule) |
|---|---|
| `components/compact-note-content.tsx` | 47 (article), 52 (button) |
| `components/content/links/music.tsx` | 132 (iframe-has-title) |
| `components/invoice-modal.tsx` | 112 (region) |
| `components/layout/desktop/side-nav.tsx` | 23 (navigation, redundant with `as="nav"`), 49 (group) |
| `components/layout/mobile/nav-drawer.tsx` | 35 (navigation) |
| `components/loading-nostr-link.tsx` | 85 (list), 96 (listitem), 97 (aria-pressed on listitem), 195 (region) |
| `components/magic-textarea.tsx` | 40, 48, 55 (each: prefer-tag option + required aria-selected) |
| `components/note-filter-type-buttons.tsx` | 12 (group) |
| `components/relay-icon-stack.tsx` | 30 (button) |
| `components/relay-url-input.tsx` | 89 (combobox prefer-tag + missing aria-controls), 105 (redundant listbox), 107 (redundant option + required aria-selected) |
| `components/user/user-avatar.tsx` | 23 (alt-text) |
| `components/vertical-page-layout.tsx` | 9 (main) |
| `components/webxdc/webxdc.tsx` | 292 (iframe-has-title; **a `{...iframeProps}` spread does not satisfy the rule**) |
| `views/articles/article.tsx` | 40 (main), 42 (heading + missing aria-level), 52 (contentinfo), 86 (article) |
| `views/articles/components/article-card.tsx` | 37 (article) |
| `views/articles/components/article-tags.tsx` | 6 (list), 10 (listitem) |
| `views/other-stuff/component/app-card.tsx` | 30 (article) |
| `views/settings/privacy/index.tsx` | 210 (`<datalist>`), 211-214 (4 `<option>`s) |
| `views/settings/wallet/index.tsx` | 48 (button) |
| `views/thread/index.tsx` | 47 (article) |

**D-03 corrected ROADMAP text** (Phase 7 entry only): `43 jsx-a11y findings ... 26 × prefer-tag-over-role, 6 × role-has-required-aria-props, 5 × control-has-associated-label, 2 × no-redundant-roles, 2 × iframe-has-title, 1 × alt-text, 1 × role-supports-aria-props`; concentrations: `magic-textarea.tsx` (6), `relay-url-input.tsx` (5), `views/settings/privacy/index.tsx` (5), `views/articles/article.tsx` (5), `components/loading-nostr-link.tsx` (4). The ROADMAP currently says 47 / 28 / 8 / magic-textarea 10. Edit only that entry, bracketed by `roadmap validate`.

## Architectural Responsibility Map

All work is in the Browser / Client tier (React components). No API, SSR, CDN or database tier is involved.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Landmark / structure semantics (`main`, `nav`, `article`, `ul/li`) | Browser / Client (JSX) | — | Rendered DOM element choice via Chakra `as` |
| Keyboard activation of clickable cards | Browser / Client | — | Native `<button>` provides Enter/Space/focus |
| Datalist / autocomplete suggestions | Browser (native `<datalist>`) | Library (react-textarea-autocomplete markup) | Browser owns combobox semantics for `<input list>`; library owns its `ul/li` |
| Accessible names for iframes/images | Browser / Client | — | `title` / `alt` attributes |

## Standard Stack

No new dependencies (D-15). Everything already in the repo:

| Library | Version | Purpose |
|---------|---------|---------|
| `@chakra-ui/react` | 2.10.10 `[VERIFIED: node_modules/.pnpm]` | `as` polymorphism, `LinkBox`, `ButtonGroup`, `_focusVisible` |
| `react` / `react-dom` | 19.2.8 `[VERIFIED: node_modules/.pnpm]` (with `@types/react` 18.3.31) | dev-mode DOM-nesting warnings |
| `aislop` | 0.16.1 (pinned, devDependency) | the measuring instrument; oxlint 1.82.0 underneath |
| `@webscopeio/react-textarea-autocomplete` | 4.9.2 | composer autocomplete (markup inspected) |

**Package Legitimacy Audit:** not applicable — this phase installs no external packages. (Research probes used `playwright-core` installed under the session scratchpad, outside the repo; it is not a project dependency and must not be added.)

## Architecture Patterns

### Component / change flow

```
role="..." attribute on Chakra component
   |
   +-- structural/landmark role (article, main, nav, section, footer, ul, li) ----> as="<tag>", drop role      (mechanical commit)
   +-- clickable role="button" with real handler (wallet, relay-icon-stack) -----> as="button" type="button" + reset + _focusVisible (behavior commit)
   +-- role with no handler/semantics (Show More, heading, listitem on Button) --> delete role/tabIndex          (behavior commit)
   +-- redundant with component default (ButtonGroup role="group") --------------> delete role                    (mechanical commit)
   +-- native widget wrongly overridden (datalist/option/combobox) --------------> delete roles/aria-*           (behavior commit)
   +-- missing name (iframe title, img alt) -------------------------------------> add title / alt=""           (names commit)
   +-- true false positive (datalist option value is the name) ------------------> one rule-scoped ignore        (ignore commit)
```

### Pattern 1: where a rule-scoped ignore must sit `[VERIFIED: negative-control scans]`

All three placements suppress the finding (each was removed again and the finding returned, so the suppression is real, not a rule that stopped firing). The directive must be on the line immediately before the flagged **line** (the diagnostic is reported on the line of the offending attribute or opening tag):

```tsx
// 1. Between JSX attributes of a multi-line opening tag: plain // comment, directly above the role line
<ButtonGroup
  variant="ghost"
  // aislop-ignore-next-line jsx-a11y/prefer-tag-over-role -- group + label on related buttons is the ARIA pattern; fieldset implies a form
  role="group"
  aria-label="Navigation controls"
>

// 2. Opening tag directly after `return (` : plain // comment inside the parentheses
return (
  // aislop-ignore-next-line jsx-a11y/prefer-tag-over-role -- <same reason>
  <ButtonGroup variant="outline" role="group" aria-label="Note filter controls" {...props}>

// 3. Child position inside JSX: JSX comment form
{/* aislop-ignore-next-line jsx-a11y/prefer-tag-over-role -- <reason> */}
<Box ... role="article" ...>

// 4. Inside a .map callback's parenthesised JSX: plain // comment (this is the D-12 placement)
{SHARE_SERVICES.map((url) => (
  // aislop-ignore-next-line jsx-a11y/control-has-associated-label -- a datalist option's value is its accessible name
  <option key={url} value={url} />
))}
```

`prefer-tag-over-role` reports on the **attribute line** when the tag spans lines (`side-nav.tsx` 23/49, `relay-url-input.tsx` 89) and on the tag line when single-line. Always put the directive directly above whichever line a re-scan reports.

### Pattern 2: native `<button>` reset set `[VERIFIED: type-check + Chromium render]`

```tsx
<Flex
  as="button"
  type="button"            // type-checks: Chakra 2.10 MergeWithAs exposes <button> props when as="button"
  /* keep existing layout props */
  textAlign="start"        // wallet only
  color="inherit"          // reset does NOT set color:inherit; without it text goes ButtonText (black in dark mode)
  lineHeight="inherit"     // reset sets 1.15
  bg="transparent"         // already transparent via reset; harmless, explicit
  _focusVisible={{ outline: "none", boxShadow: "outline" }}
/>
```

Do **not** use `font="inherit"`: Chakra 2 has no `font` style prop (`TS2322: Property 'font' does not exist`). The CSS reset already sets `font-family: inherit; font-size: 100%` on `button`, so `lineHeight="inherit"` is the only typography reset needed. `[VERIFIED: tsc; UI-SPEC reset facts]`

### Anti-Patterns to Avoid

- **Adding `role="list"` back to `Box as="ul"`** to defend Safari/VoiceOver (which drops list semantics for `list-style: none`): the linter sees `Box role="list"` and flags it again. Accept the Safari caveat (low impact; recorded in Pitfalls).
- **`Card as="button"`** on the wallet card (nested interactive, see Q6).
- **Satisfying `role-has-required-aria-props` by adding `aria-selected`/`aria-level`/`aria-controls`** — D-08/D-10/D-11 explicitly delete the role.

## Probe Results (answers to the 10 open questions)

### Q1. Remedy classes against aislop 0.16.1 + tsc

| Remedy | Type-checks | Clears finding | Notes |
|---|---|---|---|
| `Box as="article"` (`compact-note-content`), `as="section"` on `ModalBody` / `Box`, `as="footer"`, `as="article"` on `Box`, `Flex as="main"`, `DrawerBody as="nav"` | yes | yes | |
| `Box as="ul" listStyleType="none"` + `Link as="li" display="inline" listStyleType="none"`; `Flex as="ul"` + `Box as="li"` | yes | yes | AX tree reports `list "Article tags"`, `list "Available relays"` with listitems |
| `Flex as="button" type="button"` | yes | yes | `type` prop accepted under `as="button"` |
| `LinkBox as="article"` (article-card, app-card, thread) | yes | yes | `variant="ghost"` on `LinkBox` still compiles |
| Delete redundant `role="navigation"` (side-nav) | yes | yes | |
| `role="group"` ignores | n/a | yes, all 3 placements | see Pattern 1 |
| **Delete `role="group"` on `ButtonGroup`** | yes | yes | Chakra's `ButtonGroup` renders `chakra.div` with `role: "group"` and spreads `...rest` after it (`button-group.mjs:56`), so the explicit attr is redundant. DOM is identical. `[VERIFIED: node_modules source + rescan]` |

**Recommendation on D-08 (needs a conscious call by planner/user):** D-08 says the `group` roles "stay behind a rule-scoped ignore". Because `ButtonGroup` supplies `role="group"` itself, deleting the explicit attribute preserves exactly the semantics D-08 wants (group + `aria-label`) and removes two ignores. Default plan: **delete the attribute**, record the reason in the plan, and keep the aria-label. If the user wants D-08 literally, use Pattern 1 forms 1 and 2 (verified). Either way the total is 0 reported. Ignore inventory is then 1 (privacy) or 3.

### Q2. Count/locations: re-measured at HEAD — 43, table above.

### Q3. D-12 privacy datalist `[VERIFIED]`

Rendering `SHARE_SERVICES.map(...)` collapses 5 → **1** finding. The `<datalist>` line itself stops being flagged once its children are a JSX expression (the rule treats an expression child as a possible label); only the mapped self-closing `<option key value />` remains (reported on its own line). One `//` directive immediately above it clears it (Pattern 1 form 4). No `ai-slop/hardcoded-url` finding exists on those lines before or after, so there is no Phase 8 interplay to manage; leave `SHARE_SERVICES` as a module-level `const` array in `privacy/index.tsx` (Phase 8 can move it to `src/const.ts`).

**Zero-ignore alternative (not locked, mention to user):** `<option key={url} value={url}>{url}</option>` also clears the rule (text child), the same pattern already used in `relay-url-input.tsx`. Because text equals value, Chromium shows a single entry; D-12 rejected "a visible label per option" so the locked answer is the single ignore. Present as an option only if the user wants zero ignores. `[ASSUMED: dropdown rendering of option text equal to value is unchanged in Firefox/Safari]`

### Q4. D-10 relay-url-input `[VERIFIED]`

Removing `role="combobox"`, `aria-autocomplete`, `aria-expanded` from the `Input`, `role="listbox"` + `aria-label` from `<datalist>`, and `role="option"` + `aria-label` from `<option>` clears **all 5** (89 ×2, 105, 107 ×2). The `list="relay-suggestions"` attribute stays; in Chromium's accessibility tree the input is still `combobox "Relay URL"` with `autocomplete=list`, and now exposes no (mis-driven) `expanded` state. The datalist popup itself is browser UI (not in the DOM/AX tree) so "suggestions still appear" stays a manual UAT item. Keep `aria-label="Relay URL"`, `aria-describedby`, `aria-invalid`, `aria-busy`, and the `srOnly` status `Text` as UI-SPEC says.

### Q5. D-11 react-textarea-autocomplete markup `[VERIFIED: real library 4.9.2 rendered in Chromium]`

Rendered structure: `div > textarea` plus a list container `div > ul > li > div[role="button" tabindex="0"] > <ItemComponent>`. **The library itself puts `role="button" tabindex="0"` on a wrapper `div` inside each `li`**, so the item's `<span role="option">` was an option nested in a button (invalid twice over). Removing `role="option"` from the three spans clears 6 findings (3 prefer-tag + 3 required-aria-props); the AX tree then names each library button from the span's `aria-label` ("User: aa"), so keeping the item `aria-label`s is useful (recommend **keep** them and the emoji `Image alt`). Nothing in the library reads `role="option"` (it uses its own `role=button` wrapper and class names). Mouse/keyboard selection is library-internal and unchanged by attribute removal; confirm in UAT.

Adjacent observation, **not a finding, do not change in this phase**: `createAutocompleteProps` hardcodes `role: "combobox"`, `aria-autocomplete: "list"`, `aria-expanded: "false"` onto the textarea/input via a spread, so the AX tree reports a permanently collapsed combobox. aislop does not flag it (spread). Out of D-11's stated scope; note for the deferred ARIA-listbox item.

### Q6. UI-SPEC deviations sanity check `[VERIFIED: tsc + Chromium 1243, React 19.2 dev build, side-by-side old/new fixtures]`

Bounding boxes were measured old vs new for each; React console output contained **no** `validateDOMNesting` or any other warnings (only React-Router future-flag notices from the harness).

| Deviation | Type-check | Finding cleared | Layout old vs new | DOM nesting / notes |
|---|---|---|---|---|
| Wallet: `Card` (no role/onClick) > `CardBody as={Flex} p="0" alignItems="stretch"` > `Flex as="button"` (select area, `p="3"`) + sibling Remove `IconButton alignSelf="center" mr="3"`; name/balance as `Text as="span"` | yes (after dropping `font`) | yes | Card 468 × 73 both with and without Remove; text and Remove button x/y identical | No nesting. Old card was **not focusable** (`role=button` w/o tabIndex); new: Enter and Space both fire `onClick`; Tab goes select → Remove; Remove click does not select; clicking padding corner selects; focus-visible only on keyboard. `e.stopPropagation()` in Remove `onClick` is now unnecessary — pass `onClick={onRemove}`. |
| `relay-icon-stack` `Flex as="button" type="button"` + `bg="transparent" p="0"` + inset `_focusVisible` outline | yes | yes | 72 × 24 both, also `direction="row-reverse"` caller | **Old: Enter/Space did nothing (aria-expanded stayed false). New: Space, Enter and click all open the popover** (`PopoverTrigger` clones `onClick`/`aria-expanded`/`aria-controls` onto the button). Inset ring renders (2px solid `primary.500`, offset −2px, not clipped). No ring on mouse click. |
| `nav-drawer`: `DrawerContent` role removed, `DrawerBody as="nav" aria-label="Main navigation"` | yes | yes | n/a | **Old AX tree: `navigation` only (no dialog — the explicit role replaced Chakra's `role="dialog"`). New: `dialog` + `navigation "Main navigation"`.** The dialog's accessible name is empty in both: `aria-label="Main navigation menu"` is set on `<Drawer>`, which does not forward it to the dialog element. Optional (Claude's discretion, user-noticeable): move that aria-label to `DrawerContent`. |
| `loading-nostr-link`: `Flex as="ul" listStyleType="none"` + `Box as="li"` wrapping each toggle `Button` (keeps `aria-pressed`, loses role) | yes | yes | list 468 × 120 both; no bullets; AX: `list "Available relays"`, buttons expose `pressed` | No nesting |
| `article-card`: `LinkBox as="article"` | yes | yes | 300 × 66 both; `HoverLinkOverlay` `::before` is `position:absolute 0/0`, 298 × 64 inside a `position:relative` article in both | AX `article "Title"` (named by `aria-labelledby`) |
| `app-card`: `LinkBox as="article" display="flex"` | yes | yes | 400 × 74 both; overlay geometry identical; `display: flex` confirmed | Matches the checker resolution; `LinkBox` keeps `position: relative` |
| `article-tags`: `Box as="ul"` / `Link as="li" display="inline"` | yes | yes | 235.7 × 32 both inside the `Flex gap="2"` row; tags inline, no bullets | |
| compact-note "Show More" as plain bold `Text as="span" ml="4"` | yes | yes | visually identical | no longer a focus stop |

Safe to confirm in UAT only: dark mode, `(max-width: 768px)`, real `Avatar`/`RelayFavicon` children inside the stack, and the real `NavDrawer` with account hooks.

### Q7. D-04 `VerticalPageLayout` `[VERIFIED: grep + AX]`

`grep -rn "aria-live\|aria-atomic" src` finds only three other uses, all unrelated and scoped: `views/signin/connect/index.tsx:61`, `components/version-button.tsx:26`, `components/loading-nostr-link.tsx:72`. Nothing depends on the page-level region. Minimal change: `<Flex ... as="main" {...props}>` with `role="main"` and `aria-live="polite"` removed; the real component renders AX `main "Article Content"` when a caller passes `aria-label`. `views/articles/article.tsx` must drop its own `role="main"` prop (otherwise a second `main` role is forced onto the same element — the prop spreads onto the same `Flex`).

Leave the **outer** `Box` (`tabIndex={0}`, `aria-label="Main content"`) unchanged: `tabIndex={0}` on the `overflow: auto` container is what lets keyboard users scroll; `aria-label` on a role-less `div` is ignored by most AT (a generic element cannot be named) and is not flagged by the linter. Adding `role="region"` would re-trigger `prefer-tag-over-role`; making it `as="section"` would nest a region around `main`. UI-SPEC says untouched and D-05 defers focus/keyboard auditing — keep it, and record the dead `aria-label` as a deferred observation.

### Q8. D-09 iframe titles `[VERIFIED: rescan]`

- **music.tsx (SoundCloud, line 132):** add `title="SoundCloud player"` as the first prop of the plain `<iframe>`. Sibling embeds use literal titles ("Spotify Embed", "Wavlake Embed", ...). Note `renderSongDotLinkUrl` (line ~115) is a `Box as="iframe"` with no title; the linter does not see through `as`, so it is not a finding. Optional adjacent one-liner: `title="Song.link embed"`. Other untitled `Box as="iframe"` sites exist (`blossom/server/tabs/homepage.tsx:7`, `relays/relay/tabs/homepage.tsx:13`, `napplets/napplet-frame.tsx:285`, `content/links/code.tsx:13,37`) — out of scope, same reason.
- **webxdc (line 292):** `WebxdcProps` extends `IframeHTMLAttributes`, so `title` is already a valid prop that currently flows through `...iframeProps`, but the linter needs a visible attribute. Verified edit: destructure with a default in `Webxdc` — `function Webxdc({ id, xdc, webxdc, title = "Webxdc app", ...iframeProps }, ref)` — and render `<iframe ref={iframeRef} src={`${origin}/`} title={title} {...iframeProps} />`. Thread the name: `WebxdcIframe` gets a required `title: string` prop passed to `<Webxdc title={title} .../>`, and `WebxdcPlayer` passes `title={getWebxdcName(event)}` (existing helper in `helpers/nostr/webxdc.ts`; strips the "Webxdc app: " prefix; falls back to filename then "Webxdc App"). `WebxdcPlayer` has two callers (`views/webxdc/app.tsx:104`, `components/content/links/webxdc.tsx:50`), both already pass `event`, so no caller changes. `tsc` clean.

### Q9. Mechanical vs user-noticeable, and waves — see Wave and Commit Plan.

### Q10. Validation — see Validation Architecture.

## Verified deviations from UI-SPEC / CONTEXT (planner must carry these)

1. **Delete `role="group"` on `ButtonGroup`** instead of an ignore (D-08 refinement; DOM identical). See Q1.
2. **Wallet select button: no `font="inherit"`** (invalid prop in Chakra 2); add `outline: "none"` to `_focusVisible` so the UA outline and the `boxShadow` ring do not double up (a screenshot of the keyboard-focused probe showed both). Also drop `e.stopPropagation()` from Remove (no clickable ancestor remains).
3. **Optional drawer name:** move `aria-label="Main navigation menu"` from `<Drawer>` to `<DrawerContent>` so the (now real) dialog is named. Discretionary; not required by any finding.
4. **Nested `article`:** `article.tsx:86` becomes `Box as="article"` inside the page's own `<article>`. This mirrors what `role="article"` on the `section` did; if the planner prefers fewer nested articles, plain `as="section"` with no role (unnamed → no landmark) also clears the finding. UI-SPEC and D-06 say `as="article"`; keep unless the user objects.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard activation of a clickable card | `onKeyDown` + `role="button"` + `tabIndex` + ignore | Chakra `as="button"` | Native Enter/Space/focus; D-07 |
| Datalist combobox semantics | custom ARIA combobox/listbox | native `<input list>` + `<datalist>` | Browser maps it to combobox/listbox; D-10 |
| Page landmarks | `role="main"/"navigation"/"contentinfo"` | `as="main"/"nav"/"footer"` | native elements, D-06 |
| Group of related buttons | `role="group"` attribute | `ButtonGroup` default `role="group"` | already emitted by Chakra |
| Visual focus ring on the new buttons | custom `box-shadow` values | `_focusVisible={{ boxShadow: "outline" }}` (inset outline for the clipped stack) | matches Chakra `Button` |

## Runtime State Inventory

Not a rename/refactor/migration phase (JSX attribute/element changes only). Omitted per template.

## Common Pitfalls

### Pitfall 1: `font` prop does not exist in Chakra 2
**What goes wrong:** the UI-SPEC reset set includes `font="inherit"`; `tsc` fails with TS2322 on `Flex as="button"`.
**How to avoid:** use `lineHeight="inherit"` only; reset already supplies font-family/size.
**Warning signs:** `Property 'font' does not exist on type ... MergeWithAs`.

### Pitfall 2: Double focus ring on the wallet button
**What goes wrong:** `_focusVisible={{ boxShadow: "outline" }}` alone leaves the UA default outline on top.
**How to avoid:** add `outline: "none"` (Chakra's own `Button` base style does the same).

### Pitfall 3: Ignore directive in the wrong spot
**What goes wrong:** directive above the opening tag but the diagnostic is on an attribute line two lines down, so the finding survives.
**How to avoid:** rescan, read the reported `line`, put the directive on the line directly above it (Pattern 1). Negative-control by removing it.

### Pitfall 4: `as` is invisible to the linter in the other direction
**What goes wrong:** `Box as="iframe"` / `Flex as="button"` never produce `iframe-has-title` / `no-static-element-interactions` findings, so accessible-name regressions on converted elements are not caught by rescan.
**How to avoid:** converted buttons keep their `aria-label`; UAT checks names in the browser AX tree.

### Pitfall 5: `ul`/`li` defaults
**What goes wrong:** `li` defaults to `display: list-item`; the reset does not remove list-style.
**How to avoid:** `listStyleType="none"` on every `ul`/`li`; `display="inline"` on tag `li`s (verified identical width/height). **Safari/VoiceOver** drops list semantics for `list-style: none` lists; accepted, cannot be mitigated by `role="list"` without re-triggering the rule. `[ASSUMED: current WebKit behavior]`

### Pitfall 6: Touching `music.tsx` inherits an error-severity finding
**What goes wrong:** `components/content/links/music.tsx:110` has `react-hooks/rules-of-hooks` (error, `useColorMode` after an early `return null`; backlog 999.2). AGENTS.md: `lint:ci` fails on any error-severity finding in a touched file. D-09 requires editing this file.
**How to avoid / decision:** work lands on `next`, whose pushes are not gated (AGENTS "Linting"), so this only bites if a PR branch is cut. Planner should not fix it here (999.2 owns it; D-04 limits adjacent fixes to `7e6b7795b` lines). Note it in the plan so the executor does not "fix" it silently; if a gated PR is ever cut, a rule-scoped ignore with reason is the only in-scope option. `[VERIFIED: scan-head diagnostics, AGENTS.md]`

### Pitfall 7: Other pre-existing findings in touched files
Touched files carry warnings only (no other errors): `react/refs` in `compact-note-content.tsx:49`, `magic-textarea.tsx`, `webxdc-player.tsx:152`; `exhaustive-deps` in `magic-textarea`, `user-avatar`, `relay-url-input`; `narrative-comment` ×10 and one `hardcoded-url` in `webxdc.tsx` / `webxdc-player.tsx`. Per CLAUDE.md do not sweep them; the scratch probe confirmed none move.

## Code Examples

Verified edits (applied in the scratch worktree; `tsc` clean, rescan 0).

```tsx
// vertical-page-layout.tsx
<Flex direction="column" pt="2" pb="12" gap="2" px="2" w="full" as="main" {...props}>

// nav-drawer.tsx — role removed from DrawerContent, nav landmark on the body
<DrawerContent>
  <CollapsedContext.Provider value={false}>
    <DrawerBody as="nav" aria-label="Main navigation" display="flex" flexDirection="column" ...>

// relay-icon-stack.tsx
<Flex
  as="button"
  type="button"
  alignItems="center"
  gap="-4"
  overflow="hidden"
  cursor="pointer"
  bg="transparent"
  p="0"
  _focusVisible={{ outline: "2px solid", outlineColor: "primary.500", outlineOffset: "-2px" }}
  aria-label="View relay information"
  {...props}
>

// wallet/index.tsx WalletCard (corrected)
<Card variant="outline" borderColor={active ? "primary.500" : undefined}>
  <CardBody as={Flex} p="0" alignItems="stretch">
    <Flex
      as="button" type="button" direction="column" gap="0.5" overflow="hidden" flex={1} alignSelf="stretch"
      p="3" textAlign="start" color="inherit" lineHeight="inherit" bg="transparent" rounded="inherit" cursor="pointer"
      _focusVisible={{ outline: "none", boxShadow: "outline" }}
      onClick={() => setActiveWallet(wallet.id)} aria-pressed={active} aria-label={`Use ${wallet.name}`}
    >
      <Text as="span" fontWeight="bold" isTruncated>{wallet.name}</Text>
      <Text as="span" fontSize="sm" color="GrayText">{balance === undefined ? "—" : balance.toLocaleString()} sats</Text>
    </Flex>
    {onRemove && (
      <IconButton size="sm" variant="ghost" colorScheme="red" alignSelf="center" mr="3"
        aria-label={`Remove ${wallet.name}`} icon={<TrashIcon />} onClick={onRemove} />
    )}
  </CardBody>
</Card>

// loading-nostr-link.tsx
<Flex as="ul" listStyleType="none" direction="column" aria-label="Available relays">
  {filtered.map((relay) => (
    <Box as="li" key={relay} listStyleType="none">
      <Button variant="outline" w="full" p="2" ... aria-pressed={relays.has(relay)}>{relay}</Button>
    </Box>
  ))}
</Flex>
// section: <Box id="nostr-link-details" ... as="section" aria-label="Link details">

// article.tsx
<VerticalPageLayout pt={{ base: "2", lg: "8" }} pb="32" aria-label="Article Content">   // role="main" removed
<Box as="header" mx="auto" maxW="4xl" w="full" mb="2">                                     // role="heading" removed
<Box py="2" as="footer">                                                               // was as="div" role="contentinfo"
<Box mx="auto" maxW="4xl" w="full" mb="8" as="article" mt="4">                             // was as="section" role="article"

// article-tags.tsx
<Box as="ul" listStyleType="none" aria-label="Article tags" {...props}>
  <Link ... flexShrink={0} as="li" display="inline" listStyleType="none" mr="2">

// article-card.tsx: <Box ref as={LinkBox} ... role="article"> becomes
<LinkBox ref={ref} as="article" position="relative" variant="ghost" overflow="hidden" aria-labelledby=... {...props}>   // closing tag </LinkBox>

// app-card.tsx: <Flex as={LinkBox} ... role="article"> becomes
<LinkBox as="article" display="flex" gap="4" alignItems="flex-start" aria-labelledby=...>                              // closing tag </LinkBox>

// thread/index.tsx: <LinkBox ... role="article"> becomes <LinkBox as="article" ...>

// user-avatar.tsx
<img src={`data:image/svg+xml;base64,${identicon}`} alt="" width="100%" style={...} />

// relay-url-input.tsx (after)
<Input ref={ref} list="relay-suggestions" type="url" aria-label="Relay URL" aria-describedby="relay-suggestions-description"
  aria-invalid={error ? "true" : undefined} aria-busy={loading} {...props} onBlur={handleBlur} onKeyDown={handleKeyDown} />
<datalist id="relay-suggestions"> {relaySuggestions.map((url) => <option key={url} value={url}>{url}</option>)} </datalist>

// magic-textarea.tsx: delete role="option" on the 3 spans (keep aria-label and style); prettier may collapse the multi-line <span>

// privacy/index.tsx
const SHARE_SERVICES = ["https://njump.me/", "https://nostr.com/", "https://nostr.at/", "https://nostr.eu/"];
<datalist id="share-services">
  {SHARE_SERVICES.map((url) => (
    // aislop-ignore-next-line jsx-a11y/control-has-associated-label -- a datalist option's value is its accessible name; a visible label would change the suggestion dropdown
    <option key={url} value={url} />
  ))}
</datalist>
```

`compact-note-content.tsx`: `<Box as="article" whiteSpace="pre-wrap" aria-label="Note content" {...props}>` and `<Text as="span" fontWeight="bold" ml="4">Show More</Text>` (role, tabIndex, aria-label removed).

## Wave and Commit Plan (D-16 / D-17)

Edits within a wave touch disjoint files, so plans in the same wave can run in parallel. Suggested split:

| Wave | Plan | Files | Contents |
|------|------|-------|----------|
| 1 | A: layout/nav + simple shared | `vertical-page-layout`, `side-nav`, `nav-drawer`, `note-filter-type-buttons`, `invoice-modal` | |
| 1 | B: composites | `magic-textarea`, `relay-url-input` | |
| 1 | C: shared cards/controls | `loading-nostr-link`, `compact-note-content`, `user-avatar`, `relay-icon-stack`, `content/links/music.tsx`, `webxdc/webxdc.tsx` + `views/webxdc/components/webxdc-player.tsx` | |
| 2 | D: views | `articles/article.tsx`, `article-tags`, `article-card`, `thread/index`, `other-stuff/app-card`, `settings/privacy`, `settings/wallet` | `article.tsx` depends on A (the `role="main"` prop removal is only correct once `VerticalPageLayout` renders `main`) |
| 3 | E: close-out | ROADMAP Phase 7 entry (D-03), final rescan table + ignore inventory, UAT checklist file | |

Commit separation inside each plan (D-17):

| Commit class | Edits |
|---|---|
| **Mechanical role → `as` / redundant delete** | `side-nav` (delete `role="navigation"`, delete `role="group"`), `note-filter-type-buttons` (delete `role="group"`), `invoice-modal` (`as="section"`), `loading-nostr-link` section only, `compact-note-content` `as="article"`, `article.tsx` (main prop removal, footer, article), `article-tags`, `article-card`, `thread`, `app-card`, `vertical-page-layout` `as="main"` |
| **User-noticeable / behavior** | `aria-live` removal; `relay-icon-stack` and wallet `as="button"` conversions; "Show More" role/tabIndex removal; `nav-drawer` (restores dialog role + nav landmark); `loading-nostr-link` `ul/li` wrapper + `role="listitem"` removal; `relay-url-input` combobox ARIA removal; `magic-textarea` `role="option"` removal; `article.tsx` `role="heading"` removal |
| **Accessible names + ignore** | `music.tsx` title, `webxdc` title threading, `user-avatar` `alt=""`, privacy datalist array + single ignore |

(The names commit is AT-visible too but additive; keeping it separate makes revert easy.) If the planner treats `vertical-page-layout` `as="main"` and the `aria-live` removal as one hunk, split them into the two commit classes or note the exception; `as="main"` alone is mechanical.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.1, `environment: "node"`, `include: ["src/**/*.test.ts"]` (4 files, 29 tests — none cover components) plus `tsc` and `aislop` as the real verifiers |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm exec tsc --noEmit -p tsconfig.json && pnpm test` (~27 s: tsc 25 s, vitest <1 s) |
| Full suite command | `pnpm build && pnpm test` plus the bucket-F rescan (build ~30 s) |

No new test infrastructure (D-15). `nyquist_validation` is absent from `.planning/config.json` (treated as enabled); `ui_safety_gate: false`.

### Bucket-F rescan (D-14)

```bash
pnpm exec aislop scan --json . > "$TMPDIR/scan.json"   # ~12 s; exits non-zero by design, read the JSON
node -e 'const d=require(process.argv[1]);const c={};let n=0;for(const x of d.diagnostics)if(x.rule.startsWith("jsx-a11y/")&&x.filePath.startsWith("src/")){c[x.rule]=(c[x.rule]||0)+1;n++}console.log(n,c,d.score)' "$TMPDIR/scan.json"
```

Expected after the phase: `0 {} 86`. Baseline `43 { prefer-tag-over-role: 26, role-has-required-aria-props: 6, control-has-associated-label: 5, no-redundant-roles: 2, iframe-has-title: 2, alt-text: 1, role-supports-aria-props: 1 }`.

### Per-rule before/after (probe result, to be reproduced by execution)

| Rule | Before | After reported | Mechanism |
|------|--------|----------------|-----------|
| prefer-tag-over-role | 26 | 0 | 19 `as=` / deletions, 2 `as="button"`, 3 option/combobox role deletions, 2 group deletions (or 2 ignores under literal D-08) |
| role-has-required-aria-props | 6 | 0 | role deletions (magic-textarea ×3, relay-url-input ×2, article heading) |
| control-has-associated-label | 5 | 0 | 4 options + datalist collapsed to 1 line, 1 ignore |
| no-redundant-roles | 2 | 0 | datalist/option role deletions |
| iframe-has-title | 2 | 0 | titles |
| alt-text | 1 | 0 | `alt=""` |
| role-supports-aria-props | 1 | 0 | `role="listitem"` removal |
| **Total** | **43** | **0 reported + 1 ignore** (3 if D-08 literal) | |

Surviving ignore inventory to record in the verification doc: `views/settings/privacy/index.tsx` (`control-has-associated-label`, option value is its accessible name). Expect diagnostic total 604 → 561 and no other (file, rule) count to change; diff `diagnostics[]` by `(filePath, rule)` before/after to prove it.

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | File Exists? |
|-----|----------|-----------|-------------------|-------------|
| D-01/D-14 | bucket F 43 → 0 + inventory | scan | rescan above | n/a |
| D-06..D-13 | types still valid after `as=` / props | static | `pnpm exec tsc --noEmit -p tsconfig.json` | yes |
| D-14 | build per task | build | `pnpm build` | yes |
| D-15 | semantics, keyboard, parity | manual UAT | checklist below | create `07-UAT.md` |

### Sampling Rate
- **Per task commit:** `pnpm exec tsc --noEmit -p tsconfig.json && pnpm test`, plus a rescan of the touched file set when quick; **`pnpm build` must pass after every task** (D-14) — it already runs `tsc`, so `pnpm build` alone suffices as the per-task gate (~30 s).
- **Per wave merge:** `pnpm build && pnpm test` + full rescan.
- **Phase gate:** rescan = 0 reported, ignore inventory matches, UAT signed.

### Wave 0 Gaps
None — existing tooling covers everything; no test files to create.

### Manual UAT checklist (D-15; from UI-SPEC parity list plus probe findings)

- Tab reaches the wallet select button, Enter and Space select the wallet, Tab then reaches Remove, Remove does not select; clicking anywhere on the card except Remove selects.
- `RelayIconStack`: Tab focus shows the inset ring (not clipped); Enter and Space and click open the popover (this was broken before); `row-reverse` order unchanged on the user notes tab.
- Compact note "Show More" looks identical, is not a Tab stop, is not announced as a button.
- Browser accessibility tree (DevTools): exactly one `main` per page; article page `main "Article Content"`; `article`, `footer` inside article, `list "Article tags"`, `list "Available relays"` (buttons report pressed), `region "Link details"`, `region "Payment options"`; mobile drawer shows a `dialog` containing `navigation "Main navigation"`; desktop `nav "Main navigation"`.
- Pages no longer announce content changes (screen reader on a `VerticalPageLayout` view, e.g. timeline refresh).
- Composer: type `@ali` and `:smi` — suggestions appear, arrow/Enter and click both insert; items show avatar/name/emoji as before.
- Relay URL input (settings relays / add relay): typing shows datalist suggestions; Enter and blur normalize `wss://`.
- Privacy "Share service" input shows the same four suggestions.
- iframe titles via the AX tree: SoundCloud embed, webxdc player (app name).
- Visual parity (light/dark, mobile/desktop): wallet cards, relay icon stack, article page, tags row, article card / thread parent / app card (overlay still covers whole card), loading-nostr-link filter list, drawer, side nav, invoice modal.

## Security Domain

`security_enforcement` is absent from config (treated as enabled). This phase changes DOM semantics only; no input handling, auth, crypto or network surface changes.

| ASVS Category | Applies | Control |
|---------------|---------|---------|
| V2 Authentication / V3 Session / V4 Access Control / V6 Crypto | no | — |
| V5 Input Validation | no change | `RelayUrlInput` normalization logic untouched; only ARIA attributes removed |

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Iframe embed sandbox/allow attributes | Tampering / Elevation | untouched; only `title` added (`webxdc` `allow` and the `sandbox` on song.link stay) |
| `type="button"` on converted buttons | Tampering (accidental form submit) | every converted button sets `type="button"`; none live inside a `<form>` |

## State of the Art

| Old | Current | Impact |
|-----|---------|--------|
| `role="..."` on `div` containers (commit `7e6b7795b`) | native elements via Chakra `as` | linter `prefer-tag-over-role` satisfied, same AX tree |
| `aria-live` on page container | none | no spurious announcements |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `<option value={url}>{url}</option>` renders the same single entry in Firefox/Safari datalist dropdowns (only Chromium reasoning; not tested) | Q3 | Only matters if the user chooses the zero-ignore alternative |
| A2 | Safari/VoiceOver drops list semantics for `list-style: none` `ul` | Pitfall 5 | Minor AT regression on article tags / relay list in Safari; cannot be avoided under the rule |
| A3 | Dark mode / mobile widths / real Avatar and Favicon children keep the same geometry (probed light mode, 700 px, simplified children) | Q6 | Caught by UAT parity checklist |

All other claims were verified by tool in this session.

## Open Questions

1. **D-08 `role="group"`: delete (recommended) or keep behind ignores?**
   - Known: `ButtonGroup` emits `role="group"` itself; deleting is DOM-identical and verified clean.
   - Unclear: whether the user wants the literal D-08 ignore form.
   - Recommendation: delete; record as a D-08 refinement in the plan; fall back to Pattern 1 forms 1/2 on objection.
2. **Name the mobile drawer dialog (move `aria-label` to `DrawerContent`)?** Discretionary, small, user-noticeable for AT; recommend yes in the same behavior commit as the nav change, or defer.
3. **Nested `<article>` in `article.tsx` (`as="article"` vs unnamed `as="section"`)?** Recommend following D-06 (`as="article"`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | all | yes | v26.9.0 | — |
| pnpm | install/build/scan | yes | 11.2.2 | — |
| aislop (devDependency) | rescan | yes | 0.16.1 | — |
| tsc / vite build / vitest | per-task verification | yes | build ~30 s, tsc ~25 s | — |
| Chromium | manual UAT only | yes (`/usr/bin/google-chrome`, `chromium-browser`, Playwright caches) | — | any browser |

No missing dependencies. Scratch worktree used for probes was removed (`git worktree remove --force` + `prune`); the main checkout was not modified (`git status` shows only the pre-existing untracked `.claude/worktrees/`).

## Sources

### Primary (HIGH confidence)
- Scratch-worktree measurements (this session): `pnpm exec aislop scan --json .` before/after, `tsc --noEmit`, `pnpm build`, `pnpm test`, Chromium 1243 accessibility tree and bounding-box probes with React 19.2 dev warnings.
- `node_modules/@chakra-ui/react/dist/esm/button/button-group.mjs` (role="group" default), `modal/use-modal.mjs` (`role: "dialog"` default), `link/link-box.mjs`.
- `@webscopeio/react-textarea-autocomplete` 4.9.2 rendered markup.
- Repo: `AGENTS.md` (Linting, Inline ignores), `.aislop/config.yml`, `07-CONTEXT.md`, `07-UI-SPEC.md`, prior phase `06-VALIDATION.md` format.

### Secondary / Tertiary
- None; no external web sources were needed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; versions read from the installed tree.
- Architecture / remedies: HIGH — applied and measured end to end.
- Pitfalls: HIGH for tool-verified items; A2 is MEDIUM (training knowledge).

**Research date:** 2026-10-06
**Valid until:** 30 days, or until aislop is upgraded from 0.16.1 (rule behavior can shift on upgrade)
