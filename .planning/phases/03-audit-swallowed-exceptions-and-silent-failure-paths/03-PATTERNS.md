# Phase 3: Audit swallowed exceptions and silent failure paths - Pattern Map

**Mapped:** 2026-09-14
**Files analyzed:** 33 (all modified, zero created)
**Analogs found:** 33 / 33 — every file maps to one of six remedy exemplars below

This phase modifies 33 existing files; it creates none. The authoritative file list, line numbers,
and remedy assignment come from `03-RESEARCH.md` §"Baseline Re-Measurement" → "Full per-file bucket-B
breakdown" — reproduced in the classification table below. Because every site is a remedy applied to
an existing catch block rather than a new structural file, the useful "analog" here is an in-repo
exemplar of each remedy shape already written correctly (or, for the one near-miss, written almost
correctly) — not a structurally similar sibling file.

## File Classification

All 33 files are role `utility`/`service`/`component`/`hook` performing an inline error-handling
edit; data flow is `transform` (parse/filter guards) or `request-response` (user actions, fallbacks,
logging). Grouped by remedy category, each mapped to its exemplar:

| Remedy | Sites | Count | Exemplar |
|--------|-------|-------|----------|
| D-05 parse/filter guard (comment + explicit return/continue) | see list below | 18 | `src/helpers/parse.ts` shape (see Probe in RESEARCH.md); near-miss `src/components/relay-url-input.tsx:62` |
| D-09 user action → `useAsyncAction` | `cashu/mint-control.tsx:28`, `relay-control.tsx:27`, `enable-with-delete.tsx:32` | 3 | `src/hooks/use-async-action.ts` |
| D-10 best-effort fallback (log, stay silent) | `invoice-modal-provider.tsx:34`, `pay-step.tsx:171`, `blob-details-modal.tsx:146/153`, `qr-code-scanner-button.tsx:48` | 4 (5 lines) | `src/services/event-cache/index.ts:40` (target) vs `:55` (already-correct sibling) |
| D-12 namespaced logger setup | `services/event-cache/index.ts:40` | 1 (shared with D-10) | `src/helpers/debug.ts` + `event-cache/index.ts:16` + `native-scanner.ts:6` |
| D-11 delete unreachable catch, render hook's `error` | `decrypt-placeholder.tsx:23` | 1 | `src/hooks/use-legacy-message-plaintext.ts` |
| D-13/14/15 strays | `sqlite/index.ts:39,54`, `native-scanner.ts:15`, `use-timeline-cache-key.ts:14`, `index.tsx:49` | 4 | see per-stray notes below |

### D-05 full file list (18 sites — same remedy shape, no distinct analog needed beyond the exemplar)

`helpers/parse.ts:4`, `helpers/nip19.ts:11`, `components/content/transform/bip-notation.ts:42`,
`components/content/transform/nip-notation.ts:42`, `helpers/nostr/goal.ts:105`,
`services/lnurl-metadata.ts:31`, `hooks/use-open-graph-data.ts:34`, `hooks/use-cache-form.ts:48`,
`views/tools/event-publisher/index.tsx:74`, `components/debug-modal/event-tags.tsx:74`,
`components/lightning/inline-invoice-card.tsx:32`, `views/lists/components/list-history-modal.tsx:319`,
`views/wallet/components/receive-token-modal.tsx:36`,
`views/streams/stream/components/stream-top-zappers.tsx:19`, `components/app-handler-modal/index.tsx:138`,
`components/relay-url-input.tsx:62`, `views/settings/cache/database/components/import-events-button.tsx:22`,
`helpers/nostr/dms.ts:31` (loop variant — `continue` instead of `return`).

### Wave 1 (risk-first, D-02) — distinct per-site remedies, mapped individually

`classes/encrypted-storage.tsx:171` (D-05 shape, optionally + D-12 log),
`services/decryption-cache.ts:95` (D-10/D-12 shape — best-effort loop),
`helpers/nostr/dms.ts:31` (D-05 shape, `continue` variant),
`components/blob-details-modal.tsx:146/153` (D-10 shape),
`views/messages/chat/components/decrypt-placeholder.tsx:23` (D-11 — delete the catch).

