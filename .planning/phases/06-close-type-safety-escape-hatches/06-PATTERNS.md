# Phase 6: Close type-safety escape hatches - Pattern Map

**Mapped:** 2026-10-05
**Files analyzed:** ~50 (grouped into 12 pattern families)
**Analogs found:** 11 / 12 (D-06 helper has only RESEARCH.md validated code)

All paths below are relative to `src/`. Line numbers are as of `next` @ `5884dac0a` and drift; re-measure.
RESEARCH.md contains verified, applied-in-scratch-worktree code for every remedy; this map points at the in-repo analog for each shape and does not repeat the full research code.

## File Classification

| New/Modified File(s) | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| 15 service files with `window.X = X` (D-09), `services/debug-api.ts:52` | config/debug | one-shot DEV side effect | `services/debug-api.ts:51` (Reflect.set) | exact |
| `hooks/use-scroll-restore.ts` + 6 `views/notifications/*/index.tsx` (D-10) | hook | request-response (ref callback) | itself (type change); consumers `views/lists/following` | exact |
| `services/database/schema.ts`, `services/database/index.ts` (D-05/06/08) | model/migration | CRUD / startup | none for helper (RESEARCH Pattern 1) | no-analog |
| `services/database/index.ts` `clearCacheData` (D-07) | service | CRUD | same function | exact |
| `services/napplet-shell/adapter.ts`, `common-actions.ts` (D-11) | service/adapter | request-response | `adapter.ts:~60` `Reflect.get(account,"nip44")` style narrow access | role-match |
| `services/wallets/webln.ts`, `types/webln.d.ts` (D-11) | service + type decl | request-response | `types/webln.d.ts` itself | exact |
| `components/webxdc/jsonrpc.ts` (NEW) + `jsonrpc.test.ts` (NEW) | utility + test | transform (untrusted input guard) | `components/webxdc/webxdc.tsx:~107` inline check; test shape `services/napplet-shell/permissions.test.ts` | role-match |
| `views/tools/event-console/process.ts` + `process.test.ts` (NEW) (D-18) | utility + test | transform | `services/wallets/nwc.test.ts` | role-match |
| `services/lookup/vertex.ts` (D-17) | service | request-response | `services/verify-event.ts:32` ignore | role-match |
| `components/magic-textarea.tsx`, `hooks/use-textarea-upload-file.ts`, 4 form files (D-11/12) | component/hook | event-driven | RESEARCH Pattern 5/6 | no repo analog |
| `hooks/use-webxdc.ts`, `use-route-state-value.ts`, `event-publisher/{index.tsx,process.ts}` | hook/util | transform | RESEARCH Pattern 5 | partial |
| `vite-env.d.ts`, `polyfill.ts`, `media-upload/nostr-build.ts` (dead directives) | config | n/a | n/a (delete) | n/a |

## Pattern Assignments

### 15 debug-global files (config, DEV side effect) - D-09

**Analog:** `services/debug-api.ts:51-54` (the precedent to copy)
```typescript
localSettings.enableDebugApi.subscribe((enabled) => {
  if (enabled) Reflect.set(window, "noStrudel", noStrudel);
  // @ts-expect-error debug
  else delete window.noStrudel;
});
```
Target for the delete line: `else Reflect.deleteProperty(window, "noStrudel");` (directive removed).

**Before (typical, `services/pool.ts:78-81`):**
```typescript
if (import.meta.env.DEV) {
  // @ts-expect-error
  window.pool = pool;
}
```
**After:** keep the `if (import.meta.env.DEV)` block, drop the directive, body `Reflect.set(window, "pool", pool);`. Same in `event-store.ts:12-14`. Multi-line cases (`wallets/index.ts`, `event-cache/index.ts` subscribe callback, `loaders.ts` x5 `window.addressLoader = replaceableLoader`) per RESEARCH Pattern 2. Do not move any assignment out of the DEV guard.

---

### `hooks/use-scroll-restore.ts` + 6 notification views (hook) - D-10

**Analog:** the hook itself, `hooks/use-scroll-restore.ts:4` and `:77-90`
```typescript
import { FixedSizeList } from "react-window";
...
  const listRef = useCallback(
    (list: FixedSizeList | null) => {
      ...
          list.scrollTo(parseInt(savedScroll, 10));
    },
    [key],
  );
  return { outerRef, ref: listRef };
```
Change: delete the `FixedSizeList` import; add a local `type ScrollableList = { scrollTo(scrollOffset: number): void }` with a doc comment; callback param becomes `ScrollableList | null`. Then delete `as any` from `ref={scroll.ref as any}` in the six notification views. Verify `views/lists/following`, `files`, `lists/muted`, `articles` still compile.

