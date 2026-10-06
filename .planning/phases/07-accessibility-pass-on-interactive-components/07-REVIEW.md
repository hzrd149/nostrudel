---
phase: 07-accessibility-pass-on-interactive-components
reviewed: 2026-10-06T21:37:57Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - src/components/compact-note-content.tsx
  - src/components/content/links/music.tsx
  - src/components/invoice-modal.tsx
  - src/components/layout/desktop/side-nav.tsx
  - src/components/layout/mobile/nav-drawer.tsx
  - src/components/loading-nostr-link.tsx
  - src/components/magic-textarea.tsx
  - src/components/note-filter-type-buttons.tsx
  - src/components/relay-icon-stack.tsx
  - src/components/relay-url-input.tsx
  - src/components/user/user-avatar.tsx
  - src/components/vertical-page-layout.tsx
  - src/components/webxdc/webxdc.tsx
  - src/views/articles/article.tsx
  - src/views/articles/components/article-card.tsx
  - src/views/articles/components/article-tags.tsx
  - src/views/other-stuff/component/app-card.tsx
  - src/views/settings/privacy/index.tsx
  - src/views/settings/wallet/index.tsx
  - src/views/thread/index.tsx
  - src/views/torrents/new.tsx
  - src/views/webxdc/components/webxdc-player.tsx
  - src/views/webxdc/new.tsx
findings:
  critical: 1
  warning: 3
  info: 4
  total: 8
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-10-06T21:37:57Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed `git diff e739dfddb..HEAD -- src` across all 23 files, checking each change against D-01..D-20 and the main risks the orchestrator listed. `tsc --project tsconfig.json --noEmit` passes.

These risk areas checked out clean:
- **Torrent and webxdc "new" forms.** The pages now nest `Flex as="form"`. Submission still works, and the Chakra `Button`s default to `type="button"`. The layout matches the old one: same gap, and the outer `main` still supplies the padding.
- **Wallet card.** The select `<button>` and the Remove `IconButton` are siblings, so no button sits inside another. Dropping `stopPropagation` is correct because `Card` no longer has an `onClick`.
- **`RelayIconStack` trigger.** The native `<button>` contains only Chakra `Avatar` spans, imgs and svgs, which are all phrasing content. `PopoverTrigger` click/Enter/Space now work natively.
- **`LinkBox as="article"` cards.** These render the same DOM as the old `Box/Flex as={LinkBox}` versions.
- **Element defaults.** The Chakra CSS reset zeroes `ul` margin/padding and button border, background, line-height and color, so the new elements match the old look.
- **Ignore count.** There is exactly one `aislop-ignore`, the privacy datalist one, as expected.

**Defects found:**
1. **Invalid HTML (Critical, CR-01).** The article page now puts a `<footer>` inside a `<header>`.
2. **Unfinished iframe pass (WR-02).** The song.link iframe in `music.tsx`, a file this phase touched, still has no title.
3. **Prohibited ARIA (WR-01).** The autocomplete spans in `magic-textarea` now carry `aria-label`s that ARIA forbids, because their role was removed.
4. **`VerticalPageLayout` footgun (WR-03).** Callers can still silently replace the new `main` landmark with their own `as`. This is the same bug class that forced the form restructuring in this phase.

## Critical Issues

### CR-01: `<footer>` nested inside `<header>` is invalid HTML

**File:** `src/views/articles/article.tsx:41-73` (footer at line 52)
**Issue:** The phase turned the byline `Box role="contentinfo"` into `Box as="footer"`, but that element lives inside `<Box as="header">` (line 41). The HTML content model for `header` is "flow content, but with no `header` or `footer` element descendants". So the article page now fails HTML validation, in a phase whose goal is correct native semantics. The research doc (07-RESEARCH.md:380) prescribed this mapping without checking the nesting rule, and D-06 lists `footer` only as an allowed mapping, not for this spot. In practice the accessibility tree is unaffected, because a footer scoped to an `<article>` maps to `generic`. The `role="contentinfo"` that was there before was also wrong inside an article. What breaks is markup validity: validators and axe's HTML checks flag it.
**Fix:** The byline is not a footer. Make it a plain container, or an `<address>` for the author info:
```tsx
<Box py="2">
  <UserAvatarLink ... />
  ...
</Box>
```
If a footer is really wanted, move it out of the `<header>`, for example after the article body inside the outer `<article>`.

## Warnings

### WR-01: `aria-label` on generic `<span>`s is now prohibited ARIA (autocomplete items)