## Pattern Assignments

### D-05 — parse/filter guard (18 sites)

**Exemplar (correct shape, confirmed live by aislop probe in RESEARCH.md):**

```typescript
export function safeUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch {
    // invalid URL string; callers already treat undefined as "no URL"
    return undefined;
  }
}
```

**Near-miss exemplar — what's missing:** `src/components/relay-url-input.tsx:62` (read directly):

```typescript
// Normalize the value (add wss:// if missing) and notify the form of the change
const normalizeValue = (event: { currentTarget: HTMLInputElement }) => {
  const value = event.currentTarget.value;
  if (!value) return;

  try {
    const normalized = normalizeRelayUrl(value);
    if (normalized !== value) {
      event.currentTarget.value = normalized;
      onChange?.(event as ChangeEvent<HTMLInputElement>);
    }
  } catch (err) {
    // Ignore invalid URLs, let form validation handle them
  }
};
```

This already has a good reason comment and still fires `ai-slop/swallowed-exception` — confirmed live:
a comment alone never clears the rule; it needs an explicit `return;` statement added inside the catch
body (the function's own early-`return` on empty value shows the idiom already used elsewhere in this
same file). Fix: add `return;` right after the comment, binding stays unused → bare `catch {`.

**For the one loop-shaped D-05 site** (`helpers/nostr/dms.ts:31`, inside a `for` loop, not a function
body) the equivalent of `return` is `continue`:
```typescript
for (const message of messages) {
  try {
    const sender = getDMSender(message);
    const recipient = getDMRecipient(message);
    // ...
  } catch (e) {} // <- rewrite to: reason comment + `continue;`, bare `catch {`
}
```

**Rule for all 18 sites:** reason comment (free-form, D-08) + explicit `return`/`continue` inside the
catch body + bare `catch {` if the binding is unused (D-06).

---

### D-09 — user-triggered action → `useAsyncAction` (3 sites)

**Analog (the hook itself):** `src/hooks/use-async-action.ts` (full file, 29 lines):

```typescript
import { useToast } from "@chakra-ui/react";
import { DependencyList, useCallback, useRef, useState } from "react";

export default function useAsyncAction<Args extends Array<any>, T = any>(
  fn: (...args: Args) => Promise<T>,
  deps: DependencyList = [],
): { loading: boolean; run: (...args: Args) => Promise<T | undefined> } {
  const ref = useRef(fn);
  ref.current = fn;

  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const run = useCallback<(...args: Args) => Promise<T | undefined>>(async (...args: Args) => {
    setLoading(true);
    try {
      const result = await ref.current(...args);
      setLoading(false);
      return result;
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
      console.log(e);
    }
    setLoading(false);
  }, deps);

  return { loading, run };
}
```

Note the hook re-captures the latest closure via `ref.current = fn` every render, independent of the
`deps` array — `deps` only affects the identity of `run`. This is why `[onRemove]` in the before/after
below is both correct and safe even though neither caller memoizes today.

**Target before** (`src/components/cashu/mint-control.tsx:21-29`, read directly):

```typescript
export default function MintControl({ url, onRemove, children, details }: PropsWithChildren<{...}>) {
  const info = use$(cashuMintInfo(url));
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    setLoading(true);
    try {
      await onRemove();
    } catch (error) {}
    setLoading(false);
  };
  // ... <IconButton ... onClick={remove} isLoading={loading} />
```

**After (apply identically to `relay-control.tsx:23-29`, byte-for-byte same shape per RESEARCH.md):**

```typescript
import useAsyncAction from "../../hooks/use-async-action";
// ...
const remove = useAsyncAction(async () => {
  await onRemove();
}, [onRemove]);
// ...
<IconButton ... onClick={remove.run} isLoading={remove.loading} />
```

**Third site is a variant — no local `loading` state at all** (`enable-with-delete.tsx:28-33`):

```typescript
// before
const wipeDatabase = useCallback(async () => {
  try {
    await wipe();
    location.reload();
  } catch (error) {}
}, []);

// after
const wipeDatabase = useAsyncAction(async () => {
  await wipe();
  location.reload();
}, [wipe]);
// ... <MenuItem ... onClick={wipeDatabase.run}>Clear Database</MenuItem>
```

---

### D-10 — best-effort fallback (log the cause, stay silent) (4 sites, 5 catch blocks)

**Exemplar of the correct shape already in-repo:** `src/services/event-cache/index.ts:52-58`
(the already-correct sibling loop):

```typescript
try {
  return await loadEventCacheModule(type);
} catch (error) {
  log("Failed to load event cache, going to fallbacks", error);

  for (const fallback of FALLBACKS) {
    try {
      return await loadEventCacheModule(fallback);
    } catch (error) {
      log("Failed to load fallback", fallback, error);
    }
  }
}
```

**The sibling that needs the fix** — same file, line 40 (D-12 target, part of the same function):

```typescript
if (type === null) {
  log("No event cache type provided, using fallbacks");
  for (const fallback of FALLBACKS) {
    try {
      return await loadEventCacheModule(fallback);
    } catch (error) {}   // <- line 40: match the :55 sibling's shape exactly
  }
  return null;
}
```

Fix is literally: `catch (error) { log("Failed to load fallback", fallback, error); }` — copy the
:55 sibling verbatim.

**Apply the same "log inside each catch, keep control flow" shape to:**

- `components/blob-details-modal.tsx:146` and `:153` (already inside a `useAsyncAction`-wrapped
  handler — only the per-attempt catches need a log call, the outer throw/toast already exists):
  ```typescript
  try {
    blob = await fetch(url).then((res) => res.blob());
  } catch (error) {
    log("Failed to fetch blob directly", url, error);
  }
  // ...
  try {
    blob = await downloadBlob(server, hash).then((res) => res.blob());
    if (blob) break;
  } catch (error) {
    log("Failed to download from server", server, error);
  }
  ```
- `providers/route/invoice-modal-provider.tsx:34` (WebLN fails → manual modal) — same shape, one log
  call inside the existing catch.
- `components/event-zap-modal/pay-step.tsx:171` (per-invoice failure → leave for manual payment) —
  same shape.
- `components/qr-code/qr-code-scanner-button.tsx:48` (user cancel, already commented) — same shape,
  add the log call alongside the existing comment.
- `services/decryption-cache.ts:95` (best-effort cache-size sampling loop, Wave 1) — same shape:
  ```typescript
  try {
    const value = await kv.getItem(keys[i]);
    if (value) { estimatedSize += new Blob([JSON.stringify(value)]).size; }
  } catch (e) {
    log("Failed to read cache entry for size estimate", keys[i], e);
  }
  ```

---

### D-12 — namespaced logger setup (module-level pattern for all D-10/D-12 sites)

**Analog 1 — the logger itself:** `src/helpers/debug.ts` (full file, 3 lines):

```typescript
import debug from "debug";

export const logger = debug("noStrudel");
```

**Analog 2 — consumer #1** `src/services/event-cache/index.ts:5,16`:

```typescript
import { logger } from "../../helpers/debug";
// ...
const log = logger.extend(`event-cache`);
```

**Analog 3 — consumer #2** `src/components/qr-code/native-scanner.ts:4,6`:

```typescript
import { logger } from "../../helpers/debug";
// ...
const log = logger.extend("NativeQrCodeScanner");
```

**Naming convention:** kebab-case matching the module/service name for services (`event-cache`),
PascalCase matching the component/feature name for components (`NativeQrCodeScanner`,
`BlobRepair` per RESEARCH.md's suggested name for `blob-details-modal.tsx`). Each new site needing a
logger should add `import { logger } from "<relative-path>/helpers/debug";` plus one
`const log = logger.extend("<Name>");` at module scope, then call `log(...)` inside the catch instead
of adding a bare comment.

---

### D-11 — delete unreachable catch, render hook's existing `error` (1 site)

**Analog — the hook, `src/hooks/use-legacy-message-plaintext.ts` (full file, 33 lines):**

```typescript
export function useLegacyMessagePlaintext(event: NostrEvent) {
  const eventStore = useEventStore();
  const account = useActiveAccount()!;

  const [error, setError] = useState<Error>();
  const plaintext = use$(/* ... */);

  const unlock = useCallback(async () => {
    try {
      setError(undefined);
      await unlockLegacyMessage(event, account.pubkey, account);
    } catch (error) {
      setError(error as Error);   // caught and stored, NEVER rethrown
    }
  }, [event, account]);

  return { error, plaintext, unlock };
}
```

`unlock()` cannot reject — the target component's own outer try/catch is dead code.

**Target before** (`decrypt-placeholder.tsx:19-24`):

```typescript
const { unlock, plaintext, error } = useLegacyMessagePlaintext(message);
const decrypt = async () => {
  setLoading(true);
  try {
    await unlock();
  } catch (e) {}
  setLoading(false);
};
```

**After** — delete the try/catch, rely on the `if (error)` branch already rendered two lines below
(component already destructures `error`, no new state/UI/toast needed):

```typescript
const decrypt = async () => {
  setLoading(true);
  await unlock();
  setLoading(false);
};
```

---

### D-13/14/15 — strays

**`services/sqlite/index.ts:39,54`** — `redundant-try-catch` in already-`async` functions. No
external analog needed; the fix is deletion, not pattern-copying:

```typescript
// before
export async function openConnection(...): Promise<SQLiteDBConnection> {
  try {
    // ...
    return db;
  } catch (err) {
    return Promise.reject(err);
  }
}
// after — async fn already returns a rejected promise on uncaught throw
export async function openConnection(...): Promise<SQLiteDBConnection> {
  // ...
  return db;
}
```

Same shape for `deleteDatabase` at line 54. **Scope the diff narrowly to lines 18-57** (both function
bodies) — do NOT touch lines 1-16 (module-level `throw` and dead code beneath it), which is Phase 4's
target in the same file.

**`components/qr-code/native-scanner.ts:15`** — real refactor, not a lint tweak. Full file read
(lines 1-40+ above); no in-repo example exists of "register a listener, return a promise, without an
async executor" in this exact shape, so RESEARCH.md's suggested hoist is the fix (hoist
`addListener(...)` outside the `Promise` constructor via `.then`, guard `sub?.remove()`):

```typescript
await new Promise<void>((res, rej) => {
  let sub: Awaited<ReturnType<typeof BarcodeScanner.addListener>> | undefined;
  BarcodeScanner.addListener("googleBarcodeScannerModuleInstallProgress", (event) => {
    switch (event.state) {
      case GoogleBarcodeScannerModuleInstallState.COMPLETED: sub?.remove(); res(); break;
      case GoogleBarcodeScannerModuleInstallState.FAILED: sub?.remove(); rej(new Error("Failed to install")); break;
      case GoogleBarcodeScannerModuleInstallState.CANCELED: sub?.remove(); rej(new Error("Canceled install")); break;
      // PENDING / DOWNLOADING / DOWNLOAD_PAUSED / INSTALLING: log(...) only
    }
  }).then((handle) => { sub = handle; });
});
```

Flag this as its own task with a larger review surface than the other three strays.

**`hooks/timeline/use-timeline-cache-key.ts:14`** — false positive, rule-scoped ignore. Analog for
the ignore directive syntax — the only existing usage in the repo, `src/sw/client/error-logger.ts:1`:

```typescript
// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output
```

For this site use `aislop-ignore-next-line` (not `-file`, since only one line needs it) directly above
the flagged `return cacheKey || fallback` line, naming the rule (`ai-slop/hidden-fallback`) and a
reason stating the value is a stable first-render fallback, not a failure:

```typescript
// aislop-ignore-next-line ai-slop/hidden-fallback -- stable first-render fallback until the effect writes cacheKey into route state; nothing is failing
return cacheKey || fallback;
```

**`src/index.tsx:49`** — `silent-recovery` (warning) + `swallowed-exception` (error) + unused `(e)`
binding, all on one line. Fix combines D-12 (namespaced logger) + D-06 (bare catch) in one edit:

```typescript
// before (approximate shape per RESEARCH.md)
try {
  navigator.registerProtocolHandler("web+nostr", "...");
} catch (e) {
  console.log(e);   // silent-recovery + console-leftover
}
// after
const log = logger.extend("index");
// ...
try {
  navigator.registerProtocolHandler("web+nostr", "...");
} catch (error) {
  log("Failed to register web+nostr protocol handler", error);
}
```

## Shared Patterns

### Namespaced logger (applies to all D-10/D-12/D-15 sites + optionally Wave-1 `encrypted-storage.tsx`)

**Source:** `src/helpers/debug.ts` (3-line file) + naming convention from
`src/services/event-cache/index.ts:16` and `src/components/qr-code/native-scanner.ts:6`.

```typescript
import { logger } from "<relative-path-to>/helpers/debug";
const log = logger.extend("<ModuleOrComponentName>");
```

Silent in production unless the namespace is enabled; does not trip `ai-slop/console-leftover`
(kept on by Phase 2 D-07). Do not use `console.warn`/`console.error` in any of these fixes.

### `useAsyncAction` for user-triggered actions

**Source:** `src/hooks/use-async-action.ts` (full file above). Apply to `mint-control.tsx`,
`relay-control.tsx`, `enable-with-delete.tsx`. Toasts only `e instanceof Error`; delete any
hand-rolled `loading` state and replace with `.loading` from the hook's return value.

### Explicit return/continue inside catch (parse guards)

**Source:** live-probed pattern (see RESEARCH.md Probe Re-Verification); confirmed a comment alone
never clears `ai-slop/swallowed-exception` — every one of the 18 D-05 sites plus the Wave-1
`encrypted-storage.tsx:171` and `dms.ts:31` sites need an explicit `return`/`continue` added, not just
a comment.

### Rule-scoped ignore directive syntax

**Source:** `src/sw/client/error-logger.ts:1` (only existing usage in the repo):
```typescript
// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output
```
Must name the rule and end with `-- reason` (`AGENTS.md` lines 173-179, "Inline ignores"). Bare
directives are disallowed. Used once in this phase, at `use-timeline-cache-key.ts:14`, as
`aislop-ignore-next-line` (not `-file`, since only one line is a false positive).

### AGENTS.md insertion point for D-03

**Source:** `AGENTS.md` lines 114-131:
```markdown
### Error Handling

#### Error Boundaries

...ErrorBoundary example...

#### Error Patterns

- Use `ErrorBoundary` wrapper for critical sections
- Use Chakra UI `useToast` for user-facing errors
- Type-check errors: `if (e instanceof Error)`

### State Management
```
D-03's new convention text belongs as a new subsection inserted after "#### Error Patterns" (line
131) and before "### State Management" (line 132) — e.g. add a "#### Swallowed Exceptions" or extend
"#### Error Patterns" with the parse-guard / `useAsyncAction` / namespaced-logger rules from D-05
through D-12 above.

## No Analog Found

None — every one of the 33 files maps to one of the six remedy exemplars above; there is no file in
this phase's scope without an applicable in-repo pattern to copy.

## Metadata

**Analog search scope:** `src/helpers/`, `src/services/event-cache/`, `src/hooks/`,
`src/components/qr-code/`, `src/components/relay-url-input.tsx`, `src/sw/client/error-logger.ts`,
`AGENTS.md`
**Files scanned (exemplars, read in full or targeted range):** `src/helpers/debug.ts`,
`src/hooks/use-async-action.ts`, `src/hooks/use-legacy-message-plaintext.ts`,
`src/services/event-cache/index.ts`, `src/components/qr-code/native-scanner.ts`,
`src/components/relay-url-input.tsx`, `src/components/cashu/mint-control.tsx`,
`src/sw/client/error-logger.ts`, `AGENTS.md`
**Pattern extraction date:** 2026-09-14
