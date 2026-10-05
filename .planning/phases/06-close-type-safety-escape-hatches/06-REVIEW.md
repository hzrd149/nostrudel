---
phase: 06-close-type-safety-escape-hatches
reviewed: 2026-10-05T00:00:00Z
depth: standard
files_reviewed: 47
files_reviewed_list:
  - src/components/magic-textarea.tsx
  - src/components/webxdc/jsonrpc.test.ts
  - src/components/webxdc/jsonrpc.ts
  - src/components/webxdc/webxdc.tsx
  - src/helpers/media-upload/nostr-build.ts
  - src/hooks/use-route-state-value.ts
  - src/hooks/use-scroll-restore.ts
  - src/hooks/use-textarea-upload-file.ts
  - src/hooks/use-webxdc.ts
  - src/polyfill.ts
  - src/services/database/index.ts
  - src/services/database/schema.ts
  - src/services/debug-api.ts
  - src/services/dns-identity-loader.ts
  - src/services/event-cache/index.ts
  - src/services/event-cache/wasm-worker.ts
  - src/services/event-store.ts
  - src/services/loaders.ts
  - src/services/lookup/vertex.ts
  - src/services/napplet-shell/adapter.ts
  - src/services/napplet-shell/common-actions.ts
  - src/services/outbox-cache.ts
  - src/services/pool.ts
  - src/services/preferences.ts
  - src/services/read-status.ts
  - src/services/relay-info.ts
  - src/services/relay-scoreboard.ts
  - src/services/social-graph.ts
  - src/services/wallets/index.ts
  - src/services/wallets/webln.ts
  - src/services/xml-feeds.ts
  - src/types/webln.d.ts
  - src/views/groups/components/group-message-form.tsx
  - src/views/new/picture/picture-post-form.tsx
  - src/views/notifications/mentions/index.tsx
  - src/views/notifications/quotes/index.tsx
  - src/views/notifications/replies/index.tsx
  - src/views/notifications/reposts/index.tsx
  - src/views/notifications/threads/index.tsx
  - src/views/notifications/zaps/index.tsx
  - src/views/pictures/picture/media-post-comment-form.tsx
  - src/views/streams/stream/stream-chat/stream-chat-form.tsx
  - src/views/tools/event-console/process.test.ts
  - src/views/tools/event-console/process.ts
  - src/views/tools/event-publisher/index.tsx
  - src/views/tools/event-publisher/process.ts
  - src/vite-env.d.ts
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-10-05
**Depth:** standard
**Files Reviewed:** 47
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed `git diff 517adf069..HEAD -- src` file by file. The main question was whether any of the "type-only" edits changed runtime behaviour. I checked each one against the library code it calls. `tsc --noEmit` passes. The two new vitest suites pass (11 tests).

**No unintended runtime change found.** These are the edits I checked:

- **Napplet `poolLike` adapter (`adapter.ts:80-86`).** It replaces the `pool as unknown as RelayPoolLike` cast and no longer exposes applesauce's Observable-returning `count`. kehto reaches the pool only through `getRelayPool()` (`@kehto/shell` `createRelayPoolAdapter`), which calls only `subscription` and `publish`. The one consumer of the publish result (`@kehto/runtime` `handleRelayPublish`) wraps it in `Promise.resolve(...).then(() => settle(true))` and never reads the value. So turning `Promise<PublishResponse[]>` into `Promise<void>` changes nothing observable, and errors still propagate. `toRelayFilters` is a shallow copy of plain postMessage data.
- **`isWebxdcMessage` (`jsonrpc.ts:5`).** For anything that can arrive through structured clone, it matches the old `!msg || msg.jsonrpc !== "2.0"` check exactly. Widening `id`/`method` to `unknown` does not change the `switch`/`respond` paths.
- **`ReactionFactory.create(event, emoji)` (`common-actions.ts:171`).** The `create` signature accepts `string | Emoji`. The old `as string` was a type lie, and the runtime value was always the object. `await` on the thenable factory still produces the template.
- **`innerRef` (`magic-textarea.tsx:184`).** The value is now `undefined` instead of `null` when there is no ref. The library only checks it for truthiness (`props.innerRef && props.innerRef(ref)`), so this is equivalent.
- **v5 migration destructuring (`database/index.ts:126`).** Same stored object as spread + `delete`.
- **`atSchema` (`database/index.ts:24`).** It only re-types the arguments, so the migration bodies are unchanged. I ran a type probe in a scratch tsconfig. It confirms `SchemaV13 extends DBSchema` is now true. `StoreNames<SchemaV13>` rejects `"totally-not-a-store"` and `"dnsIdentifiers"`, and `StoreNames<SchemaV11>` still accepts `"dnsIdentifiers"`. The D-05 goal holds. The values of `relayInfo`, `kv` and `settings`/`misc` are still `any` because of their pre-existing `value: any` annotations, which D-04 puts out of scope.
- **`processEvent` (`event-publisher/process.ts:87`).** The hash is computed over the same fields. The returned object has the same key order as the old mutated copy.
- **Removed `virtual:pwa-register/react` declaration (`vite-env.d.ts`).** Covered by `vite-plugin-pwa/client` → `react.d.ts`. Nothing in `src/` imports the React entry.
- **The 19 `Reflect.set` debug globals and `Reflect.deleteProperty` in `debug-api.ts`.** Same behaviour as before.
- **D-07 and D-18.** Each is in its own commit (`f37f7fbe6`, `83221af05`). D-18's spread to event-publisher `created_at` is documented in 06-08-SUMMARY.