---

### `services/database/{schema,index}.ts` (model/migration) - D-05/06/08

**No in-repo analog for the helper**; copy RESEARCH.md Pattern 1 verbatim (type aliases `Omit<Prev,K> & {...}`, `atSchema<Schema>` with the single `as unknown as` behind the ignore). Note D-05 wording: schemas are assignable to `DBSchema` via type aliases, NOT literal `extends DBSchema` (RESEARCH Pitfall 1). Also add `indexes: { created: number }` to v6 `channelMetadata`; change `string[]` store-name args to `StoreNames<Schema>[]`.

**Current import to extend** (`services/database/index.ts:1`):
```typescript
import { openDB, deleteDB, IDBPDatabase, IDBPTransaction } from "idb";
```
**D-08 site** (`index.ts:~105-120`, replace the `@ts-ignore` + `delete`):
```typescript
const newAccount: SchemaV5["accounts"]["value"] = {
  ...account,
  connectionType: account.useExtension ? "extension" : undefined,
};
// @ts-ignore
delete newAccount.useExtension;
```
-> `const { useExtension, ...rest } = account; const newAccount = { ...rest, connectionType: useExtension ? "extension" : undefined };`

**Ordering constraint (RESEARCH Pitfall 3):** schema alias conversion + channelMetadata index + `atSchema` + removal of all 16 casts must be ONE commit. D-07, D-08 and the `window.db` Reflect.set land before it.

**D-07 (own commit)** `index.ts:220-232`: replace
```typescript
  log("Clearing dnsIdentifiers");
  await db.clear("dnsIdentifiers");
```
with `log("Clearing identities"); await db.clear("identities");` (store deleted in v12; successor is `identities`).

---

### `services/napplet-shell/adapter.ts`, `common-actions.ts` (adapter) - D-11

**Analog:** same file, `adapter.ts:~60` uses `Reflect.get(account, "nip44")` for narrow untyped access; current cast at `:73`:
```typescript
const poolLike = pool as unknown as RelayPoolLike;
```
Replace with the explicit adapter object and `toRelayFilters` from RESEARCH Pattern 4 (use param name `f`, not `filter`, which shadows the rxjs import; omit optional `count`; `publish: async` to keep rejection semantics). `common-actions.ts:172`: delete both casts per RESEARCH table.

---

### `services/wallets/webln.ts` + `types/webln.d.ts` - D-11

**Analog:** `types/webln.d.ts` (whole file, augmentation to extend)
```typescript
import { WebLNProvider } from "webln";
declare global {
  interface Window {
    webln?: WebLNProvider & {
      enabled?: boolean;
      isEnabled?: boolean;
      lnurl?: (lnurl: string) => Promise<{ paymentHash: string; preimage: string }>;
    };
  }
}
```
Add `getBalance?: () => Promise<{ balance: number }>;` to the intersection. In `wallets/webln.ts:57-63` replace `(window as unknown as { webln?: ... }).webln` with `window.webln`, delete the local `WebLNProvider` interface (lines ~50-54), and fix `getWebln()` return type.

---

### `components/webxdc/jsonrpc.ts` (NEW) + `jsonrpc.test.ts` (NEW) + `webxdc.tsx:~107` - D-11/D-14

**Analog (code to replace)** `components/webxdc/webxdc.tsx:104-113`:
```typescript
function onMessage(event: MessageEvent) {
  if (event.origin !== origin) return;
  if (event.source !== iframeRef.current?.contentWindow) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg = event.data as any;
  if (!msg || msg.jsonrpc !== "2.0") return;
```
Keep origin/source checks first. New guard: RESEARCH Pattern 4 (`isWebxdcMessage(data: unknown)`), in a dependency-free module so vitest node env can import it. Widen handler `id`/`method` params to `unknown` (D-15).

**Test file shape analog:** `services/napplet-shell/permissions.test.ts:1-3` and `services/wallets/nwc.test.ts:1-3,~15-25`
```typescript
import { describe, expect, it } from "vitest";
import { isWebxdcMessage } from "./jsonrpc";

describe("isWebxdcMessage", () => { it("...", () => { expect(...).toBe(true); }); });
```
Colocated `*.test.ts` (vitest `include: ["src/**/*.test.ts"]`, `environment: "node"`, standalone `vitest.config.ts` at repo root). Modules with DOM/top-level-await imports need `vi.mock` (see `nwc.test.ts:6-8`: `vi.mock("../preferences", () => ({ default: {} }))`) or must be kept dependency-free.

---

### `views/tools/event-console/process.ts` + `process.test.ts` (NEW) - D-18

