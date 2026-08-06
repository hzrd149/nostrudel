# aislop scan report — 2026-08-02

Tool: `aislop@0.14.0` (`npx aislop scan --json .`), run at repo root on `master` @ `d00cfd683`.
Raw machine-readable output: [`aislop-scan-2026-08-02.json`](./aislop-scan-2026-08-02.json).

## Headline

| Metric              | Value                                    |
| ------------------- | ---------------------------------------- |
| Score               | **5 / 100** — label `Critical`           |
| Total findings      | 1,257                                    |
| Errors / warnings   | 81 / 1,118 (+58 info)                     |
| Auto-fixable        | 402 (`aislop fix`)                        |
| Files scanned       | 2,169 (all under `src/`, plus `vite.config.ts`) |
| Elapsed             | 3.7s                                      |

Engine breakdown: `lint` 670 · `ai-slop` 552 · `code-quality` 35 · `security` 0 · `format` 0.

Finding assessment (aislop's own confidence buckets):

| Kind                 | Count | Errors | Warnings | Fixable |
| -------------------- | ----- | ------ | -------- | ------- |
| style / policy       | 964   | 0      | 923      | 270     |
| AI-slop indicators   | 238   | 32     | 189      | 132     |
| confirmed defects    | 55    | 49     | 6        | 0       |
| conservative security| 0     | 0      | 0        | 0       |

Confidence: 87 high, 1,170 medium, 0 low.

## Caveats before acting on this

- **The score is unweighted by importance.** ~76% of findings are style/policy (trivial
  comments, unused vars, hook deps). The 55 "confirmed defects" are where the real risk is.
- **`security` engine found nothing.** No credential/injection class issues were detected.
- **Vendored / third-party code is included in the counts.** `src/lib/qrcodegen.ts` (12),
  `src/lib/open-graph-scraper/*` (~15), and `src/lib/bencode/*` are ports of external
  libraries. These should be excluded via `aislop init` config before the score is treated
  as a real baseline, not "fixed".
- **Some findings are intentional.** e.g. `src/services/sqlite/index.ts:8` throws on purpose
  and the 6 `no-unreachable` warnings below it are deliberately-kept setup code. Judgement
  call per-site, not a blanket fix.
- Spot-checked and confirmed real: `use-user-bookmarks-list.ts` (hook exported as
  `userUserBookmarksList` — typo means the hooks lint rule can't see it as a hook),
  `sqlite/index.ts` dead block, `embed-event/card/index.tsx` conditional `useSingleEvent`.

---

## A. React correctness — 57 findings

**All 49 `rules-of-hooks` are `error` severity and classified as confirmed defects.** These
are the highest-risk items in the scan: conditionally-called hooks cause hook-order
mismatches between renders (state bleeding between different events, crashes on re-render).

- `react-hooks/rules-of-hooks` — 49 (error:49; auto-fixable: 0)
- `react/jsx-key` — 6 (warning:6; auto-fixable: 0)
- `react/no-children-prop` — 2 (warning:2; auto-fixable: 0)

Top files:

-   8  `src/views/settings/cache/database/wasm.tsx`
-   5  `src/views/settings/accounts/components/migrate-to-device.tsx`
-   5  `src/views/settings/accounts/components/simple-signer-backup.tsx`
-   4  `src/hooks/use-user-bookmarks-list.ts`
-   3  `src/components/embed-event/card/index.tsx`
-   3  `src/components/app-handler-modal/index.tsx`
-   3  `src/components/embed-event/link/index.tsx`
-   2  `src/views/messages/components/direct-message-content.tsx`
-   2  `src/views/settings/accounts/components/password-signer-backup.tsx`
-   2  `src/views/notifications/threads/components/thread-group.tsx`
-   2  `src/components/layout/presets/app-tabs-layout.tsx`
-   2  `src/components/icons/ZoomOut.tsx`

## B. Error handling — 61 findings

- `ai-slop/swallowed-exception` — 32 (error:32; auto-fixable: 0)
- `eslint/no-empty` — 24 (warning:24; auto-fixable: 0) — largely the same sites
- `ai-slop/redundant-try-catch` — 2 (warning:2; auto-fixable: 0)
- `eslint/no-async-promise-executor` — 1 (warning:1) — `src/components/qr-code/native-scanner.ts:15`
- `ai-slop/hidden-fallback` — 1 (warning:1) — `src/hooks/timeline/use-timeline-cache-key.ts:14`
- `ai-slop/silent-recovery` — 1 (warning:1) — `src/index.tsx:47`

Top files:

-   4  `src/components/blob-details-modal.tsx`
-   2  `src/views/settings/cache/database/components/import-events-button.tsx`
-   2  `src/views/messages/chat/components/decrypt-placeholder.tsx`
-   2  `src/views/streams/stream/components/stream-top-zappers.tsx`
-   2  `src/views/settings/relays/components/relay-control.tsx`
-   2  `src/components/content/transform/bip-notation.ts`
-   2  `src/views/settings/cache/components/enable-with-delete.tsx`
-   2  `src/services/event-cache/index.ts`
-   2  `src/components/content/transform/nip-notation.ts`
-   2  `src/helpers/parse.ts`
-   2  `src/hooks/use-cache-form.ts`
-   2  `src/services/lnurl-metadata.ts`

Note: many empty catches here are legitimate parse-failure guards (`bip-notation`,
`nip-notation`, `nip19.ts`). The fix is usually a comment + narrowed catch, not a rewrite.
Decryption and signer paths (`encrypted-storage.tsx:171`, `helpers/nostr/dms.ts:31`) are the
ones where a swallowed error genuinely hides user-facing failure.

## C. Dead code — 449 findings

- `eslint/no-unused-vars` — 240 (warning:240; auto-fixable: 0)
- `ai-slop/unused-import` — 85 (warning:85; **auto-fixable: 85**)
- `import/no-duplicates` — 51 (warning:51; auto-fixable: 0)
- `ai-slop/duplicate-import` — 47 (warning:47; **auto-fixable: 47**)
- `eslint/no-unused-expressions` — 7 (warning:7)
- `eslint/no-unreachable` — 6 (warning:6) — all `src/services/sqlite/index.ts`, intentional
- `unicorn/no-useless-spread` — 2, `typescript/no-unnecessary-parameter-property-assignment` — 2
- 1 each: `no-extra-boolean-cast`, `no-useless-escape`, `unicorn/no-new-array`,
  `unicorn/no-empty-file`, `no-shadow-restricted-names`, `no-useless-rename`,
  `unicorn/no-useless-length-check`, `ai-slop/empty-function`, `ai-slop/unreachable-code`

Top files:

-  17  `src/views/lists/list/follow-set.tsx`
-  13  `src/components/outbox-relay-selection-modal.tsx`
-  11  `src/views/messages/inbox/components/locked-messages.tsx`
-  11  `src/views/lists/components/fallback-list-card.tsx`
-  10  `src/components/markdown/markdown.tsx`
-   9  `src/views/settings/profile/components/profile-edit-form.tsx`
-   8  `src/services/sqlite/index.ts`
-   7  `src/views/feeds/outboxes/outbox-feed.tsx`
-   6  `src/helpers/nostr/lists.ts`
-   6  `src/views/settings/display/index.tsx`
-   5  `src/views/messages/chat/components/direct-message-form.tsx`
-   5  `src/services/notifications/zaps.ts`

## D. Hook dependency arrays — 201 findings

- `react-hooks/exhaustive-deps` — 201 (warning:201; auto-fixable: 0)

Top files:

-   7  `src/views/torrents/index.tsx`
-   6  `src/views/notifications/components/notification-counts.tsx`
-   6  `src/components/lightbox-provider.tsx`
-   6  `src/providers/route/debug-modal-provider.tsx`
-   6  `src/hooks/use-route-state-value.ts`
-   5  `src/hooks/use-timeline-loader.ts`
-   5  `src/components/poll/poll-content.tsx`
-   5  `src/components/qr-code/animated-qr-scanner-button.tsx`
-   5  `src/hooks/use-input-upload-file.ts`
-   4  `src/components/people-list-selection/people-list-selection.tsx`
-   4  `src/hooks/use-scroll-restore.ts`
-   4  `src/views/poll/components/details-tabs.tsx`

Treated as its own bucket because blanket-adding deps causes render loops. Each site needs
a decision: add the dep, memoize the value, or annotate the suppression.

## E. Type-safety escape hatches — 74 findings

- `ai-slop/ts-directive` — 41 (info:41) — `@ts-ignore` / `@ts-expect-error`
- `ai-slop/double-type-assertion` — 20 (warning:20) — `as unknown as X`
- `ai-slop/unsafe-type-assertion` — 13 (warning:13) — `as any`

Top files:

-  18  `src/services/database/index.ts`
-   5  `src/lib/open-graph-scraper/extract.ts`  *(vendored)*
-   5  `src/services/loaders.ts`
-   4  `src/providers/global/napplet-shell-provider.tsx`
-   3  `src/components/magic-textarea.tsx`
-   3  `src/hooks/use-webxdc.ts`
-   3  `src/services/wallets.ts`
-   2  `src/views/tools/event-console/process.ts`
-   1 each: `webxdc.tsx`, `helpers/media-upload/nostr-build.ts`, `hooks/use-route-state-value.ts`,
  `lib/open-graph-scraper/media.ts`, `polyfill.ts`, `services/lookup/vertex.ts`

`src/services/database/index.ts` alone holds 18 (mostly IndexedDB wrapper casts) — one
properly-typed wrapper would clear most of the bucket. The 6 identical `as any` casts across
`src/views/notifications/*/index.tsx` are a copy-paste pattern worth extracting.

## F. Accessibility — 72 findings

- `jsx-a11y/prefer-tag-over-role` — 28
- `jsx-a11y/no-autofocus` — 25
- `jsx-a11y/role-has-required-aria-props` — 8
- `jsx-a11y/control-has-associated-label` — 5
- `jsx-a11y/no-redundant-roles` — 2, `jsx-a11y/iframe-has-title` — 2
- `jsx-a11y/alt-text` — 1, `jsx-a11y/role-supports-aria-props` — 1

Top files:

-  10  `src/components/magic-textarea.tsx`
-   5  `src/components/relay-url-input.tsx`
-   5  `src/components/loading-nostr-link.tsx`
-   5  `src/views/settings/privacy/index.tsx`
-   5  `src/views/articles/article.tsx`
-   2  `src/components/compact-note-content.tsx`
-   2  `src/views/articles/components/article-tags.tsx`
-   2  `src/components/layout/desktop/side-nav.tsx`

`no-autofocus` (25) is often a deliberate UX choice in modals/forms — decide policy once,
then either fix or configure the rule off.

## G. Comment & log noise — 273 findings

- `ai-slop/trivial-comment` — 219 (warning:219; **auto-fixable: 219**)
- `ai-slop/console-leftover` — 26 (warning:26; **auto-fixable: 26**)
- `ai-slop/narrative-comment` — 25 (warning:25; **auto-fixable: 25**)
- `ai-slop/meta-comment` — 3 (warning:3)

Top files:

-  15  `src/sw/worker/cache.ts`
-  11  `src/sw/client/error-logger.ts`
-  10  `src/classes/encrypted-storage.tsx`
-  10  `src/lib/qrcodegen.ts`  *(vendored)*
-   9  `src/components/webxdc/webxdc.tsx`
-   9  `src/sw/worker/error-handler.ts`
-   9  `src/sw/worker/sw.ts`
-   8  `src/services/event-cache/native-sqlite.ts`
-   6  `src/services/wallets.ts`
-   5  `src/index.tsx`
-   5  `src/services/outbox-cache.ts`
-   5  `src/views/articles/components/article-reader.tsx`

270 of these 273 are auto-fixable — this is the single largest score win per unit of effort.
Caveat: `src/sw/client/error-logger.ts` consoles (11) are the intended output of an error
logger; exclude rather than strip.

## H. Complexity & duplication — 37 findings

- `code-quality/duplicate-block` — 21
- `complexity/function-too-long` — 9
- `complexity/file-too-large` — 4 — `lib/open-graph-scraper/fields.ts`, `lib/qrcodegen.ts`
  (both vendored), `providers/global/napplet-shell-provider.tsx`, `services/wallets.ts`
- `ai-slop/thin-wrapper` — 2 — `helpers/nostr/relay-stats.ts:7`, `services/verify-event.ts:32`
- `complexity/deep-nesting` — 1

Top files:

-   5  `src/helpers/nostr/torrents.ts`
-   2 each: `lib/open-graph-scraper/fallback.ts`, `providers/global/napplet-shell-provider.tsx`,
  `services/notifications/common.ts`, `views/articles/components/article-reader.tsx`,
  `views/notifications/index.tsx`, `views/settings/background-worker/cached-files-card.tsx`

## I. Incomplete work & hardcoded config — 33 findings

- `ai-slop/hardcoded-url` — 17
- `ai-slop/todo-stub` — 16

Top files:

-   3  `src/views/settings/media-servers/index.tsx`
-   2  `src/components/event-zap-modal/index.tsx`
-   2  `src/components/content/links/youtube.tsx`
-   2  `src/views/user/tabs/advanced/nip-05.tsx`
-   1 each: `components/county-picker.tsx`, `components/icons.tsx`, `components/post-modal/index.tsx`,
  `components/timeline/note/components/share-modal.tsx`, `const.ts`,
  `helpers/nostr/list-history.ts`, `hooks/use-cache-form.ts`, `services/accounts.ts`,
  `services/authentication-signer.ts`, `services/notifications/zaps.ts`,
  `views/new/note/short-text-form.tsx`, `views/new/picture/media-slide.tsx`,
  `views/blossom/server/use-server-url-param.tsx`, `views/signup/components/finished-step.tsx`,
  and others

Most hardcoded URLs are legitimate protocol/service defaults (nostr.build, YouTube embed,
default media servers). The action is "move to `src/const.ts` or make configurable where it
matters", not "remove".

## Reproducing

```sh
npx aislop@0.14.0 scan .              # human-readable
npx aislop@0.14.0 scan --json .       # what produced the JSON above
npx aislop@0.14.0 scan --changes      # only files changed from HEAD
npx aislop@0.14.0 fix .               # apply the 402 mechanical fixes
npx aislop@0.14.0 rules               # explain every rule
```

There is currently **no lint config in the repo** (only `.prettierrc` / `.prettierignore`,
and no `lint` script in `package.json`). aislop ran with its own bundled oxlint/biome/knip
defaults, so the rule set above is aislop's opinion, not a project-adopted standard. Deciding
which of these rules noStrudel actually adopts is itself part of the work.
