---
phase: quick-261007-gka
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/timeline/highlight.tsx
  - .changeset/tidy-highlights-wrap.md
autonomous: true
requirements: [QUICK-261007-GKA-359]

estimate:
  tokens: 15000
  raw_tokens: 15000
  tasks: 1
  confidence: high

must_haves:
  truths:
    - A kind 9802 highlight whose highlighted text is longer than one line wraps onto as many lines as it needs inside its context paragraph, and no part of the highlighted text is clipped at the right edge of the card (GitHub issue hzrd149/nostrudel#359).
    - Each wrapped line fragment of the highlighted span keeps the purple background, horizontal padding and rounded corners, rather than one long box broken across lines with square, unpadded ends.
    - A single unbreakable token inside the highlighted text, such as a long URL, breaks onto the next line instead of overflowing the card.
    - Short highlights that fit on one line render the same as before (same background, padding, radius, italic, body text color).
    - The fix applies both to timeline highlight cards (TimelineHighlight) and to highlights embedded in other notes (EmbeddedHighlight), because both render the shared HighlightContent.
    - The surrounding context text keeps its current whitespace behavior (newlines collapse as normal flowing text); no line clamping, context trimming or overflow changes are introduced.
    - The project typecheck passes.
  artifacts:
    - path: src/components/timeline/highlight.tsx
      provides: "HIGHLIGHT_STYLES overriding Chakra Mark's default no-wrap so the highlighted span wraps, with per-fragment decoration and long-word breaking"
      contains: "boxDecorationBreak"
    - path: .changeset/tidy-highlights-wrap.md
      provides: "patch changeset describing the highlight wrapping fix for #359"
      contains: "\"nostrudel\": patch"
  key_links:
    - from: HIGHLIGHT_STYLES (src/components/timeline/highlight.tsx)
      to: Chakra Mark (node_modules/@chakra-ui/react/dist/esm/highlight/mark.mjs)
      via: "Highlight passes its styles prop to each Mark as sx; Mark puts its own whiteSpace default in __css, and sx takes precedence over __css, so a whiteSpace key in HIGHLIGHT_STYLES overrides the default"
      pattern: "whiteSpace: \"normal\""
    - from: EmbeddedHighlight (src/components/embed-event/card/embedded-highlight.tsx)
      to: HighlightContent (src/components/timeline/highlight.tsx)
      via: "EmbeddedHighlight imports and renders HighlightContent, which uses HIGHLIGHT_STYLES, so it inherits the fix with no change of its own"
      pattern: "HighlightContent"
---

<objective>
Fix GitHub issue #359 ("Highlight from a long post was truncated"): make the highlighted span inside a highlight's context paragraph wrap across lines so the full highlighted text stays visible, instead of rendering as one unbroken line that runs off the right edge of the card and gets clipped.

Purpose: The reporter's screenshot shows the purple highlighted span cut off mid-sentence ("...so their PRs would not be reviewed until the paid |"). The cause is confirmed: `HighlightContent` renders Chakra's `Highlight`, which wraps each match in Chakra's `Mark`. `Mark` sets a no-wrap white-space in its base `__css`, so the matched span can never break. The wrapper `Box position="relative" overflow="hidden"` in `HighlightContent` (and `CardBody overflow="hidden"` in `TimelineHighlight`) then clips everything past the card edge. `Highlight` forwards its `styles` prop to each `Mark` as `sx`, and `sx` overrides `__css`, so adding the right keys to the existing `HIGHLIGHT_STYLES` object fixes it at the source, for every place that renders `HighlightContent`.

Output: An updated `HIGHLIGHT_STYLES` in `src/components/timeline/highlight.tsx` and a patch changeset.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@AGENTS.md
@src/components/timeline/highlight.tsx

Supporting facts already established by the planner (do not re-derive):

- Chakra UI version is 2.10.10. `Highlight` (node_modules/@chakra-ui/react/dist/esm/highlight/highlight.mjs) renders each matched chunk as a `Mark` with `sx: styles`. `Mark` (node_modules/@chakra-ui/react/dist/esm/highlight/mark.mjs) renders a Box `as="mark"` whose `__css` is a transparent background plus a no-wrap white-space, followed by the theme's Mark style config. `sx` wins over `__css`.
- `HighlightProps["styles"]` is typed as Chakra's `SystemStyleObject`. `boxDecorationBreak` is a registered Chakra style prop (node_modules/@chakra-ui/styled-system/dist/esm/config/layout.mjs), and emotion's stylis prefixer adds the `-webkit-` prefix for `box-decoration-break` automatically, so Safari needs nothing extra.
- `HIGHLIGHT_STYLES` and Chakra's `Highlight` component are used only in `src/components/timeline/highlight.tsx`. `HighlightContent` is also rendered by `src/components/embed-event/card/embedded-highlight.tsx`, which needs no change.
- The text around the match in the `Box pl="3" color="GrayText"` wrapper uses the browser default white-space (newlines collapse). The fix uses `normal` to match it, not `pre-wrap`.
- Vitest only collects `src/**/*.test.ts` in a node environment (vitest.config.ts), so there is no component-render test harness. This is a styling-only change, so it has no TDD task. Verification is the typecheck plus content checks.
- Prior quick tasks in this repo ship a `"nostrudel": patch` changeset for user-visible fixes (for example `.changeset/brave-napplets-share.md`).
</context>

<tasks>

<task type="auto">
  <name>Task 1: Let the highlighted span wrap inside the context paragraph, and add a patch changeset</name>
  <files>src/components/timeline/highlight.tsx, .changeset/tidy-highlights-wrap.md</files>
  <action>
In `src/components/timeline/highlight.tsx`, extend the existing module-level `HIGHLIGHT_STYLES` object (currently `px`, `bg`, `borderRadius`, `color`, `fontStyle`). Keep all five existing keys and their values unchanged. Add three keys:

1. `whiteSpace: "normal"`. This overrides the no-wrap default that Chakra's `Mark` sets in its `__css`, so the highlighted span wraps like the surrounding context text. Use `normal`, not `pre-wrap`, so the highlight collapses whitespace the same way as the context text around it, which is rendered as plain flowing text in the parent Box.
2. `boxDecorationBreak: "clone"`. With this, each wrapped line fragment of the inline `mark` gets its own background, `px` padding and `borderRadius`. Without it, the padding and rounding appear only at the very start and end of a multi-line span.
3. `overflowWrap: "break-word"`. This lets one long unbreakable token inside the highlighted text, such as a URL, break onto the next line. Without it, a span that can now wrap could still be clipped by the `overflow="hidden"` ancestors. This key is the planner's choice under the issue's requirement that the highlighted text stays fully visible.

Put a short one-line comment directly above the new keys explaining why: Chakra's `Mark` does not wrap by default, so long highlights would overflow and be clipped by the card. Do not add narrative or changelog-style comments (aislop flags those).

Do not change anything else in the file. Do not touch the `Box position="relative" overflow="hidden"` wrapper, the purple left-bar Box, the `pl="3" color="GrayText"` Box, the `CardBody overflow="hidden"` in `TimelineHighlight`, or the `context ? ... : ...` branching. Do not add line clamping, context trimming, or a "show more" control. Today the context is not clamped, so wrapping alone makes the full highlight visible. Do not edit `src/components/embed-event/card/embedded-highlight.tsx`; it inherits the fix through `HighlightContent`.

Create `.changeset/tidy-highlights-wrap.md` in the repo's changeset format: a front-matter block containing `"nostrudel": patch`, then one sentence of body text, for example: Long highlights wrap inside their post context instead of being cut off at the edge of the card (#359).

Run `pnpm exec prettier -w src/components/timeline/highlight.tsx .changeset/tidy-highlights-wrap.md` so formatting matches the repo. If the aislop PostToolUse hook reports a finding on a line this task introduced, fix it. Leave pre-existing findings in the file alone, per `.claude/CLAUDE.md`.

Commit the two files atomically with a conventional message such as `fix(quick-261007-gka): wrap long highlights instead of clipping them (#359)`.
  </action>
  <verify>
    <automated>cd /home/robert/Projects/noStrudel && grep -c 'whiteSpace: "normal"' src/components/timeline/highlight.tsx | grep -qx 1 && grep -c 'boxDecorationBreak: "clone"' src/components/timeline/highlight.tsx | grep -qx 1 && grep -c 'overflowWrap: "break-word"' src/components/timeline/highlight.tsx | grep -qx 1 && grep -c 'bg: "#815ad580"' src/components/timeline/highlight.tsx | grep -qx 1 && grep -q '"nostrudel": patch' .changeset/tidy-highlights-wrap.md && git diff --quiet HEAD -- src/components/embed-event/card/embedded-highlight.tsx && pnpm exec tsc --project tsconfig.json</automated>
  </verify>
  <done>
- `HIGHLIGHT_STYLES` contains the original five keys, unchanged, plus `whiteSpace: "normal"`, `boxDecorationBreak: "clone"` and `overflowWrap: "break-word"`, with one short why-comment above them.
- No other line of `src/components/timeline/highlight.tsx` changed (check with `git diff`). `embedded-highlight.tsx` is untouched.
- `.changeset/tidy-highlights-wrap.md` exists with a `"nostrudel": patch` front-matter entry and a one-sentence description that references #359.
- `pnpm exec tsc --project tsconfig.json` exits 0.
- Both files are committed in one commit.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| relay → client render | Highlight text and context come from untrusted kind 9802 Nostr events and are rendered as React text children of Chakra `Highlight` |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261007-gka-01 | Tampering | HighlightContent rendering of untrusted highlight/context strings | low | accept | Unchanged by this plan. The strings are still passed as plain string children to Chakra `Highlight`, which splits them into text chunks rendered by React, so they are escaped. No raw HTML injection is introduced. The change only adds static CSS keys to a constant style object. |
| T-261007-gka-02 | Denial of Service | Layout of very long highlight text | low | accept | Wrapping replaces horizontal overflow with vertical growth inside an existing card. The context was already rendered unclamped, so the worst-case card height does not grow. No new computation or rendering cost. |
</threat_model>

<verification>
- `pnpm exec tsc --project tsconfig.json` exits 0. `pnpm build` (tsc plus vite build) also passes if the executor runs it.
- `git show --stat HEAD` lists exactly `src/components/timeline/highlight.tsx` and `.changeset/tidy-highlights-wrap.md`.
- Optional manual spot-check: open a highlight with a long highlighted span (for example the one from issue #359) in the timeline and as an embedded note. Confirm the purple span wraps over several lines, every line has rounded padded ends, and the text runs to the end of the sentence with nothing clipped. If this check is not performed, record it in the SUMMARY as an outstanding manual-verification item. Do not report it as passed.
</verification>

<success_criteria>
- Long highlighted text in highlight cards wraps and stays fully visible in both TimelineHighlight and EmbeddedHighlight (fixes #359).
- Short highlights look the same as before.
- The typecheck passes. The change is limited to `HIGHLIGHT_STYLES` plus one changeset file, committed atomically.
</success_criteria>

<output>
Create `.planning/quick/261007-gka-fix-359-highlight-in-long-post-context-i/261007-gka-SUMMARY.md` when done
</output>