The one Warning is a silent-fallback branch added inside the new D-18 parser. It is the same kind of silent misreading that D-18 was meant to remove. The Info items are small quality points.

## Warnings

### WR-01: `parseTimeUnit` silently maps unknown unit letters to hours

**File:** `src/views/tools/event-console/process.ts:4-16`
**Issue:** `TIME_UNITS` is typed `Record<string, ManipulateType>`, and `parseTimeUnit` ends with `?? "hour"`. `parseTimeUnit` is exported. Any letter missing from the table silently becomes hours instead of failing. That is the same kind of quiet misreading D-18 just fixed (uppercase letters were being read as milliseconds or months).

Two things are wrong with this:

- **The type checker cannot catch drift.** With `Record<string, …>`, the lookup is never `undefined` as far as TS knows, so the `??` branch looks dead to the compiler. If someone widens the regex at line 22 (for example adds `y` or `M` for month) without updating the table, the new letter becomes "hours" and nothing fails at compile time or at runtime.
- **It is an unflagged hidden fallback.** That is the pattern the project's aislop config targets.

The branch cannot be reached from `processDateString` today, so making it strict adds no reachable rejection path (D-15 still holds).

**Fix:**
```ts
const TIME_UNITS = {
  h: "hour",
  w: "week",
  m: "minute",
  s: "second",
  d: "day",
} as const satisfies Record<string, ManipulateType>;

type TimeUnitLetter = keyof typeof TIME_UNITS;

function isTimeUnitLetter(letter: string): letter is TimeUnitLetter {
  return Object.hasOwn(TIME_UNITS, letter);
}

/** Maps a relative-date unit letter (any case) to a dayjs unit, defaulting to hours when absent. */
export function parseTimeUnit(letter: string | undefined): ManipulateType {
  if (!letter) return "hour";
  const lower = letter.toLowerCase();
  if (!isTimeUnitLetter(lower)) throw new Error(`Unknown time unit ${letter}`);
  return TIME_UNITS[lower];
}
```
You could also build the regex character class from `Object.keys(TIME_UNITS)` so the two cannot drift apart.

## Info

### IN-01: `isSetter` is an unchecked type guard, and its comment says it solves the problem it actually hides

**File:** `src/hooks/use-route-state-value.ts:9-12`
**Issue:** The doc comment says "a plain typeof check cannot tell a setter from a T that is itself a function, so the narrowing is stated explicitly". But the guard body *is* that plain `typeof` check. The `valueOrSetter is (v: T) => T` predicate is an unverified assertion, so it works like the `@ts-ignore` it replaced. If `T` is ever a function type, the value is still called as a setter. Behaviour is unchanged from before (so this is not a regression), but the comment suggests the unsoundness was handled when it was only moved.
**Fix:** Reword the comment to say what it does, for example: "Treats any function as a setter; route-state values must not be functions." Optionally add `T extends Exclude<unknown, Function>`-style documentation on the hook.

### IN-02: D-18 makes the unit letter case-insensitive, but the `n` prefix is still case-sensitive

**File:** `src/views/tools/event-console/process.ts:19-22`
**Issue:** `"N"` and `"NOW"` are accepted (`date.toLowerCase() === "n"`), and the regex has the `/i` flag. But `date.startsWith("n")` is case-sensitive, so `"N-5h"` throws `Unknown date string` while `"n-5H"` now works. This is pre-existing and not made worse. Still, D-18's stated goal ("uppercase letters mean the same as lowercase") is only partly met, and `process.test.ts` does not pin this.
**Fix:** Use `date.toLowerCase().startsWith("n")`, or anchor a single case-insensitive regex `/^n([+-])(\d+)([hwmsd])?$/i`. That would be another deliberate behaviour change, so it needs a ruling like D-18.

### IN-03: The `useCacheForm` generic in `group-message-form` repeats the form shape inferred from `useForm`

**File:** `src/views/groups/components/group-message-form.tsx:26`
**Issue:** `useCacheForm<{ content: string }>(…)` writes out by hand the type that `useForm({ defaultValues: { content: "" } })` infers on lines 18-23. If a field is added to `defaultValues` and not to the literal, the cache hook is typed against the wrong shape. `picture-post-form.tsx` avoids this by using a shared `FormValues` type.
**Fix:** Declare `type GroupMessageFormValues = { content: string }` once and use it in both `useForm<GroupMessageFormValues>(…)` and `useCacheForm<GroupMessageFormValues>(…)`.

---

_Reviewed: 2026-10-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
