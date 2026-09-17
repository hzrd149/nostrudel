---
phase: 04-dead-code-and-import-hygiene-sweep
scope: gap-closure plan 04-12 only (3 commits off 456ec36cc)
reviewed: 2026-09-17T15:59:09Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/views/new/note/short-text-form.tsx
  - src/components/post-modal/index.tsx
  - src/components/pow/mine-pow.tsx
findings:
  critical: 3
  warning: 3
  info: 1
  total: 7
status: issues_found
---

# Phase 04 Plan 12: Scoped Code Review Report

**Reviewed:** 2026-09-17T15:59:09Z
**Depth:** standard
**Files Reviewed:** 3
**Diff base:** `456ec36cc` (commits `bbfaab649`, `fb55b8cbe`, `8a4d2af4c`)
**Status:** issues_found

> Scoped to gap-closure plan 04-12. The phase-wide review at `04-REVIEW.md` (86 files) is
> unmodified and non-overlapping — none of its 5 open findings (WR-01, WR-02, IN-01..03) touch
> the code paths assessed here.

## Summary

The change is three lines of restructuring, but it converts a code path that has been unreachable
since 2025-06-02 into a live one. The diff itself is faithful to the plan: `createDraft` is hoisted,
not duplicated (verified: exactly one `await createDraft(values)` per composer), the render gates are
textually unchanged, D-12's `cleanup()` is untouched, and aislop baselines are genuinely unchanged
(measured this session: post-modal 3, short-text-form 2, mine-pow 0 — the summary's claim holds).

The defects are not in the diff. They are in the ~15 months of code downstream of the gate that has
never executed, and which now runs in production for the first time. Three of them are BLOCKERs:
one strands the composer in an unrecoverable spinner *and* deletes the user's note text, and two
stem from `MinePOW` having no unmount teardown whatsoever — leaking the entire worker pool and, in a
narrow window, publishing a note the user just dismissed.

**Verdict on the review focus items:**

1. **The `setLoading` hoist / deferred edge case — the plan's reasoning is correct but materially
   understates the blast radius.** The success path is indeed safe for the reason the plan gives
   (the `published` gate precedes the `loading` gate). But the failure mode is worse than "would
   leave the spinner up": it is unrecoverable *and* lossy. See CR-01. Note also that the cause is
   not the `setLoading("Creating note...")` hoist — it is `publishPost`'s own `setLoading` at
   line 139 escaping the `try`/`finally`, which the hoist neither created nor worsened.
2. **Draft finalized before cancel — cleared, nothing escapes.** `finalizeDraft`
   (`publish-provider.tsx:124-132`) only applies the NIP-89 client tag and attaches `pubkey`. No
   signing (that is `publishEvent:154`), no network, no `eventStore` write, no cache write. The
   stale `draft` left in state after a cancel is harmless because every subsequent submit overwrites
   it via `setDraft` before the gate is re-read. The plan's T-04-37 `accept` disposition is correct.
3. **post-modal with no error handling — a real but silent regression surface.** See WR-01.
4. **The `>=` change is correct and is a net safety improvement.** It cannot double-publish
   (`miningComplete` at `mine-pow.tsx:29/34` gates `onComplete` to one call) and it cannot fire early
   off a progress message (`miner.ts:25` breaks on `>= target`, so any reported difficulty at or
   above target is immediately followed by `complete`). It also *closes* a pre-existing
   double-publish race — see the note under WR-02. There is one residual premature-render case,
   inherited and aggravated rather than introduced: WR-02.
5. **Missed by the above:** CR-02, CR-03, WR-03.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Publish failure after mining strands the composer forever *and* deletes the user's note

**File:** `src/views/new/note/short-text-form.tsx:139-153` (render gates at `157`, `165`, `174`)
**Classification:** BLOCKER — **introduced by this change** (newly reachable path)

`publishPost` sets `setLoading("Signing and publishing note...")` at line 139. On the PoW path it is
invoked from `MinePOW`'s `onComplete`/`onSkip` (lines 181-182) — that is, *after* `submit`'s
`finally { setLoading(""); }` at line 151 has already run. Nothing else ever clears `loading`.

The failure is silent by construction. `publish` is `publishEvent`, whose `quite` parameter
**defaults to `true`** (`publish-provider.tsx:140`), so its `catch` at lines 166-169 swallows the
error into a toast and returns `undefined`. `publishPost` therefore does not throw — it just returns
with `pub === undefined`, so `setPublished` is never called.

Render gate order then traps the component permanently:

```
157: if (published)            -> not set, publish failed
165: if (loading)              -> "Signing and publishing note..." -> SPINNER, forever
174: if (miningTarget && draft) -> unreachable
```

`MinePOW` has already unmounted (the `loading` gate precedes the mining gate), so there is no Cancel,
no Skip, no retry, and no form. The only escape is leaving the page — which is where the data loss
lands: `useCacheForm`'s teardown (`use-cache-form.ts:54-63`) and its `useBeforeUnload` handler
(lines 66-77) both **remove** the localStorage entry when `isSubmitted.current || isSubmitting.current`.
react-hook-form sets `isSubmitted = true` as soon as `submit` resolves, which on the PoW path is
immediately after `setMiningTarget` — long before mining finishes. So navigating away or reloading to
escape the stuck spinner destroys the cached draft. The user loses the note text with no way to
recover it.

**Fix** — make `publishPost` own the full lifecycle of the loading state it sets:

```tsx
const publishPost = async (unsigned: UnsignedEvent) => {
  const pointers = processTags(unsigned.tags, (t) => (t[0] === "q" ? getEventPointerFromQTag(t) : undefined)).filter(
    (p): p is NonNullable<typeof p> => p !== null,
  );
  const events = pointers.map((p) => eventStore.getEvent(p.id)).filter((t) => !!t);
  for (const event of events) publish("Broadcast event", event);

  setLoading("Signing and publishing note...");
  try {
    const pub = await publish("Post", unsigned);
    // publishEvent defaults to quite=true and returns undefined on failure, so an
    // undefined result is the failure signal — release the spinner and fall back to the form.
    if (pub) setPublished(pub);
    else setLoading("");
  } catch (err) {
    setLoading("");
    throw err;
  }
};
```

Leaving `loading` set on success is intentional (the `published` gate masks it), but it is fragile —
consider clearing it there too and relying solely on `published`.

---

#### CR-02: `MinePOW` leaks its entire worker pool on any unmount that isn't Cancel or Skip

**File:** `src/components/pow/mine-pow.tsx:100-116`
**Classification:** BLOCKER — **introduced by this change** (newly reachable path)

`useMount` from react-use is implemented as `useEffectOnce(function () { fn(); })`
(`node_modules/react-use/lib/useMount.js`) — it **discards the callback's return value**, so no
cleanup function can be registered through it. `MinePOW` has no `useUnmount` and no other teardown.

Worker termination therefore has exactly three triggers, all of which require the component to stay
mounted: the Cancel button (line 136), the Skip button (line 146), and `cleanup()` on completion
(line 47). Any *other* unmount leaves `getNumThreads()` — i.e. `navigator.hardwareConcurrency`, often
8-16 — workers running, each in the unbounded `setTimeout(mine, 0)` hot loop at `miner.ts:33` with no
exit condition other than finding the target. They burn every core until the page is reloaded.

Concretely reachable today:

- **`post-modal/index.tsx:303`** — `<Modal isOpen={isOpen} onClose={onClose} size="4xl">` sets
  neither `closeOnEsc` nor `closeOnOverlayClick`, and both default to `true` in Chakra v2
  (`^2.10.10`). Pressing ESC or clicking the overlay mid-mine unmounts the whole modal without ever
  touching `stopMiner.current`. Note the modal renders `ModalCloseButton` only when `publishEntry`
  is set (line 306), so ESC/overlay is precisely how a user *would* back out during mining.
- **`short-text-form.tsx`** — navigating to any other route unmounts the composer.
- Any `ErrorBoundary` trip or parent re-render that drops the subtree.

This does **not** conflict with D-12. Line 47's `cleanup()` covers only the completion case; this
finding adds an orthogonal unmount path and leaves line 47 untouched.

**Fix** — `react-use` already ships `useUnmount` (`node_modules/react-use/lib/useUnmount.js`):

```tsx
import { useMount, useUnmount } from "react-use";
// ...
useUnmount(() => {
  stopMiner.current();
});
```

---

#### CR-03: A note can be published after the user has dismissed the composer

**File:** `src/components/pow/mine-pow.tsx:110-112`
**Classification:** BLOCKER — **introduced by this change** (newly reachable path)

```tsx
(draft) => {
  setTimeout(() => onComplete(draft), successDelay);   // successDelay = 800ms, handle discarded
},
```

The timeout handle is never stored and never cleared. Combined with CR-02's missing unmount
teardown, if the component unmounts inside that 800 ms window — ESC or overlay click on the post
modal, or a route change in the composer — the callback still fires and calls `onComplete`, which is
`publishPost`. `publishPost` closes over `publish` (a context callback) and module-scope `eventStore`
/ `pool`, none of which care that the React tree is gone, so the event is **signed and broadcast to
relays** after the user explicitly dismissed the compose UI. Only the `setPublished` /
`setPublishEntry` call no-ops. A published nostr event cannot be retracted from relays that have it.

The window is narrow (800 ms) but it is the exact window in which a user who has just seen "Found
POW" appear and changed their mind would act — and during it the Cancel and Skip buttons are hidden
(they live in the `else` branch, lines 133-152), so ESC/overlay is the *only* available action.

**Fix** — same hook as CR-02, extended to cancel the pending publish:

```tsx
const successTimeout = useRef<ReturnType<typeof setTimeout>>();
// ...
(draft) => {
  successTimeout.current = setTimeout(() => onComplete(draft), successDelay);
},
// ...
useUnmount(() => {
  stopMiner.current();
  if (successTimeout.current) clearTimeout(successTimeout.current);
});
```

---

### Warnings

#### WR-01: A rejected `createDraft` is an unhandled rejection — the Post button silently does nothing

**Files:** `src/components/post-modal/index.tsx:145-149` (invoked at `:195`, `:230`),
`src/views/new/note/short-text-form.tsx:144-153` (invoked at `:205`, `:245`)
**Classification:** WARNING — **pre-existing on the non-PoW path, newly extended to the PoW path**

`createDraft` can reject: `finalizeDraft` throws `new Error("No active account")`
(`publish-provider.tsx:126`), `applyClientTag` → `setClient(...)` can reject, and the awaited
`NoteFactory` chain (`await draft`) can reject on malformed content. react-hook-form v7 **rethrows**
from `handleSubmit` — verified at `node_modules/react-hook-form/dist/index.esm.mjs:3028-3029`:

```js
if (onValidError) {
    throw onValidError;
```

Both composers invoke `submit` as a bare event handler (`onClick={submit}`, `onKeyDown`), so the
rejected promise is dropped. There is no global `unhandledrejection` listener in the app — the only
one in the repo is `src/sw/worker/error-handler.ts:94`, inside the service worker, which does not see
window-context rejections.

Result: the Post button's spinner stops and **nothing else happens** — no toast, no error, no mining
screen. In `post-modal` this is total: it has no `try`/`finally`, no loading state, and no error
surface of any kind, so the modal simply sits there. This is most confusing on exactly the path this
change enables, where the user is expecting a mining UI to appear.

`short-text-form` degrades better only by accident — its `finally` clears `loading` before rethrowing,
so the form at least reappears.

**Fix** — give `post-modal` the error surface it lacks, mirroring the sibling composer:

```tsx
const toast = useToast();
const submit = handleSubmit(async (values) => {
  try {
    const unsigned = await createDraft(values);
    if (values.difficulty > 0) setMiningTarget(values.difficulty);
    else await publishPost(unsigned);
  } catch (err) {
    if (err instanceof Error) toast({ description: err.message, status: "error" });
  }
});
```

Note the `await publishPost(unsigned)` added by this change is an improvement and should stay — it
keeps `formState.isSubmitting` true for the duration of the publish, where the previous floating
promise released the button immediately.

---

#### WR-02: `>=` can show "Found POW" before mining starts, hiding Cancel and Skip

**File:** `src/components/pow/mine-pow.tsx:94-97, 120`
**Classification:** WARNING — **aggravated by this change, not introduced**

`bestProgress` is seeded from the **unmined** draft's hash (lines 94-97), but the worker mines a
*different* event: `miner.ts:11-12` appends a `["nonce", ...]` tag before hashing, so the two hashes
are unrelated. If the unmined draft's hash happens to already carry `>= targetPOW` leading zero bits
— probability `2^-targetPOW`, i.e. **50% at difficulty 1**, 25% at 2, ~6% at 4 — the success branch
renders immediately on mount, before a single hash has been mined. It displays a hash that is neither
being mined nor will be published, and because Cancel and Skip live only in the `else` branch (lines
133-152), the user has **no way to abort** until the worker finishes on its own.

That combines badly with the `typeof Worker === "undefined"` branch (lines 68-74), where no workers
are ever started and `onComplete` can never fire: the user is left on a permanent, button-less
"Found POW" screen. Under the old `>` at least the progress screen with its Cancel button rendered.

The strict `>` had the same class of bug (`difficulty > target` on the base hash); `>=` roughly
doubles the probability and adds the exact-equal case. Hence *aggravated*, not introduced.

**Credit where due:** `>=` also *closes* a real pre-existing race. Under `>`, when the mined
difficulty landed exactly on target — the overwhelmingly common outcome — the progress screen stayed
up with live Cancel and Skip buttons for the full 800 ms `successDelay` while `onComplete` was already
scheduled. Clicking Skip in that window called `publishPost(draft)` with the *unmined* draft while the
scheduled `onComplete(minedDraft)` also fired: **two notes published**. Clicking Cancel published a
note the user had just cancelled. The operator change removes that window. Keep it.

**Fix** — gate the success screen on actual completion rather than on a comparison against a
separately-derived seed value:

```tsx
const [complete, setComplete] = useState(false);
// in the miner's onComplete callback, before scheduling the publish:
setComplete(true);
// then:
{complete ? ( /* Found POW */ ) : ( /* Mining POW... */ )}
```

---

#### WR-03: The cached draft is discarded the moment mining begins, not when the note is published

**Files:** `src/views/new/note/short-text-form.tsx:106`, `src/components/post-modal/index.tsx:110`,
mechanism in `src/hooks/use-cache-form.ts:54-63, 66-77`
**Classification:** WARNING — **pre-existing mechanism, made harmful by this change**

`useCacheForm` treats "submitted" as "safely persisted": on unmount and on `beforeunload` it
**removes** the localStorage entry whenever `isSubmitted.current || isSubmitting.current`, and only
saves when `isDirty` and neither flag is set. react-hook-form flips `isSubmitted` to `true` as soon
as `submit` resolves — which on the PoW path is immediately after `setMiningTarget`, i.e. at the
*start* of mining, not after a successful publish.

So for the entire duration of a mine (which at difficulty 20+ can be minutes), the note exists only
in React state: closing the tab, reloading, or navigating away discards it silently. Before this
change the PoW path never reached a long-lived intermediate state, so the window was effectively
zero. This is also the mechanism that makes CR-01 lossy rather than merely annoying.

**Fix** — key the cache-clearing on successful publication rather than on submission. `useCacheForm`
already returns a manual clear callback (lines 81-86); capture it and call it from `publishPost`
after `setPublished(pub)`, and change the teardown condition from `isSubmitted || isSubmitting` to a
caller-supplied "published" flag.

---

### Info

#### IN-01: post-modal's difficulty slider does not mark the form dirty

**File:** `src/components/post-modal/index.tsx:251`
**Classification:** INFO — **pre-existing, newly consequential**

```tsx
onChange={(v) => setValue("difficulty", v)}
```

The sibling composer passes `{ shouldDirty: true, shouldTouch: true }` for the same field
(`short-text-form.tsx:266`). Without `shouldDirty`, changing only the PoW difficulty leaves
`formState.isDirty` false, so `useCacheForm` will not persist the value (`use-cache-form.ts:58`) and
it is lost on unmount. Harmless while the difficulty setting did nothing; now that it selects a
minutes-long mining path, a silently-discarded difficulty is a real surprise.

**Fix:** `onChange={(v) => setValue("difficulty", v, { shouldDirty: true, shouldTouch: true })}`

---

## Verified Clean (checked, no finding)

Recorded so a later reader knows these were examined rather than skipped:

- **The hoist is a move, not a copy.** Exactly one `await createDraft(values)` per composer;
  `setDraft` remains the single writer of `draft`; both render gates are textually unchanged. The
  plan's T-04-34 and T-04-35 mitigations hold.
- **No double-publish from `>=`.** `miningComplete` (`mine-pow.tsx:29`, checked at `:34`) admits
  exactly one `complete` message across all `getNumThreads()` workers, so `onComplete` fires once.
- **No premature success from a progress message.** `miner.ts:25` breaks on `difficulty >= target`,
  so any progress message at or above target is immediately followed by `complete`.
- **Nothing escapes component state on cancel.** `finalizeDraft` performs no signing, no network I/O
  and no store write; signing happens later inside `publishEvent` (`publish-provider.tsx:154`).
- **State-update ordering is safe.** Under React 19's automatic batching `setDraft`/`setMiningTarget`/
  `setLoading("")` collapse into one render; even unbatched, the ordering mounts `MinePOW` exactly
  once with no intermediate flash.
- **aislop baselines independently re-measured:** `post-modal/index.tsx` 3, `short-text-form.tsx` 2,
  `mine-pow.tsx` 0 — unchanged, matching the plan and summary. No finding was introduced or swept.
- **D-12 untouched**, per the out-of-scope directive. CR-02/CR-03 are additive to line 47, not a
  revert of it.

---

_Reviewed: 2026-09-17T15:59:09Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
