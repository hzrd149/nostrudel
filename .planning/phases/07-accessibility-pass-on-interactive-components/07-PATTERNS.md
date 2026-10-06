# Phase 7: Accessibility pass on interactive components - Pattern Map

**Mapped:** 2026-10-06
**Files analyzed:** 27 (all `src/`-relative, under `/home/robert/Projects/noStrudel/src`)
**Analogs found:** 27 / 27 (most edits are in-place attribute changes; the file's own code is the base, with analogs for the new element patterns)

Note: this phase creates no new source files. The only new artifact is `07-UAT.md` (manual checklist, see RESEARCH "Manual UAT checklist"), which has no code analog; copy the checklist from RESEARCH.md lines 491-502.
The authoritative edit text per file is in 07-RESEARCH.md "Code Examples" (lines 322-415). This map adds the in-repo analogs and the current-line excerpts to be replaced.

## File Classification

| Modified file | Role | Data flow | Closest analog | Match |
|---|---|---|---|---|
| `components/vertical-page-layout.tsx` | layout component | request-response (render) | itself + `components/layout/desktop/side-nav.tsx` (`Flex as="nav"`) | exact |
| `components/layout/desktop/side-nav.tsx` | layout component | render | itself (delete redundant role) | exact |
| `components/layout/mobile/nav-drawer.tsx` | layout component | render | `side-nav.tsx` (`as="nav"` + `aria-label`) | role-match |
| `components/note-filter-type-buttons.tsx` | component | render | `side-nav.tsx:49` `ButtonGroup` | exact |
| `components/invoice-modal.tsx` | component | render | `views/articles/article.tsx:109` (`as="section"` + `aria-label`) | exact |
| `components/magic-textarea.tsx` | component | event-driven | itself (delete `role="option"`) | exact |
| `components/relay-url-input.tsx` | component | event-driven | itself (delete combobox ARIA) | exact |
| `components/loading-nostr-link.tsx` | component | render | `article.tsx:109` for `as="section"`; RESEARCH for `ul/li` | role-match |
| `components/compact-note-content.tsx` | component | render | `article.tsx:109` | role-match |
| `components/user/user-avatar.tsx` | component | render | none needed (`alt=""`) | exact |
| `components/relay-icon-stack.tsx` | component | event-driven | `views/signin/native.tsx:29` (`Card as="button"`) | role-match |
| `components/content/links/music.tsx` | component | render | sibling iframes in same file ("Spotify Embed") | exact |
| `components/webxdc/webxdc.tsx` + `views/webxdc/components/webxdc-player.tsx` | component | render | `helpers/nostr/webxdc.ts` `getWebxdcName` | exact |
| `views/articles/article.tsx` | view | render | itself | exact |
| `views/articles/components/article-tags.tsx` | component | render | RESEARCH `ul/li` | no in-repo analog |
| `views/articles/components/article-card.tsx` | component | render | `views/thread/index.tsx:38` (`<LinkBox`) | exact |
| `views/thread/index.tsx` | view | render | `article-card.tsx` | exact |
| `views/other-stuff/component/app-card.tsx` | component | render | `views/notifications/replies/components/reply-card.tsx:40` (`Flex as={LinkBox}`) | exact |
| `views/settings/privacy/index.tsx` | view | render | `services/verify-event.ts:32` + `database/index.ts:28` (ignore wording) | role-match |
| `views/settings/wallet/index.tsx` | view | event-driven | `views/signin/native.tsx:29` | role-match |

## Pattern Assignments

### Rule-scoped ignore (privacy datalist, the only expected ignore)

**Analogs:** `services/database/index.ts:28`, `services/verify-event.ts:32`
```ts
// aislop-ignore-next-line ai-slop/double-type-assertion -- an upgrade transaction runs against ...
```
Format: `aislop-ignore-next-line <rule> -- <long-form reason>`. Inside JSX use form 4 of RESEARCH Pattern 1 (a plain `//` comment inside the `.map` callback's parenthesised JSX, directly above `<option>`).

### `views/settings/privacy/index.tsx` (current lines 210-215)
```tsx
<datalist id="share-services">
  <option value="https://njump.me/" />
  ...4 options
</datalist>
```
Replace with module-level `const SHARE_SERVICES = [...]` plus `.map` and the single ignore (RESEARCH lines 405-412). Do not move the URLs into `src/const.ts` (Phase 8).

### `components/vertical-page-layout.tsx` (lines 9-11)
Current:
```tsx
<Flex direction="column" pt="2" pb="12" gap="2" px="2" w="full" role="main" aria-live="polite" {...props}>
```
Target: `... w="full" as="main" {...props}>`. Analog for `as` on a landmark `Flex`: `side-nav.tsx:20-23` (`<Flex as="nav" aria-label="Main navigation" ...>`). Leave the outer `Box tabIndex={0} aria-label="Main content"` untouched. Commit split: `as="main"` is mechanical, `aria-live` removal is behavior. `views/articles/article.tsx` must drop its own `role="main"` after this lands (wave dependency).

### `components/layout/desktop/side-nav.tsx` (lines 20-24, 47-53)
Delete `role="navigation"` (line 23; `as="nav"` already present) and `role="group"` on the `ButtonGroup` (line 49). Keep `aria-label="Navigation controls"` (D-18, no ignore).

### `components/note-filter-type-buttons.tsx` (line 12)
Current: `<ButtonGroup variant="outline" role="group" aria-label="Note filter controls" {...props}>`. Delete `role="group"` only (D-18).

### `components/layout/mobile/nav-drawer.tsx` (lines 36-47)
Remove the role from `DrawerContent`, add `as="nav" aria-label="Main navigation"` to `DrawerBody` (existing props `display="flex" flexDirection="column" px="4" ...` stay). D-19: move the `<Drawer>` `aria-label="Main navigation menu"` onto `DrawerContent`.

### `components/invoice-modal.tsx` (:112) and `components/loading-nostr-link.tsx` (:195)
**Analog:** `views/articles/article.tsx:109`
```tsx
<Flex mx="auto" maxW="4xl" w="full" gap="2" direction="column" as="section" aria-label="Comments section">
```
Apply: replace `role="region"` with `as="section"`, keep the `aria-label`.

### `components/loading-nostr-link.tsx` (:85 list, :96 listitem + aria-pressed)
No in-repo `ul/li` analog (the repo has no `as="ul"`/`as="li"`). Use RESEARCH lines 367-375: `Flex as="ul" listStyleType="none" direction="column" aria-label=...` wrapping `Box as="li" key listStyleType="none"` around the toggle `Button` (keeps `aria-pressed`, loses `role="listitem"`).

### `components/compact-note-content.tsx` (:47, :52)
`Box as="article" whiteSpace="pre-wrap" aria-label="Note content" {...props}`; "Show More" becomes `<Text as="span" fontWeight="bold" ml="4">Show More</Text>` (delete role, tabIndex, aria-label).

### `components/relay-icon-stack.tsx` (lines 30-39) and `views/settings/wallet/index.tsx` (lines 34-50)
**Analog for `as="button"` on Chakra containers:** `views/signin/native.tsx:29-37`
```tsx
<Card
  as="button"
  variant="outline"
  onClick={connect}
  cursor="pointer"
  textAlign="left"
  w="full"
  ...
```
and `views/signup/components/profile-image-step.tsx:40` (`<Avatar as="button" ...>`). Both are existing repo precedent for `as="button"`.
Differences to apply (RESEARCH Pattern 2 and the corrected wallet snippet at lines 348-365): add `type="button"`, `bg="transparent"`, `color="inherit"`, `lineHeight="inherit"`, `_focusVisible`; no `font` prop (TS2322 in Chakra 2). Relay stack: inset `_focusVisible={{ outline: "2px solid", outlineColor: "primary.500", outlineOffset: "-2px" }}`; keep `aria-label`; it sits inside `PopoverTrigger`, which clones `onClick`. Wallet: do NOT use `Card as="button"` (signin/native.tsx does this, but the wallet card contains a nested Remove `IconButton`, so nested interactive); instead `Card > CardBody as={Flex} p="0" alignItems="stretch"` with the select `Flex as="button"` and a sibling Remove `IconButton onClick={onRemove}` (drop `stopPropagation`). Current wallet card (to be replaced): `<Card ... cursor="pointer" onClick={() => setActiveWallet(wallet.id)} role="button" aria-pressed={active} aria-label={`Use ${wallet.name}`}>`.

### `components/magic-textarea.tsx` (:40, :48, :55) and `components/relay-url-input.tsx` (:89, :105, :107)
In-place deletions only (D-10, D-11): remove `role="option"` (keep `aria-label`, emoji `alt`); remove `role="combobox" aria-autocomplete aria-expanded` on the Input, `role="listbox"` + `aria-label` on `<datalist id="relay-suggestions">`, `role="option"` + `aria-label` on options. Keep `list=`, `aria-label="Relay URL"`, `aria-describedby`, `aria-invalid`, `aria-busy`. Existing precedent for text-child options is already in this file. Target text: RESEARCH lines 398-401.

### Cards: `views/articles/components/article-card.tsx` (:37), `views/other-stuff/component/app-card.tsx` (:30), `views/thread/index.tsx` (:47)
**Analogs:** `views/thread/index.tsx:38` (already a bare `<LinkBox`), `reply-card.tsx:40` (`<Flex as={LinkBox} ...>`).
- thread: change `role="article"` to `as="article"` on the existing `LinkBox`.
- article-card: `<Box ref as={LinkBox} ... role="article">` becomes `<LinkBox ref as="article" position="relative" variant="ghost" overflow="hidden" aria-labelledby=...>` (close tag `</LinkBox>`; import `LinkBox`, drop unused `Box`).
- app-card: current `<Flex as={LinkBox} gap="4" alignItems="flex-start" role="article" aria-labelledby=...>` becomes `<LinkBox as="article" display="flex" gap="4" alignItems="flex-start" aria-labelledby=...>` (close `</LinkBox>`; keep `HoverLinkOverlay`).

### `views/articles/article.tsx` (:40, :42, :52, :86)
Current lines to change:
```tsx
<Box as="header" mx="auto" maxW="4xl" w="full" mb="2" role="heading">        // :42 delete role
<Box mx="auto" maxW="4xl" w="full" mb="8" as="section" role="article" mt="4">  // :86 -> as="article", delete role
```
`:40` drop `role="main"` prop on `VerticalPageLayout`; `:52` `Box py="2" as="div" role="contentinfo"` becomes `as="footer"`. Keep `Box as="header"` inside the article (D-20).

### `views/articles/components/article-tags.tsx` (lines 6, 10)
Current:
```tsx
<Box aria-label="Article tags" role="list" {...props}>
  <Link key=... color="blue.500" whiteSpace="pre" flexShrink={0} role="listitem" mr="2">
```
Target: `<Box as="ul" listStyleType="none" aria-label="Article tags" {...props}>` and `<Link ... as="li" display="inline" listStyleType="none" mr="2">`. No role="list" re-add (re-triggers rule).

### `components/user/user-avatar.tsx` (:23)
Add `alt=""` to the identicon `<img>`.

### `components/content/links/music.tsx` (:132) and `components/webxdc/webxdc.tsx` (:292)
music: add `title="SoundCloud player"` to the plain `<iframe>` (siblings already use literal titles such as "Spotify Embed", "Wavlake Embed"). webxdc: `title = "Webxdc app"` default in `Webxdc` destructure, `title={title}` before `{...iframeProps}`, thread a required `title` through `WebxdcIframe`, pass `getWebxdcName(event)` from `WebxdcPlayer` (RESEARCH Q8, lines 262-263). Do not fix the pre-existing `rules-of-hooks` error in music.tsx (backlog 999.2).

## Shared Patterns

### Chakra `as=` polymorphism (D-06)
**Sources:** `side-nav.tsx:20-23` (`Flex as="nav"`), `article.tsx:42` (`Box as="header"`), `article.tsx:109` (`Flex as="section" aria-label`), `reply-card.tsx:40` (`Flex as={LinkBox}`). **Apply to:** every role-to-tag conversion. Drop `role`, keep `aria-label` / `aria-labelledby`. The linter does not see through `as`.

### `as="button"` (D-07)
**Sources:** `views/signin/native.tsx:29-37`, `views/signup/components/profile-image-step.tsx:40`. **Apply to:** relay-icon-stack, wallet card. Always add `type="button"`.

### Rule-scoped ignore with reason (D-12)
**Sources:** `services/database/index.ts:28`, `services/verify-event.ts:32` (`// aislop-ignore-next-line <rule> -- <reason>`). **Apply to:** only the privacy `<option>`. Directive goes on the line directly above the line the rescan reports.

### Redundant `ButtonGroup role="group"` (D-18)
Chakra `ButtonGroup` (`node_modules/@chakra-ui/react/dist/esm/button/button-group.mjs:56`) emits `role="group"` itself. **Apply to:** side-nav.tsx, note-filter-type-buttons.tsx (delete the attribute).

### Verification
Per task `pnpm build`; rescan with the RESEARCH lines 453-458 command (expect `0 {} 86`, 43 to 0 plus 1 ignore).

## No Analog Found

| File | Role | Data flow | Reason |
|---|---|---|---|
| `articles/components/article-tags.tsx`, `loading-nostr-link.tsx` (`ul/li`) | component | render | No `as="ul"` / `as="li"` anywhere in `src/`; use RESEARCH verified snippets |
| `07-UAT.md` | doc | n/a | No existing UAT file this phase; format from RESEARCH checklist (prior phase `06-VALIDATION.md` format) |

## Metadata

**Analog search scope:** `src/` (grep for `as="..."`, `aislop-ignore`, `ButtonGroup`, `LinkBox`)
**Pattern extraction date:** 2026-10-06
