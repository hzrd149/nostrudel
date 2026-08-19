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
**Plans:** 1/6 plans executed

Support hidden (encrypted) mutes in the user's mute lists. applesauce provides APIs for
reading, subscribing to, and unlocking hidden mute entries — the open question is UX:
the user should unlock once, and the decrypted content should be persisted in the
decryption cache so that on app reload the hidden mutes are auto-unlocked (as long as
the mute list event has not been updated).

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Pending-unlock registry service + auto-unlock preferences (wave 1)
- [ ] 01-02-PLAN.md — Unmute correctness: getMuteHalf, split write path, merged isMuted (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-03-PLAN.md — Register the mute-list and decryption-cache pending-unlock categories (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-04-PLAN.md — Side-nav pending-unlock affordance and unlock modal (wave 3)
- [ ] 01-05-PLAN.md — Privacy settings auto-unlock preferences, registry-driven (wave 3)
- [ ] 01-06-PLAN.md — Muted view Private section: locked placeholder and private pubkey list (wave 3)

### Phase 2: Adopt a lint config and CI quality gate

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Depends on:** Nothing
**Plans:** 0 plans

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

- [ ] TBD (run /gsd-plan-phase to break down)

---

## Backlog

### Code quality: aislop scan findings (2026-08-02)

The items below (999.2 – 999.10) were catalogued from a single `aislop@0.14.0` scan of
`master` @ `d00cfd683`. Full evidence, per-rule counts, file lists, and caveats:
[`.planning/research/aislop-scan-2026-08-02.md`](./research/aislop-scan-2026-08-02.md)
(raw JSON alongside it). **Score: 5/100 "Critical" — 1,257 findings (81 errors, 1,118
warnings, 402 auto-fixable) across 2,169 files.**

The config/gate item that was 999.11 has been promoted to **Phase 2**. Do not promote any
item below until Phase 2 lands — otherwise they are fixing findings against aislop's bundled
defaults, including in vendored code that Phase 2 excludes from scoring.

Suggested ordering if promoted afterwards: 999.2 (real bugs) → 999.3 → 999.4 → 999.9 →
the rest.

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

### Phase 999.3: Audit swallowed exceptions and silent failure paths (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

61 findings: 32 × `ai-slop/swallowed-exception` (empty catch, error severity), 24 ×
`eslint/no-empty` (largely the same sites), 2 × `redundant-try-catch`, 1 ×
`no-async-promise-executor` (`components/qr-code/native-scanner.ts:15`), 1 ×
`hidden-fallback` (`hooks/timeline/use-timeline-cache-key.ts:14`), 1 × `silent-recovery`
(`index.tsx:47` — logs without the caught error, losing the cause).

Not a blanket fix: many empty catches are legitimate parse guards (`bip-notation.ts`,
`nip-notation.ts`, `helpers/nip19.ts`) and just need an explanatory comment plus a narrowed
catch. The ones worth real attention are the decryption/signer paths where a swallowed error
hides user-facing failure — `classes/encrypted-storage.tsx:171`, `helpers/nostr/dms.ts:31`,
`components/blob-details-modal.tsx` (4).

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.4: Dead code and import hygiene sweep (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

449 findings — the largest bucket, and 132 of them are mechanically auto-fixable via
`aislop fix`. 240 × `eslint/no-unused-vars`, 85 × `ai-slop/unused-import` (auto-fixable),
51 × `import/no-duplicates`, 47 × `ai-slop/duplicate-import` (auto-fixable), 7 ×
`no-unused-expressions`, 6 × `no-unreachable`, plus ~12 single-instance cleanup rules.

Concentrations: `views/lists/list/follow-set.tsx` (17),
`components/outbox-relay-selection-modal.tsx` (13),
`views/messages/inbox/components/locked-messages.tsx` (11),
`views/lists/components/fallback-list-card.tsx` (11), `components/markdown/markdown.tsx` (10).

Known intentional: all 6 `no-unreachable` are in `services/sqlite/index.ts`, below a
deliberate `throw` at line 8 that guards the web build — the code beneath is kept on purpose
and should be commented or removed as an explicit decision, not silently deleted.

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

### Phase 999.6: Close type-safety escape hatches (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

74 findings: 41 × `ts-directive` (`@ts-ignore` / `@ts-expect-error`), 20 ×
`double-type-assertion` (`as unknown as X`), 13 × `unsafe-type-assertion` (`as any`).

Two clusters make up most of the value: `services/database/index.ts` holds 18 (IndexedDB
wrapper casts — one properly-typed wrapper clears the file), and 6 identical `as any` casts
are copy-pasted across `views/notifications/{mentions,quotes,replies,reposts,threads,zaps}/index.tsx`
and want one shared typed helper. Also `services/loaders.ts` (5),
`providers/global/napplet-shell-provider.tsx` (4), `hooks/use-webxdc.ts` (3).

Excludes `lib/open-graph-scraper/*` (5) — vendored, see Phase 2.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.7: Accessibility pass on interactive components (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

72 `jsx-a11y` findings: 28 × `prefer-tag-over-role`, 25 × `no-autofocus`, 8 ×
`role-has-required-aria-props`, 5 × `control-has-associated-label`, 2 × `no-redundant-roles`,
2 × `iframe-has-title`, 1 × `alt-text`, 1 × `role-supports-aria-props`.

Concentrations: `components/magic-textarea.tsx` (10), `components/relay-url-input.tsx` (5),
`components/loading-nostr-link.tsx` (5), `views/settings/privacy/index.tsx` (5),
`views/articles/article.tsx` (5).

Requires a policy decision first: the 25 `no-autofocus` hits are mostly deliberate UX in
modals and forms. Decide once whether noStrudel adopts that rule, then either fix the sites
or turn the rule off in config — don't churn through them case by case.

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

### Phase 999.9: Refactor oversized files, long functions, and duplicated blocks (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

37 findings: 21 × `duplicate-block`, 9 × `function-too-long`, 4 × `file-too-large`, 2 ×
`thin-wrapper`, 1 × `deep-nesting`.

Real targets (after excluding the two vendored files that trip `file-too-large`):
`providers/global/napplet-shell-provider.tsx` (>600 lines + a >160-line function),
`services/wallets.ts` (>400 lines), `helpers/nostr/torrents.ts` (5 duplicate blocks),
`components/post-modal/index.tsx`, `views/new/poll/poll-form.tsx`,
`views/relays/relay/tabs/about.tsx`, `views/tools/event-publisher/index.tsx`.

Thin wrappers to inline or justify: `helpers/nostr/relay-stats.ts:7` (`getRelayURL`),
`services/verify-event.ts:32` (`verifyEvent`).

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.10: Triage TODO stubs and hardcoded URLs (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

33 findings: 17 × `hardcoded-url`, 16 × `todo-stub`.

The TODOs are the useful half — each is a marker of known-incomplete work that should be
either resolved or promoted to its own backlog item rather than left in code:
`const.ts:11`, `services/accounts.ts:33`, `services/authentication-signer.ts:51`,
`services/notifications/zaps.ts:78`, `hooks/use-cache-form.ts:7`,
`helpers/nostr/list-history.ts:92`, `components/event-zap-modal/index.tsx` (2),
`components/post-modal/index.tsx:180`, `views/new/note/short-text-form.tsx:193`, and others.

Most hardcoded URLs are legitimate protocol/service defaults (nostr.build, YouTube embed,
default media servers in `views/settings/media-servers/index.tsx`). The action is
consolidating them into `src/const.ts` or making them configurable where it matters — not
removing them.

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)
