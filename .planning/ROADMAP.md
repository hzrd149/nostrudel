# Roadmap

## Phases

### Phase 1: Hidden mutes support with unlock UX and decryption cache

**Goal:** A generic, application-wide pending-unlock mechanism — a side-nav indicator offering
unlock-once or enable-auto-unlock, Privacy-settings preferences driven by a registry of sources,
and mute lists as the only registered source — so hidden (encrypted) mute entries are readable,
unlockable by a deliberate action, kept unlocked across reloads by the existing decryption cache,
and correctly removable from whichever half they live in.
**Requirements:** D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14, D-15
(no REQUIREMENTS.md exists; the requirement set is the locked decisions in `01-CONTEXT.md`)
**Depends on:** Nothing
**Plans:** 6/6 plans complete

Support hidden (encrypted) mutes in the user's mute lists. applesauce provides APIs for
reading, subscribing to, and unlocking hidden mute entries — the open question is UX:
the user should unlock once, and the decrypted content should be persisted in the
decryption cache so that on app reload the hidden mutes are auto-unlocked (as long as
the mute list event has not been updated).

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Pending-unlock registry service + auto-unlock preferences (wave 1)
- [x] 01-02-PLAN.md — Unmute correctness: getMuteHalf, split write path, merged isMuted (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md — Register the mute-list and decryption-cache pending-unlock categories (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04-PLAN.md — Side-nav pending-unlock affordance and unlock modal (wave 3)
- [x] 01-05-PLAN.md — Privacy settings auto-unlock preferences, registry-driven (wave 3)
- [x] 01-06-PLAN.md — Muted view Private section: locked placeholder and private pubkey list (wave 3)

### Phase 2: Adopt a lint config and CI quality gate

**Goal:** noStrudel has a lint standard it chose and a gate that stops it regressing: a committed
aislop config with per-rule policy and vendored-code exclusions, exact-pinned `pnpm lint` /
`pnpm lint:ci` scripts, a blocking GitHub Actions gate on changed files with an evidence-calibrated
threshold, a feedback-only Claude Code hook, and a recorded post-config baseline score that backlog
items 999.2 – 999.10 are measured against.
**Requirements:** D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14, D-15, D-16
(no REQUIREMENTS.md exists; the requirement set is the locked decisions in `02-CONTEXT.md`)
**Depends on:** Nothing
**Plans:** 5/5 plans complete

Prerequisite for treating any of the backlog code-quality items (999.2 – 999.10) as a
measurable baseline. **The repo currently has no lint configuration at all** — only
`.prettierrc` / `.prettierignore`, and no `lint` script in `package.json`. The 1,257
findings in the [aislop scan](./research/aislop-scan-2026-08-02.md) are aislop's bundled
oxlint/biome/knip defaults, not a standard noStrudel has agreed to.

Scope:

- `aislop init` to commit a config, and decide per-rule what the project actually adopts
  (notably `no-autofocus`, `trivial-comment`, `exhaustive-deps` severity).

- Exclude vendored/ported third-party code from scoring: `src/lib/qrcodegen.ts` (12
  findings), `src/lib/open-graph-scraper/*` (~15), `src/lib/bencode/*`. These inflate the
  score without being ours to fix.

- Exclude or downgrade `sw/client/error-logger.ts` console rules.
- Add a `lint` script and wire `aislop ci` (or `aislop scan --changes`) into CI so the score
  ratchets instead of regressing.

- Optionally `aislop hook install` so agent edits are checked at write time.

Doing this before the remaining backlog items means they are measured against a threshold
the project chose.

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Install exact-pinned aislop@0.16.1 behind a legitimacy checkpoint; add `lint` / `lint:ci` scripts (wave 1)
- [x] 02-02-PLAN.md — `.github/workflows/lint.yml` changed-files gate; AGENTS.md Linting section and inline-ignore convention (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-03-PLAN.md — `.aislop/config.yml` rule policy and vendored exclusions; error-logger rule-scoped ignore (wave 2)
- [x] 02-04-PLAN.md — Project-scope Claude Code aislop hook, feedback only, pinned binary; decision on generated instruction files (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-05-PLAN.md — Calibrate `ci.failBelow` from nine real commits; commit the whole-repo baseline report (wave 3)

### Phase 3: Audit swallowed exceptions and silent failure paths

**Goal:** No error is discarded without a reason: every empty catch in the codebase is either
narrowed and commented as a deliberate parse guard, or surfaced to the user / logged with its
cause — with the decryption and signer paths, where a swallowed error hides a user-facing
failure, resolved first.
**Requirements:** D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14, D-15
(no REQUIREMENTS.md exists; the requirement set is the locked decisions in `03-CONTEXT.md`)
**Depends on:** Phase 2
**Plans:** 1/6 plans executed

59 findings in the [2026-09-11 baseline](./research/aislop-scan-2026-09-11.md) (bucket B):
31 × `ai-slop/swallowed-exception` (empty catch, error severity), 23 × `eslint/no-empty`
(largely the same sites), 2 × `redundant-try-catch`, 1 × `no-async-promise-executor`,
1 × `hidden-fallback`, 1 × `silent-recovery` (`index.tsx` — logs without the caught error,
losing the cause).

These are the findings that already cost the team time: the CI gate fails any diff with an
error-severity finding in a touched file, and Phase 2's calibration showed two of nine sampled
commits failing purely on inherited `swallowed-exception` errors in `src/index.tsx` and
`components/blob-details-modal.tsx`.

Not a blanket fix: many empty catches are legitimate parse guards
(`content/transform/bip-notation.ts`, `nip-notation.ts`, `helpers/nip19.ts`) and just need an
explanatory comment plus a narrowed catch. The ones worth real attention are the
decryption/signer paths where a swallowed error hides user-facing failure —
`classes/encrypted-storage.tsx`, `helpers/nostr/dms.ts`, `components/blob-details-modal.tsx` (4).

Plans:
**Wave 1** *(risk first, per D-02)*

- [x] 03-01-PLAN.md — The five decryption/signer sites: reason comments, namespaced logs, explicit returns (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 03-02-PLAN.md — D-05 explicit-return sweep across 13 parse/filter guards (wave 2)
- [ ] 03-03-PLAN.md — D-10/D-12 log-the-cause remedy at 8 best-effort fallback sites (wave 2)
- [ ] 03-04-PLAN.md — D-09 `useAsyncAction` conversion for 3 user-triggered actions (wave 2)
- [ ] 03-05-PLAN.md — D-13/D-14/D-15 strays: sqlite ceremony, async promise executor, cache-key ignore, index.tsx logger (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 03-06-PLAN.md — AGENTS.md error-handling convention (D-03) and the 31 → 0 rescan report (D-04) (wave 3)

### Phase 4: Dead code and import hygiene sweep

**Goal:** Unused variables, unused and duplicated imports, and unreachable code are gone from
`src/`, with the mechanically auto-fixable share applied in its own reviewable commit and each
deliberate exception (notably the guarded dead code in `services/sqlite/index.ts`) either
documented or removed as an explicit decision.
**Requirements:** TBD
**Depends on:** Phase 2
**Plans:** 0 plans

445 findings in the [2026-09-11 baseline](./research/aislop-scan-2026-09-11.md) (bucket C) —
the largest bucket, and 132 of them auto-fixable via `aislop fix`. 239 × `eslint/no-unused-vars`,
85 × `ai-slop/unused-import` (auto-fixable), 51 × `import/no-duplicates`, 47 ×
`ai-slop/duplicate-import` (auto-fixable), 6 × `no-unused-expressions`, 6 × `no-unreachable`,
plus ~12 single-instance cleanup rules.

Concentrations: `views/lists/list/follow-set.tsx` (17),
`components/outbox-relay-selection-modal.tsx` (13),
`views/messages/inbox/components/locked-messages.tsx` (11),
`views/lists/components/fallback-list-card.tsx` (11), `components/markdown/markdown.tsx` (10),
`views/settings/profile/components/profile-edit-form.tsx` (9).

Known intentional: all 6 `no-unreachable` are in `services/sqlite/index.ts`, below a
deliberate `throw` that guards the web build — the code beneath is kept on purpose
and should be commented or removed as an explicit decision, not silently deleted.

Plans:

- [ ] TBD (plan with /gsd-plan-phase 4)

### Phase 5: Refactor oversized files, long functions, and duplicated blocks

**Goal:** The handful of files and functions that have outgrown themselves are split along real
seams and their duplicated blocks are factored out — with each thin wrapper either inlined or
justified — so the remaining complexity findings reflect deliberate structure.
**Requirements:** TBD
**Depends on:** Phase 4
**Plans:** 0 plans

32 findings in the [2026-09-11 baseline](./research/aislop-scan-2026-09-11.md) (bucket H):
21 × `code-quality/duplicate-block`, 7 × `complexity/function-too-long`, 2 ×
`complexity/file-too-large`, 2 × `ai-slop/thin-wrapper`.

Real targets: `helpers/nostr/torrents.ts` (5 duplicate blocks),
`providers/global/napplet-shell-provider.tsx` (>600 lines + a >160-line function),
`services/notifications/common.ts`, `views/articles/components/article-reader.tsx`,
`views/notifications/index.tsx`, `views/settings/background-worker/cached-files-card.tsx`,
`services/wallets.ts`.

Thin wrappers to inline or justify: `helpers/nostr/relay-stats.ts` (`getRelayURL`),
`services/verify-event.ts` (`verifyEvent`).

Sequenced after Phase 4 so the sweep does not refactor code that is about to be deleted.

Plans:

- [ ] TBD (plan with /gsd-plan-phase 5)

### Phase 6: Close type-safety escape hatches

**Goal:** The two clusters that account for most of the `any` / `as unknown as` / `@ts-ignore`
usage — the IndexedDB wrapper and the copy-pasted notification casts — are replaced by properly
typed helpers, and each remaining directive states why the type system cannot express it.
**Requirements:** TBD
**Depends on:** Phase 2
**Plans:** 0 plans

68 findings in the [2026-09-11 baseline](./research/aislop-scan-2026-09-11.md) (bucket E):
35 × `ts-directive` (`@ts-ignore` / `@ts-expect-error`, info severity), 20 ×
`double-type-assertion` (`as unknown as X`), 13 × `unsafe-type-assertion` (`as any`).

Two clusters make up most of the value: `services/database/index.ts` holds 18 (IndexedDB
wrapper casts — one properly-typed wrapper clears the file), and the identical `as any` casts
copy-pasted across `views/notifications/{mentions,quotes,replies,reposts,threads,zaps}/index.tsx`
want one shared typed helper. Also `services/loaders.ts` (5),
`providers/global/napplet-shell-provider.tsx` (4), `components/magic-textarea.tsx` (3),
`hooks/use-webxdc.ts` (3), `services/wallets.ts` (3).

The vendored `lib/open-graph-scraper/*` hits from the 2026-08-02 scan no longer appear — Phase 2
excludes those paths from scoring.

Plans:

- [ ] TBD (plan with /gsd-plan-phase 6)

### Phase 7: Accessibility pass on interactive components

**Goal:** The interactive components that screen readers currently misreport — custom roles that
should be plain tags, roles missing their required ARIA props, and unlabelled controls — are
corrected, starting with the shared components that every view inherits.
**Requirements:** TBD
**Depends on:** Phase 2
**Plans:** 0 plans

47 `jsx-a11y` findings in the [2026-09-11 baseline](./research/aislop-scan-2026-09-11.md)
(bucket F): 28 × `prefer-tag-over-role`, 8 × `role-has-required-aria-props`, 5 ×
`control-has-associated-label`, 2 × `no-redundant-roles`, 2 × `iframe-has-title`, 1 ×
`alt-text`, 1 × `role-supports-aria-props`.

The policy question this item was blocked on is settled: Phase 2 (D-06) turned
`jsx-a11y/no-autofocus` off, so the 25 deliberate-UX autofocus hits from the 2026-08-02 scan no
longer fire and nothing here is a rule-adoption debate — every remaining finding is a real fix.

Concentrations: `components/magic-textarea.tsx` (10), `components/relay-url-input.tsx` (5),
`views/settings/privacy/index.tsx` (5), `views/articles/article.tsx` (5),
`components/loading-nostr-link.tsx` (4).

Plans:

- [ ] TBD (plan with /gsd-plan-phase 7)

### Phase 8: Triage TODO stubs and hardcoded URLs

**Goal:** Every TODO left in `src/` is resolved, promoted to its own tracked item, or rewritten
to say what is actually missing; the hardcoded service URLs worth centralising live in
`src/const.ts` or are configurable, and the rest are confirmed as legitimate protocol defaults.
**Requirements:** TBD
**Depends on:** Phase 2
**Plans:** 0 plans

33 findings in the [2026-09-11 baseline](./research/aislop-scan-2026-09-11.md) (bucket I):
17 × `ai-slop/hardcoded-url`, 16 × `ai-slop/todo-stub` (info severity).

The TODOs are the useful half — each is a marker of known-incomplete work that should be
either resolved or promoted to its own backlog item rather than left in code:
`const.ts`, `services/accounts.ts`, `services/authentication-signer.ts`,
`services/notifications/zaps.ts`, `hooks/use-cache-form.ts`,
`helpers/nostr/list-history.ts`, `components/event-zap-modal/index.tsx` (2),
`components/post-modal/index.tsx`, `views/new/note/short-text-form.tsx`, and others.

Most hardcoded URLs are legitimate protocol/service defaults (nostr.build, YouTube embed,
default media servers in `views/settings/media-servers/index.tsx`). The action is
consolidating them into `src/const.ts` or making them configurable where it matters — not
removing them.

Plans:

- [ ] TBD (plan with /gsd-plan-phase 8)

---

## Backlog

### Code quality: aislop scan findings (2026-08-02)

These items were catalogued from a single `aislop@0.14.0` scan of `master` @ `d00cfd683`
([`.planning/research/aislop-scan-2026-08-02.md`](./research/aislop-scan-2026-08-02.md)).
Those counts are superseded: Phase 2 landed the adopted config and recorded a fresh whole-repo
baseline at [`.planning/research/aislop-scan-2026-09-11.md`](./research/aislop-scan-2026-09-11.md)
(**score 78/100, 1,196 findings**), which is what any promoted item measures against. The two
scans are not directly comparable — different aislop version, rule set, and scored file set.

Promoted so far: the config/gate item that was 999.11 became **Phase 2**; 999.3, 999.4, 999.9,
999.6, 999.7 and 999.10 became **Phases 3 – 8** (backlog review, 2026-09-12).

Still here: **999.2** (React hook-order violations — the highest-risk bucket in the scan and the
only one aislop classes as confirmed defects at error severity; the roadmap's suggested first
promotion, deliberately left in the backlog at review time), **999.5** (hook dependency arrays)
and **999.8** (comment and console noise). Refresh their counts from the 2026-09-11 baseline when
promoting.

### Phase 999.2: Fix React hook-order violations and missing keys (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

57 findings — **the highest-risk bucket in the scan and the only one aislop classes as
confirmed defects at error severity.** 49 × `react-hooks/rules-of-hooks` (hooks called
conditionally or after early returns → hook-order mismatch between renders, which manifests
as state bleeding between events or crashes on re-render), 6 × `react/jsx-key`,
2 × `react/no-children-prop`.

Concentrations: `views/settings/cache/database/wasm.tsx` (8),
`views/settings/accounts/components/migrate-to-device.tsx` (5),
`simple-signer-backup.tsx` (5), `hooks/use-user-bookmarks-list.ts` (4),
`components/embed-event/card/index.tsx` (3), `components/app-handler-modal/index.tsx` (3).

Spot-checked as genuine: `use-user-bookmarks-list.ts` exports `userUserBookmarksList` — a
typo that both breaks the lint rule's hook detection and hides four real violations;
`embed-event/card/index.tsx:107-113` calls `useSingleEvent`/`useReplaceableEvent` inside
conditionals.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.5: Resolve React hook dependency arrays (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

201 × `react-hooks/exhaustive-deps`. Kept as its own item because it cannot be batch-fixed —
blanket-adding dependencies causes render loops. Each site needs a per-case decision: add the
dep, memoize the value, or annotate the suppression with why.

Concentrations: `views/torrents/index.tsx` (7), `views/notifications/components/notification-counts.tsx` (6),
`components/lightbox-provider.tsx` (6), `providers/route/debug-modal-provider.tsx` (6),
`hooks/use-route-state-value.ts` (6), `hooks/use-timeline-loader.ts` (5).

Worth scoping down to the shared hooks and providers first (`hooks/`, `providers/`) — a stale
closure there propagates to every consumer.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.8: Strip comment and console noise (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

273 findings, **270 of them auto-fixable** — the largest score gain per unit of effort in the
whole scan. 219 × `trivial-comment`, 26 × `console-leftover`, 25 × `narrative-comment`
(decorative separators), 3 × `meta-comment`.

Concentrations: `sw/worker/cache.ts` (15), `sw/client/error-logger.ts` (11),
`classes/encrypted-storage.tsx` (10), `components/webxdc/webxdc.tsx` (9),
`sw/worker/error-handler.ts` (9), `sw/worker/sw.ts` (9), `services/event-cache/native-sqlite.ts` (8).

Caveat: the 11 consoles in `sw/client/error-logger.ts` are that module's entire purpose —
exclude it rather than stripping them. Review the `aislop fix` diff before committing; this
is a large mechanical change and belongs in its own commit so it doesn't bury real fixes.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.12: Add an event menu to highlight timeline items (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Not part of the aislop scan catalogue above — a UI gap reported directly.

Highlight events in the timeline have no event menu, so the user has no way to delete or share
them and no "view raw" option. `src/components/timeline/highlight.tsx` renders only a footer
`ButtonGroup` (reply / share / quote / zap) and no menu at all, unlike every other kind:
`src/components/timeline/note/index.tsx:130` and `src/components/timeline/share.tsx:45` both
render `NoteMenu`.

What the missing menu contains (`src/components/note/note-menu.tsx`): Open in app, Share link,
Copy embed code, Mute user, **Delete event**, Broadcast, Pin event, and `DebugEventMenuItem` —
the raw-event view.

Action: render `NoteMenu` on the highlight card (header or footer, matching the other kinds) so
highlights get the same delete / share / raw options as the rest of the timeline.

Numbering note: 999.1 – 999.11 have all been issued at least once (999.1 → Phase 1,
999.11 → Phase 2, 999.3/4/6/7/9/10 → Phases 3 – 8), so this item takes the first never-used
number rather than reusing a vacated slot.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.13: Support NIP-22 comments in kind 1 threads (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Not part of the aislop scan catalogue above — a protocol/UX capability reported directly.

NIP-22 comments (kind 1111) need to be shown and supported under standard kind 1 threads. Other
clients are starting to let users reply to a thread with either kind, so a thread whose replies
are split across both currently renders incomplete here.

Reply-kind rules the capture specifies:

- Replying to a **NIP-22 comment MUST produce a NIP-22 reply** — not negotiable, not a preference.
- Replying to a **kind 1 NIP-10 note** is the user's choice: a new setting selects whether the
  client publishes a NIP-10 kind 1 reply or a NIP-22 comment.

Current state found while capturing:

- **NIP-22 is already implemented in the app, just not in threads.** `CommentFactory.create`
  (`applesauce-common/factories`), `CommentsModel` and `COMMENT_KIND` are used by
  `src/views/pictures/picture/media-post-comment-form.tsx` and `picture-comments.tsx`, and comment
  UI exists for articles, files, links, badges, webxdc and the app store. This is an integration
  job, not a from-scratch implementation.

- **Thread reading is NIP-10 only.** `src/helpers/nostr/event.ts` resolves replies through
  `getNip10References` and `isReply()` only inspects the NIP-10 reply marker, so kind 1111 events
  never enter the thread tree (`src/views/thread/`).

- **The write seam already exists but is dead.** `src/views/thread/components/reply-form.tsx`
  declares `replyKind?: number` defaulting to `kinds.ShortTextNote`, and then ignores it — `submit`
  unconditionally calls `NoteFactory.reply(event, …)` and publishes as `"Reply"`. Wiring this prop
  up is likely the smallest part of the work. (Note for the dead-code sweep: this unused parameter
  should be wired up here rather than deleted there.)

- **Settings home:** `src/views/settings/post/index.tsx`, which already mixes `useSettingsForm`
  (synced app settings) with `localSettings` via `use$`; a new preference would follow
  `PreferenceSubject` in `src/services/preferences.ts`.

- `src/services/notifications/threads.ts` already branches on kind 1111 for notification grouping,
  so notifications may partly work once threads do.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.14: Pin the app store to the nav in place of "All Apps" (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Not part of the aislop scan catalogue above — a navigation/direction change reported directly.

The app store button should be pinned to the side nav in the slot the "All Apps" link currently
occupies. Rationale from the capture: the forward direction is to migrate the tools and the
smaller internal views into napplets, so the store — not a static index of built-in views —
becomes the way users find functionality.

Current state found while capturing:

- The nav item to replace is `src/components/layout/components/index.tsx:51`:
  `<NavItem to="/other-stuff" icon={Package} label="All Apps" />`.

- **This is one edit that changes two surfaces.** `NavItems` is rendered by both
  `src/components/layout/desktop/side-nav.tsx:46` and
  `src/components/layout/mobile/nav-drawer.tsx:59`. `mobile/bottom-nav.tsx` has no nav items and
  is unaffected. Whether the mobile drawer should match the desktop pin is worth an explicit
  decision rather than an accident of the shared component.

- **The store already exists as a nav destination, just not a pinned one.** `internalApps` in
  `src/components/navigation/apps.ts` contains
  `{ title: "Store", description: "Discover and manage NIP-5D apps", id: "napplets", to: "/app/store" }`,
  so it can already appear via the favourites list (`useFavoriteInternalIds("apps", "app")`) or
  recents. "Pinning" means promoting it to a fixed `NavItem` alongside Create new / Support /
  Settings, so it no longer competes for a favourites slot. The route is registered at
  `src/app.tsx:107` (`app/store` → `views/app/store.tsx`).

Open question this raises:

- **Removing "All Apps" removes the only fixed route to the full index.** `/other-stuff`
  (`src/views/other-stuff`) is what lists every internal app and tool, and `/tools` is already
  just a redirect into it (`src/views/tools/index.tsx` → `/other-stuff?tab=tools`). If the link
  goes, the index is reachable only by URL or by whatever the store surfaces. Decide whether
  "All Apps" moves into the store view, stays as a secondary entry, or is dropped deliberately as
  the migration progresses.

Related: the migration target set is `internalTools` in `src/components/navigation/apps.ts`
(Event Console, Event Publisher, and the other small views) — the things intended to become
napplets.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)
