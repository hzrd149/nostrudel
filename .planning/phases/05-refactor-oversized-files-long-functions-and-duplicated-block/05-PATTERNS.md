# Phase 5: Refactor oversized files, long functions, and duplicated blocks - Pattern Map

**Mapped:** 2026-09-24
**Files analyzed:** ~24 (new module destinations + extraction/edit targets named in D-05..D-15)
**Analogs found:** 19 / 24 (5 have no in-repo precedent — see § No Analog Found)

This is a relocation/refactor phase, not a greenfield feature phase. Most of the value below is
**module-shape conventions** (export style, logger usage, barrel pattern) rather than "closest
business-logic analog," since the source code already exists and only needs a house-style
destination. Line ranges for what moves where are in CONTEXT.md/RESEARCH.md — **not re-derived
here.**

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/services/napplet-shell/permissions.ts` | service (pure state module) | CRUD (in-memory map + localStorage) | `src/services/event-cache/index.ts` (module shape) + `src/hooks/timeline/use-timeline-cache-key.ts` (localStorage/state pattern) | role-match |
| `src/services/napplet-shell/window-identities.ts` (or folded into permissions.ts) | service | CRUD | same as above | role-match |
| `src/services/napplet-shell/intent-service.ts` | service | request-response | `src/services/napplet-intent-delivery.ts` (sibling, untouched but same domain) | role-match |
| `src/services/napplet-shell/common-actions.ts` | service | CRUD / event-driven | `src/services/notifications/common.ts` | role-match |
| `src/services/napplet-shell/upload-service.ts` | service | file-I/O | none close; `src/services/napplet-shell-provider.tsx:512-556` is the source itself | source-only |
| `src/services/napplet-shell/resource-service.ts` | service | request-response | `src/services/event-cache/index.ts` (runtime backend selection shape) | role-match |
| `src/services/napplet-shell/relay-tiers.ts` | service (pure helpers) | transform | `src/helpers/nostr/relay-stats.ts` (pre-deletion, small pure-helpers file shape) | role-match |
| `src/services/napplet-shell/adapter.ts` | service (composition root) | event-driven | `src/services/event-cache/index.ts` (composes multiple backend modules behind one surface) | role-match |
| `src/providers/global/napplet-shell-provider.tsx` (thinned) | provider | request-response | itself (before/after) | exact (same file) |
| `src/components/napplets/consent-modal.tsx` | component | request-response | `src/components/napplets/napplet-info-drawer.tsx` (sibling modal/drawer in same dir) | exact |
| `src/components/napplets/intent-choice-modal.tsx` | component | request-response | `src/components/napplets/napplet-menu.tsx` / `napplet-frame.tsx` | exact |
| `src/services/wallets/types.ts` | model (types-only) | — | `src/services/event-cache/interface.ts` | role-match |
| `src/services/wallets/webln.ts` | service (backend) | event-driven | `src/services/event-cache/local-relay.ts` (one interchangeable backend module) | exact |
| `src/services/wallets/nwc.ts` | service (backend) | event-driven | `src/services/event-cache/hosted-relay.ts` | exact |
| `src/services/wallets/nutwallet.ts` | service (backend) | event-driven | `src/services/event-cache/nostr-idb.ts` | exact |
| `src/services/wallets/index.ts` | service (barrel / composition + state) | CRUD, pub-sub | `src/services/event-cache/index.ts` and `src/services/database/index.ts` | exact |
| `src/hooks/use-webxdc.ts` sub-hooks (extracted) | hook | event-driven | `src/hooks/use-async-action.ts` (hook module shape, default export, typed return object) | role-match |
| `src/components/post-modal/index.tsx` `renderBody` extraction | component (internal helper) | transform | in-file (PascalCase internal JSX helper convention) | n/a — convention only |
| `src/components/webxdc/webxdc.tsx` `handleRequest` extraction | component (internal helper) | request-response | in-file | n/a — convention only |
| `src/views/settings/background-worker/cached-files-card.tsx` (D-07 conversion) | component | request-response | `src/components/napplets/napplet-menu.tsx` (`useAsyncAction` call-site pattern) | exact |
| `src/views/settings/background-worker/service-worker-status-card.tsx` (D-07 conversion) | component | request-response | same as above | exact |
| `src/sw/client/error-logger.ts` (D-05 extraction) | utility | transform | itself — shows the exact working `aislop-ignore-file` syntax | exact |
| `vitest.config.ts` (new, repo root) | config | — | `vite.config.ts` (sibling root config, but explicitly NOT extended — see RESEARCH.md) | analogous-but-standalone |
| `*.test.ts` files (first ever) | test | — | none in repo | no precedent |
| `helpers/nostr/relay-stats.ts` (D-13 deletion) | utility | transform | itself | exact (edit in place) |

## Pattern Assignments

### `src/services/napplet-shell/*.ts` (service modules, D-08 split)

**Analog:** `src/services/event-cache/index.ts` (module shape: logger, runtime composition) and
`src/services/notifications/common.ts` (rxjs-composed service submodule imported by a barrel).

**Imports pattern** (`src/services/event-cache/index.ts:1-8`):
```typescript
import { Filter, NostrEvent } from "nostr-tools";
import { BehaviorSubject, bufferTime, EMPTY, filter, Observable, Subject, timeout } from "rxjs";

import { CAP_IS_NATIVE, WASM_RELAY_SUPPORTED } from "../../env";
import { logger } from "../../helpers/debug";
import { wrapInTimeout } from "../../helpers/promise";
import localSettings from "../preferences";
import { EventCache } from "./interface";
```
Relative imports throughout (no `~/` alias) — matches `AGENTS.md` §"Import Organization" and
CONVENTIONS.md. New `services/napplet-shell/*` modules must import sibling services the same way
(`../pool`, `../event-store`, etc.), exactly as they do today inside
`napplet-shell-provider.tsx` — do not rewrite to `~/`.

**Logger pattern** (`src/services/event-cache/index.ts:16` and `src/services/wallets.ts:20,27`):
```typescript
import { logger } from "../../helpers/debug"; // or "../helpers/debug" one level up
const log = logger.extend(`event-cache`);
```
Every new `services/napplet-shell/*.ts` module should declare its own
`const log = logger.extend("napplet-shell:<module>")` (or similar), not share one logger across
files. `src/helpers/debug.ts` is a 3-line file — nothing to extract beyond this one line:
```typescript
// src/helpers/debug.ts (full file)
import debug from "debug";
export const logger = debug("noStrudel");
```

**Composition-root / runtime-selection pattern** (`src/services/event-cache/index.ts:18-29`):
```typescript
async function loadEventCacheModule(type: string): Promise<EventCache | null> {
  log(`Loading event cache module: ${type}`);
  if (type === "none") return null;
  else if (type === "wasm-worker" && WASM_RELAY_SUPPORTED) return await import("./wasm-worker").then((m) => m.default);
  else if (type === "native-sqlite") return await import("./native-sqlite").then((m) => m.default);
  ...
}
```
`adapter.ts` (the D-08 composition root, RESEARCH.md's "calls into all of the above") should
follow this same "import sibling modules, call their factory functions, wire them together"
shape rather than inlining logic — it mirrors how `event-cache/index.ts` composes its backends.

**Pure state module pattern for `permissions.ts`:** no direct analog exists for a
Map-plus-localStorage pure module in this codebase; the closest available shape is
`use-timeline-cache-key.ts`'s minimal localStorage-adjacent read/fallback style (via
`useRouteStateValue`, which itself is a hook, not a plain module) — treat `permissions.ts` as a
new pattern for this codebase (first pure non-React state module with a public
grant/revoke/read API), following RESEARCH.md Pattern 2's prescription: encapsulate
`approvedCapabilities` fully behind named functions (`hasApprovedCapability`,
`grantCapabilities`, and the new `revokeCapabilities`), never export the raw `Map`.

### `src/components/napplets/consent-modal.tsx` / `intent-choice-modal.tsx` (D-09)

**Analog:** `src/components/napplets/napplet-frame.tsx` (import block, default export shape) and
`src/components/napplets/napplet-menu.tsx` (small focused component + `useAsyncAction`).

**Imports pattern** (`napplet-frame.tsx:1-32`):
```typescript
import { Alert, AlertDescription, AlertIcon, Box, Button, ButtonGroup, Flex, IconButton, Spinner, Tooltip, useDisclosure } from "@chakra-ui/react";
import { CloseIcon, RepeatIcon } from "@chakra-ui/icons";
import { NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useRef, useState } from "react";
...
import Menu01 from "../icons/menu-01";
import SimpleView from "../layout/presets/simple-view";
import Timestamp from "../timestamp";
import NappletInfoDrawer from "./napplet-info-drawer";
import { ... } from "../../helpers/nostr/napplets";
import { useNappletShell } from "../../providers/global/napplet-shell-provider";
```
Chakra components grouped first, then icons, then React, then relative project imports
(components before helpers before providers/services) — the new modal components should follow
this exact grouping order. Note the modals will still import `useNappletShell` from the
(now-thinned) provider — that import path does not change.

**Default export + typed props pattern** — every file in `components/napplets/` exports one
default component with an explicit `Props` type or inline prop type
(`napplet-frame.tsx:34-37`, `napplet-menu.tsx:12-16`):
```typescript
export default function NappletMenu({
  event,
  "aria-label": ariaLabel = "App menu",
  ...props
}: { event: NostrEvent } & Omit<MenuIconButtonProps, "children" | "aria-label"> & { "aria-label"?: string }) {
```
Apply the same shape to `ConsentModal`/`IntentChoiceModal`: default export, explicit prop type,
destructured props with defaults where useful.

### `src/services/wallets/*` (D-10 directory-module split)

**Analog:** `src/services/event-cache/` (directory-of-backends-plus-index precedent) and
`src/services/database/index.ts` (barrel importing a schema/types module).

**Directory + barrel pattern** (`src/services/database/index.ts:1-19`):
```typescript
import { openDB, deleteDB, IDBPDatabase, IDBPTransaction } from "idb";
import { deleteDB as nostrIDBDelete } from "nostr-idb";
import { SchemaV1, SchemaV2, ..., SchemaV13 } from "./schema";
import { logger } from "../../helpers/debug";
const log = logger.extend("Database");
```
`services/wallets/index.ts` should mirror this: import types from `./types`, backend factories
from `./webln`, `./nwc`, `./nutwallet`, declare its own `const log = logger.extend("Wallets")`
(already present verbatim at `wallets.ts:20,27` — carry it unchanged into `index.ts`).

**Confirmed zero-churn import resolution:** `tsconfig.json`'s `"moduleResolution": "Bundler"`
resolves a bare `from "../../../services/wallets"` to `services/wallets/index.ts` automatically —
verified consistent with how `services/event-cache` and `services/database` are imported
repo-wide (never with an explicit `/index` suffix). No consumer-site edits needed for D-10.

**Existing top-of-file import block to preserve verbatim in the split** (`wallets.ts:1-27`):
```typescript
import { parseBolt11, parseLNURLOrAddress, type EncryptedContentCache } from "applesauce-common/helpers";
import type { ISigner } from "applesauce-signers";
import { WalletConnect } from "applesauce-wallet-connect";
import type { Transaction } from "applesauce-wallet-connect/helpers";
import { NutWallet, WalletStatus } from "applesauce-wallet/wallet";
import { BehaviorSubject, combineLatest, filter, firstValueFrom, map, Observable, of, shareReplay, Subscription, switchMap, take, timeout } from "rxjs";

import { logger } from "../helpers/debug";
import accounts from "./accounts";
import couch from "./cashu-couch";
import { decryptionCache$ } from "./decryption-cache";
import { eventStore } from "./event-store";
import pool from "./pool";
import localSettings, { type StoredNwcWallet } from "./preferences";

const log = logger.extend("Wallets");
```
Split this by which backend/types file actually uses each import — e.g. `WalletConnect`/
`Transaction` → `nwc.ts`; `NutWallet`/`WalletStatus` → `nutwallet.ts`; `accounts`, `eventStore`,
`pool` mostly stay in `index.ts` since they drive the reactive composition (`wallets$`,
`activeWallet$`) that RESEARCH.md says must relocate, not redesign.

### D-07: `useAsyncAction` conversion (`cached-files-card.tsx`, `service-worker-status-card.tsx`)

**Analog:** `src/hooks/use-async-action.ts` (the hook itself) and
`src/components/napplets/napplet-menu.tsx:19-26` (a real call-site).

**Hook signature** (`use-async-action.ts:4-29`, full file):
```typescript
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

**Real call-site pattern** (`napplet-menu.tsx:19-26`):
```typescript
const toast = useToast();
const { run: copyAddress } = useAsyncAction(async () => {
  if (!address) return;
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(address);
    toast({ status: "success", description: "Copied app address" });
  } else toast({ description: address, isClosable: true, duration: null });
}, [address, toast]);
```
This is the exact shape D-07's three handlers should converge on: destructure `{ loading, run }`
(rename `run` per call site, e.g. `handleClearCache`), keep the success-path `toast(...)` inside
the callback (the hook only auto-toasts on the *catch* path), and list every closed-over value in
`deps`. Note per RESEARCH.md's D-07 code example, `useAsyncAction` collapses per-item loading
state into one boolean — this is a real design decision the executor must make explicit for the
per-cache-name loading case in `cached-files-card.tsx`, not silently drop.

### D-05: duplicate-block extractions

**`sw/client/error-logger.ts`** — analog is itself; both flagged functions
(`logServiceWorkerErrors`/`logServiceWorkerErrorsByContext`, lines ~25-63) share the whole
`console.group`/`forEach`/`console.groupEnd` rendering loop. Extract that loop into one shared
`renderErrorLogs(logs: ServiceWorkerErrorLog[], groupLabel: string)` helper, called by both. This
file is also the **working `aislop-ignore-file` example** other D-05/D-13 ignores should copy the
syntax from:
```typescript
// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output
```

**`components/magic-textarea.tsx`** (twin `forwardRef` components, `:202-214` shown for
`MagicTextArea`):
```typescript
const MagicTextArea = forwardRef<HTMLTextAreaElement, TextareaProps & { instanceRef?: LegacyRef<RefType> }>(
  ({ instanceRef, ...props }, ref) => {
    const triggers = useAutocompleteTriggers();
    return (
      // @ts-expect-error
      <ReactTextareaAutocomplete<Token, TextareaProps>
        {...props}
        ref={instanceRef}
        textAreaComponent={Textarea}
        ...
        aria-label={props["aria-label"] || "Textarea with autocomplete"}
        ...
      />
    );
  },
);
MagicTextArea.displayName = "MagicTextArea";
```
`MagicInput` (earlier in the same file) differs only in `textAreaComponent` (an `Input` instead
of `Textarea`) and its default aria-label. Extract a shared internal factory/hook
(`useMagicAutocompleteProps(textAreaComponent, ariaLabel)` or similar, PascalCase if it returns
JSX) that both `forwardRef` components call — per CONVENTIONS.md's "PascalCase internal JSX
helpers even when unexported."

**`views/articles/components/article-reader.tsx`** (three identical Slider `FormControl`s,
Pitch shown at `:297-312`):
```typescript
<FormControl>
  <FormLabel>Pitch (x{voiceSettings.pitch.toFixed(1)})</FormLabel>
  <Slider value={voiceSettings.pitch} onChange={handlePitchChange} min={0.5} max={2} step={0.1} colorScheme="blue">
    <SliderTrack><SliderFilledTrack /></SliderTrack>
    <SliderThumb />
  </Slider>
</FormControl>
```
Rate/Pitch/Volume differ only in label, value, onChange, min/max/step — extract one
`<VoiceSlider label min max step value onChange />` internal component (PascalCase, colocated in
the same file, not a new file — matches the "internal JSX helper" convention seen throughout the
codebase rather than spawning a new shared component file for a 3-use-site pattern).

### `helpers/nostr/relay-stats.ts` (D-13 deletion)

**Analog:** itself, before/after. Current full file is 43 lines; RESEARCH.md's deletion shape
(delete `getRelayURL` 7-9, `getRTTTag` 23-36, `getRTT` 37-43, `MONITOR_METADATA_KIND` line 4;
keep `MONITOR_STATS_KIND`, `getNetwork`, `getSupportedNIPs`) is already fully specified — no
further pattern extraction needed beyond confirming this is a same-file edit, not a new module.

## Shared Patterns

### Logging
**Source:** `src/helpers/debug.ts` (`export const logger = debug("noStrudel")`), used via
`logger.extend("<scope>")` in every service module (`event-cache/index.ts:16`, `wallets.ts:20`,
`database/index.ts:18`).
**Apply to:** every new file under `services/napplet-shell/*` and `services/wallets/*` — each
gets its own `const log = logger.extend(...)` line, not a shared logger passed around.

### Rule-scoped ignore syntax
**Source:** `src/sw/client/error-logger.ts:1` (file-level) and
`src/hooks/timeline/use-timeline-cache-key.ts:14` (next-line):
```typescript
// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output
// aislop-ignore-next-line ai-slop/hidden-fallback -- fallback is a stable nanoid from useMemo serving the first render until the effect above writes it into route state; this is initialization, not error recovery, so there is no failure path to make explicit
```
**Apply to:** D-06 (`torrents.ts` file-level ignore), D-12 (page-component ignores), D-14
(`verify-event.ts` ignore) — copy this exact `// aislop-ignore-<scope> <rule> -- <reason>` form,
always naming the rule and ending in `-- reason`.

### Async user-triggered actions
**Source:** `src/hooks/use-async-action.ts` + `src/components/napplets/napplet-menu.tsx:19-26`.
**Apply to:** D-07's three handlers. See Pattern Assignments above for the full excerpt.

### Directory module / barrel with `index.ts`
**Source:** `src/services/event-cache/` and `src/services/database/index.ts`.
**Apply to:** D-10 (`services/wallets/`) and, as a shape reference only (D-08 does not become a
directory-with-index — it stays a flat `services/napplet-shell/*.ts` set of sibling files per the
recommended project structure in RESEARCH.md, with no `services/napplet-shell/index.ts` barrel
named in the plan). Confirm at planning time whether `napplet-shell/` needs its own `index.ts`
barrel or whether `adapter.ts` alone is the public surface the provider imports from — RESEARCH.md's
tree diagram does not show a `napplet-shell/index.ts`, only the listed sibling files.

### Import ordering / no `~/` alias
**Source:** every analog cited above uses relative imports (`../../helpers/debug`,
`../../providers/global/napplet-shell-provider`), never `~/`.
**Apply to:** all new/moved files in this phase — CONVENTIONS.md and AGENTS.md both flag `~/` as
configured-but-rarely-used; do not introduce it in new modules even though it would technically
resolve.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `services/napplet-shell/permissions.ts` | service (pure state) | CRUD | No existing plain-module (non-hook, non-React) Map+localStorage encapsulation pattern in the codebase; nearest is a hook (`use-timeline-cache-key.ts`), not a plain service module — this is a genuinely new shape for this codebase |
| `services/napplet-shell/upload-service.ts` | service | file-I/O | No blossom-upload-shaped service exists elsewhere to model against; source region (`napplet-shell-provider.tsx:512-556`) is the only precedent, being relocated as-is |
| `vitest.config.ts` | config | — | Zero test-tooling precedent in this repo (confirmed: no vitest/jest/playwright config anywhere); RESEARCH.md's minimal `defineConfig({ test: { environment: "node" } })` is the only guidance, not an in-repo analog |
| `*.test.ts` (first test files) | test | — | Zero test files exist in this repo today; no colocation or naming precedent to copy — RESEARCH.md's `permissions.test.ts`-beside-`permissions.ts` proposal is a new convention, not an extracted one |
| `views/notifications/index.tsx` (D-05 `metadata` block extraction) | component | transform | Not separately read this session (RESEARCH.md's excerpt for `notifications/common.ts` covers the adjacent service file, not the view); planner should read `views/notifications/index.tsx:77,98` directly at plan time for the exact `SimpleNavBox`/`metadata` prop shape before extracting |

## Metadata

**Analog search scope:** `src/services/event-cache/`, `src/services/database/`,
`src/services/notifications/`, `src/components/napplets/`, `src/hooks/`, `src/helpers/debug.ts`,
`src/sw/client/`, `src/services/wallets.ts`, `src/providers/global/napplet-shell-provider.tsx`,
`src/components/magic-textarea.tsx`, `src/views/articles/components/article-reader.tsx`.
**Files scanned:** ~20 direct reads this session (targeted, non-overlapping ranges per file).
**Pattern extraction date:** 2026-09-24