**File:** `src/components/magic-textarea.tsx:40, 46, 49`
**Issue:** D-11 removed `role="option"` but kept `aria-label` on the bare `<span>`s. ARIA 1.2 forbids naming the `generic` role, so these labels are now invalid. Screen readers handle them inconsistently: most ignore them, but some (JAWS, and VoiceOver in some contexts) announce the label instead of the content. For person items that means a 64-character hex `User: <pubkey>` would replace the readable `UserName`. Before this phase the labels were at least valid on `role="option"`. This change made them invalid and gave them no job. D-11 leaves the labels to the planner's judgement; leaving them on generic spans is the one choice that is wrong.
**Fix:** Drop the `aria-label`s. The visible text (`name: char`, the `UserName`) and the emoji `<Image alt={name}>` already provide the content:
```tsx
<span style={{ background: "transparent" }}>{`${name}: ${char}`}</span>
...
<span style={{ background: "transparent" }}>
  <UserAvatar pubkey={entity.pubkey} size="xs" /> <UserName pubkey={entity.pubkey} />{" "}
  <UserDnsIdentity pubkey={entity.pubkey} onlyIcon />
</span>
```

### WR-02: song.link embed iframe in a touched file still has no accessible name

**File:** `src/components/content/links/music.tsx:114-123`
**Issue:** D-09 called for descriptive iframe titles, and this phase added one to the SoundCloud iframe (line 133). The `Box as="iframe"` in `renderSongDotLinkUrl` in the same file still has no `title`. The linter only matches literal `<iframe>` JSX, so it missed this one. Screen-reader users hear an unnamed frame, which is the exact defect D-09 targets, left in the file the phase edited for it.
**Fix:**
```tsx
<Box
  as="iframe"
  title="Song.link player"
  ...
/>
```

### WR-03: `VerticalPageLayout` lets callers silently override the `main` landmark

**File:** `src/components/vertical-page-layout.tsx:9`
**Issue:** `as="main"` comes before `{...props}`, and the component is typed `ComponentWithAs<"div", FlexProps>`. Any caller that passes `as` (as `torrents/new.tsx` and `webxdc/new.tsx` did with `as="form"` before this phase) replaces the `<main>` without any error, so the page loses its only main landmark. The phase worked around this by restructuring those two callers. The trap itself remains for the ~20 views (and `TimelinePage`, which forwards `{...props}`).
**Fix:** Pin the element so callers cannot override it, and stop advertising `as`:
```tsx
const VerticalPageLayout = ({ children, ...props }: Omit<FlexProps, "as">) => (
  <Box ...>
    <Flex direction="column" pt="2" pb="12" gap="2" px="2" w="full" {...props} as="main">
      {children}
    </Flex>
  </Box>
);
```

## Info

### IN-01: Safari/VoiceOver drops list semantics on the new `list-style: none` lists

**File:** `src/components/loading-nostr-link.tsx:85`, `src/views/articles/components/article-tags.tsx:6`
**Issue:** The old explicit `role="list"` survived WebKit's heuristic. The native `ul` with `listStyleType="none"` does not, so in Safari "Available relays" and "Article tags" are no longer announced as lists. This trade-off is documented and accepted (07-RESEARCH.md A2 / Pitfall 5). It is listed here so it is not forgotten at UAT.
**Fix:** None required under the current decisions. If it matters later, hide bullets with an `li::before { content: "\200B" }` trick, or put the role back with a scoped ignore.

### IN-02: `Link as="li"` keeps link styling on a non-interactive element; `li` `listStyleType` is redundant

**File:** `src/views/articles/components/article-tags.tsx:10-19`; `src/components/loading-nostr-link.tsx:87`
**Issue:** Chakra's `Link` theme applies `cursor: pointer`, a hover underline and a focus ring to what is now a plain `<li>` with no href or handler, so tags still look clickable. This was already true of the old `<a>` with no href, but the conversion was the moment to fix it. Separately, `list-style-type` is inherited, so `listStyleType="none"` on each `li` duplicates the value already set on the parent `ul`.
**Fix:** Use `<Text as="li" color="blue.500" display="inline" whiteSpace="pre" mr="2">`, and drop the per-`li` `listStyleType`.

### IN-03: Wallet card focus ring and click target differ from before (D-13 parity)

**File:** `src/views/settings/wallet/index.tsx:58, 77-78`
**Issue:** `rounded="inherit"` inherits from `CardBody`, which has no radius, so it resolves to `0`. The `boxShadow: "outline"` focus ring is therefore square inside a rounded card. Also, the whole card used to be clickable. Now the area around the trash button (the `mr="3"` gutter and the vertical padding beside it) does nothing.
**Fix:** Set `rounded="md"` (match the card radius), or give `CardBody` `rounded="inherit"` as well. Accept the smaller click target, or let the select button take the full height and width minus the icon.

### IN-04: `variant="ghost"` on `LinkBox` leaks to the DOM

**File:** `src/views/articles/components/article-card.tsx:31-35`
**Issue:** `LinkBox` is `chakra("div")`. Chakra's `shouldForwardProp` does not filter `variant`, so this renders `<article variant="ghost">`, an invalid attribute. The component is also still typed `Omit<CardProps, "children">`, so other Card-only props from callers leak the same way. This predates the phase, but the phase rewrote this element.
**Fix:** Remove `variant="ghost"` and type the props as `Omit<LinkBoxProps, "children">`.

---

_Reviewed: 2026-10-06T21:37:57Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