**Analog (code to replace)** `process.ts:6-22`: the `// @ts-expect-error` + `.subtract(parseInt(match[2]), match[3] || "h")` / `.add(...)` pair.
Add `parseTimeUnit(letter: string | undefined): ManipulateType`, but per **D-18 (supersedes RESEARCH Open Question 2 / its preserve-quirk table)** map case-insensitively: `h`->hour, `w`->week, `m`->minute, `s`->second, `d`->day, undefined->hour (e.g. `UNITS[letter.toLowerCase()] ?? "h"`; regex already restricts to `[hwmsd]`). Do NOT use RESEARCH's `M -> "M"`/`"ms"` table. Own commit. Test pins every letter in both cases plus `processDateString("n-2d")` within 1s of `dayjs().unix() - 2*86400`, and `expect(() => processDateString("tomorrow")).toThrow()`. Import dayjs `ManipulateType` as `import dayjs, { ManipulateType } from "dayjs";`. `process.ts` imports only dayjs/nostr-tools so it is node-testable.

---

### `services/lookup/vertex.ts:36` - D-17 (no code change except ignore)

**Analog:** rule-scoped ignore with reason, `services/verify-event.ts:31`:
```typescript
// aislop-ignore-next-line ai-slop/thin-wrapper -- indirects over the module-level verifyEventMethod, which updateVerifyMethod reassigns at runtime ...; inlining would bind callers ...
export default function verifyEvent(event: NostrEvent) {
```
Apply: `// aislop-ignore-next-line ai-slop/unsafe-type-assertion -- <stored preference can hold values outside SortMethod (settings offers userPagerank/followDistance) and the Vertex integration is slated for replacement by the Open-Ranking protocol API>` directly above the `as any` line. No guard, no fallback, no vertex-sort module or test (RESEARCH Open Question 1 / its recommended guard is overruled by D-17).

---

### Remaining per-site remedies (use RESEARCH.md tables directly)

No close in-repo analog; RESEARCH Pattern 5 has verified code for: `use-route-state-value.ts:29` (`isSetter` predicate), `group-message-form.tsx:28` / `picture-post-form.tsx:43` (explicit `useCacheForm<...>` generic; do not touch `use-cache-form.ts`), `hooks/use-textarea-upload-file.ts` (`ClipboardEventHandler<HTMLTextAreaElement | HTMLInputElement>`, fixes `media-post-comment-form.tsx:54` and `stream-chat-form.tsx:56`), `event-publisher/index.tsx:263` (destructure `sig`), `event-publisher/process.ts:83` (`UnsignedEvent & { id: string }`), `use-webxdc.ts` (`useState<NostrEvent[]>`), `magic-textarea.tsx` (`Omit<TextareaProps,"color">` + `innerRef: ref ? ... : undefined`; one surviving directive on `MagicInput`). Deletions: `vite-env.d.ts` `virtual:pwa-register/react` block, `polyfill.ts:3`, `media-upload/nostr-build.ts:44` directives.

## Shared Patterns

### Surviving directive form (D-12)
**Source:** RESEARCH Pattern 6 + `services/verify-event.ts:31` for the ignore style
**Apply to:** the single `MagicInput` directive in `components/magic-textarea.tsx`
```tsx
// aislop-ignore-next-line ai-slop/ts-directive -- <why the library typing cannot express it>
// @ts-expect-error -- <same fact, TS-side>
<ReactTextareaAutocomplete ... />
```
Always `@ts-expect-error`, never `@ts-ignore`. Ignore line directly above the directive line.

### Cast ignore with reason
**Apply to:** `atSchema` in `services/database/index.ts`, `vertex.ts`
`// aislop-ignore-next-line ai-slop/<rule> -- <reason meeting the P4 D-08 bar>`. Expected final grep inventory: 3 ignores (atSchema double-assertion, MagicInput ts-directive, vertex unsafe-type-assertion) now that D-17 keeps vertex's. RESEARCH's "exactly 2" count is superseded.

### Verification
`pnpm build` (tsc + vite) after every task; `pnpm test`; rescan 68 -> N via the RESEARCH command (run from main checkout). Per-site greps in RESEARCH "Rescan command".

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `services/database/index.ts` `atSchema` helper | utility | type-level | No historical-schema view helper exists; use RESEARCH Pattern 1 |
| `components/magic-textarea.tsx` props typing | component | event-driven | Library-generic workaround; use RESEARCH Pattern 5 |

## Metadata

**Analog search scope:** `services/`, `hooks/`, `components/webxdc/`, `types/`, `views/tools/event-console/`, `vitest.config.ts`
**Files scanned:** ~15 read in full or in part; remaining sites rely on RESEARCH verified patches
**Pattern extraction date:** 2026-10-05
