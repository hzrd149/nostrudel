# Phase 7: Accessibility pass on interactive components - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Bucket F of the aislop scan — the `jsx-a11y/*` findings — is closed: custom roles that should be
plain tags become the native element, roles missing their required ARIA props are corrected (usually
by removing a wrong role), unlabelled controls get accessible names, and every remaining finding
carries a rule-scoped ignore with a reason. Shared components that every view inherits go first.

Not in this phase: a wider accessibility audit (axe run, focus management, keyboard navigation
across views), new test infrastructure, and consolidating hardcoded URLs (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Scope & completion

- **D-01:** Done means **every bucket-F finding in `src/` is either fixed or carries a rule-scoped
  `aislop-ignore-*` with a reason** — the P4 D-01 / P5 D-01 / P6 D-01 bar. Every rule is warning
  severity, so nothing here gates CI; this is a chosen bar. Explicitly rejected: fixing only the
  shared components, and a zero-ignore absolute.

- **D-02:** **The measured starting point is 43 findings** at `next` @ `1479dc08a` (repo score 86),
  not the ROADMAP's 47: 26 `prefer-tag-over-role`, 6 `role-has-required-aria-props`,
  5 `control-has-associated-label`, 2 `no-redundant-roles`, 2 `iframe-has-title`, 1 `alt-text`,
  1 `role-supports-aria-props`. Per P4 D-02 / P5 D-03 / P6 D-02 the planner re-measures.

  | File | Findings |
  |---|---|
  | `components/magic-textarea.tsx` | 6 (3 option roles, each prefer-tag + missing aria-selected) |
  | `components/relay-url-input.tsx` | 5 (combobox role, missing aria-controls, 2 redundant roles, option aria-selected) |
  | `views/settings/privacy/index.tsx` | 5 (`<datalist id="share-services">` options, `:210-214`) |
  | `views/articles/article.tsx` | 5 (main, heading + aria-level, contentinfo, article) |
  | `components/loading-nostr-link.tsx` | 4 (list, listitem, aria-pressed on listitem, region) |
  | `components/layout/desktop/side-nav.tsx` | 2 (navigation, group) |
  | `components/compact-note-content.tsx` | 2 (article, button) |
  | `views/articles/components/article-tags.tsx` | 2 (list, listitem) |
  | singles | `content/links/music.tsx:132` (iframe title), `invoice-modal.tsx:112` (region), `layout/mobile/nav-drawer.tsx:35` (navigation), `note-filter-type-buttons.tsx:12` (group), `relay-icon-stack.tsx:30` (button), `user/user-avatar.tsx:23` (alt), `vertical-page-layout.tsx:9` (main), `webxdc/webxdc.tsx:292` (iframe title), `articles/components/article-card.tsx:37` (article), `other-stuff/component/app-card.tsx:30` (article), `settings/wallet/index.tsx:48` (button), `thread/index.tsx:47` (article) |

  Most of these roles were added by one commit, `7e6b7795b` ("accessability improvements",
  2025-04-24, 12 shared components, +19 `role=` / +49 `aria-` lines).

- **D-03:** **The ROADMAP Phase 7 entry is corrected before planning completes** with scoped Edits
  confined to the Phase 7 entry, bracketed by `roadmap validate` (P5 D-04 / P6 D-03 precedent —
  never Write the whole file). Stale: the 47 count and per-rule numbers, and the concentrations
  (`magic-textarea.tsx` is 6 now, not 10).

- **D-04:** **Adjacent harms on lines this phase already touches are in scope**, all from
  `7e6b7795b`:
  - `components/vertical-page-layout.tsx` sets `aria-live="polite"` on the whole page content, so
    screen readers announce every content change on the ~20 views that use it — remove it.
  - `components/compact-note-content.tsx`'s "Show More" is a focusable `role="button"` with
    `tabIndex={0}` and no click handler — a fake control (see D-06).
  - `components/loading-nostr-link.tsx` puts `role="listitem"` + `aria-pressed` on a toggle
    `Button` (see D-07).
  Explicitly rejected: flagged-findings only.

- **D-05:** **A wider accessibility audit is out of scope** (axe run, focus management, keyboard
  navigation across views) — recorded as a deferred idea.

### Remedy policy

- **D-06:** **Landmark and structure roles on Chakra containers become the native element** via
  Chakra's `as` prop — `as="article"` / `"section"` (named region) / `"nav"` / `"main"` /
  `"footer"` / `"ul"` / `"li"` — and the `role` is dropped. Where `as` already provides it
  (`side-nav.tsx` has `as="nav"` and `role="navigation"`), the redundant role is simply deleted.
  `aria-label`s that name a landmark or region stay. Explicitly rejected: keeping roles behind
  ignores.

- **D-07:** **Clickable non-buttons become real `<button>`s** — `role="button"` on
  `relay-icon-stack.tsx` and the wallet card in `views/settings/wallet/index.tsx` switch to Chakra
  `as="button"` (native Enter/Space activation and focus) with a style reset so they look the same.
  Where the element is not actually interactive — "Show More" in `compact-note-content.tsx` has no
  handler — the role and `tabIndex` are removed instead. Explicitly rejected: keeping
  `role="button"` with hand-written `onKeyDown` handlers plus an ignore.

- **D-08:** **Wrong roles are deleted rather than "completed".** `role="heading"` on the article
  header `Box` that already wraps an `<h1>` is removed (adding `aria-level` would invent a second
  heading); `role="listitem"` + `aria-pressed` on the toggle `Button` in `loading-nostr-link.tsx`
  loses the listitem role (the button's pressed state is the real semantics). Where the role is a
  **correct ARIA pattern the linter dislikes** — `role="group"` + `aria-label` on a set of buttons
  (`side-nav.tsx:49`, `note-filter-type-buttons.tsx:12`), for which the suggested `fieldset` would
  wrongly imply a form — it stays behind a rule-scoped ignore whose reason says so. Explicitly
  rejected: satisfying each rule's literal prescription.

- **D-09:** **Missing accessible names:** the two iframes get a descriptive `title` (the music
  embed's provider in `content/links/music.tsx`, the webxdc app's name in `webxdc/webxdc.tsx`);
  the identicon `<img>` in `user/user-avatar.tsx` gets `alt=""` because it is decorative — the
  user's name is announced by the surrounding avatar/link. Explicitly rejected: a descriptive alt on
  the identicon.

### Composite widgets

- **D-10:** **`relay-url-input.tsx` drops its hand-added combobox ARIA** — `role="combobox"`,
  `aria-autocomplete`, `aria-expanded`, and the redundant `role="listbox"` / `role="option"` on the
  `<datalist>` / `<option>`s. A native `<input list>` + `<datalist>` already exposes
  combobox/listbox semantics; the partial override claims an `aria-expanded` state the browser does
  not drive and lacks `aria-controls`. The existing `aria-describedby` status text stays.
  Explicitly rejected: a full custom ARIA combobox with its own listbox.

- **D-11:** **`magic-textarea.tsx` autocomplete items lose `role="option"`** on the inner `<span>`s
  (`:40,48,55`). react-textarea-autocomplete owns the surrounding `<ul>/<li>` markup; an option
  nested inside an `li` with no `listbox` parent is invalid ARIA. The emoji `<Image>`'s `alt` and
  the item `aria-label`s may stay or move as the planner finds correct. Explicitly rejected:
  wrapping/patching the library's list into a proper listbox with `aria-selected`.

- **D-12:** **The privacy `<datalist id="share-services">` options are a false positive** — a
  datalist option's value is its accessible name. Render the options from one array so the five
  findings collapse onto one line, and put a single rule-scoped
  `aislop-ignore-next-line jsx-a11y/control-has-associated-label` with a reason on it. Moving the
  service URLs into `src/const.ts` is **left to Phase 8** (hardcoded URLs). Explicitly rejected:
  adding a visible label per option (changes what the suggestion dropdown shows).

- **D-13:** **Conversions keep current styling.** Chakra style props stay; converted buttons get
  `textAlign="start"`, `w="full"` and a reset where needed. Visual parity is part of the manual UAT
  (D-15). Explicitly rejected: accepting small visual drift.

### Verification & process

- **D-14:** Verification is a **scoped rescan with a per-rule before/after table (43 → N)** plus an
  inventory of every surviving ignore with its reason (P3 D-04 … P6 D-13). **`pnpm build` must pass
  after every task.**

- **D-15:** **No new test infrastructure** — there is no jsdom / Testing Library in the repo and
  adding them (plus axe) means new dependencies behind a legitimacy checkpoint (P2 D-14). Instead a
  **manual UAT checklist**: Tab/Enter/Space on the converted buttons, landmarks visible in the
  browser accessibility tree, composer @-mention/emoji autocomplete still works, relay URL input
  suggestions still appear, pages are no longer announced via `aria-live`, and visual parity of every
  converted element. Explicitly rejected: adding vitest + jsdom + Testing Library + axe.

- **D-16:** **Waves run shared components first**, as the ROADMAP goal says: layout/nav
  (`side-nav`, `nav-drawer`, `vertical-page-layout`), `magic-textarea`, `relay-url-input`,
  `loading-nostr-link`, `compact-note-content`, `user-avatar`, `relay-icon-stack`,
  `note-filter-type-buttons`, `invoice-modal`, and the two iframes; then the views (`articles/*`,
  `settings/privacy`, `settings/wallet`, `thread`, `other-stuff/app-card`). Explicitly rejected:
  grouping by rule.

- **D-17:** **Mechanical role → `as` conversions land in their own commits**, separate from
  user-noticeable changes (the `aria-live` removal, button conversions, combobox ARIA removal) —
  P4 D-04 / P5 D-16 precedent. Explicitly rejected: one commit per file.

### Claude's Discretion

- The exact Chakra element/`as` value per container where more than one is defensible.
- The exact style reset used to keep converted buttons visually identical.
- The exact wording of every `-- reason` string, subject to the P4 D-08 justification bar.
- Plan-to-wave assignment within D-16's ordering.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Chakra UI 2.10 `as` prop on `Box`/`Flex`/`Card`/`Text` renders any intrinsic element while keeping style props.
- Rule-scoped ignore precedent: `services/verify-event.ts:32`, `components/magic-textarea.tsx:201` (Phase 6).

### Established Patterns
- `VerticalPageLayout` (`components/vertical-page-layout.tsx`) wraps ~20 views; it is the only `main` landmark source (no `<main>` elsewhere in `src/`). `views/articles/article.tsx` passes `role="main"` into it again.
- `side-nav.tsx` already uses `as="nav"` with `aria-label="Main navigation"`.
- react-textarea-autocomplete renders its own `ul.rta__list > li.rta__item` markup around the item components.

### Integration Points
- `relay-url-input.tsx` is used wherever a relay URL is typed (settings, relay views).
- `compact-note-content.tsx` is rendered by notification cards (replies, quotes, …).
- `invoice-modal.tsx`, `loading-nostr-link.tsx`, `relay-icon-stack.tsx` are shared across many views.

</code_context>

<specifics>
## Specific Ideas

- Commit `7e6b7795b` is the origin of most of the bucket — reading its diff shows intent for each role.
- `privacy/index.tsx`'s share-service URLs overlap Phase 8's `ai-slop/hardcoded-url` work; only restructure the rendering here.

</specifics>

<deferred>
## Deferred Ideas

- A full accessibility audit (axe-core run, focus management, keyboard navigation through every view).
- A proper ARIA listbox for react-textarea-autocomplete suggestions (aria-selected / active-descendant).
- Adding jsdom + Testing Library + axe for automated a11y regression tests.

</deferred>
