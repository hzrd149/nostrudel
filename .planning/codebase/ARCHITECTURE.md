<!-- refreshed: 2026-07-01 -->
# Architecture

**Analysis Date:** 2026-07-01

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         React UI Layer                              │
│  Views (routes)          Components            Providers            │
│  `src/views/*`           `src/components/*`     `src/providers/*`    │
└───────────────┬───────────────────┬──────────────────┬──────────────┘
                │                   │                   │
                ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Hooks / Applesauce React Bindings                │
│   `src/hooks/*` (use$, useEventModel, useObservableMemo, ...)        │
└───────────────┬───────────────────────────────────────┬─────────────┘
                │                                        │
                ▼                                        ▼
┌───────────────────────────────┐        ┌──────────────────────────────┐
│   Models (read projections)   │        │  Actions (write operations)  │
│   `src/models/*`               │        │  `src/services/actions.ts`   │
│   applesauce-core/models        │        │  applesauce-actions (ActionHub)│
└───────────────┬───────────────┘        └───────────────┬──────────────┘
                │                                        │
                ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Singleton Services (app-wide state)               │
│  EventStore  `src/services/event-store.ts`                          │
│  RelayPool   `src/services/pool.ts`                                  │
│  Loaders     `src/services/loaders.ts`                               │
│  AccountManager `src/services/accounts.ts`                           │
│  Preferences `src/services/preferences.ts`                          │
│  Wallets, Cron, Notifications, Social Graph, Lookup, ...            │
│  `src/services/*.ts`                                                 │
└───────────────┬───────────────────────────────┬─────────────────────┘
                │                                │
                ▼                                ▼
┌────────────────────────────────┐   ┌───────────────────────────────┐
│  Event Cache (local persistence)│   │   Nostr Relays (network)      │
│  `src/services/event-cache/*`   │   │   via `applesauce-relay`      │
│  IndexedDB (nostr-idb) / SQLite │   │   `RelayPool` (`pool.ts`)      │
│  (native/wasm) / worker-relay   │   │                               │
└────────────────────────────────┘   └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│               Service Worker (background sync / cache proxy)         │
│  `src/sw/worker/sw.ts`, `src/sw/client/*`, `src/sw/common/*`          │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App Router | Defines all routes, top-level layout, error boundary | `src/app.tsx` |
| Bootstrap | Initializes polyfills, dayjs, bitcoin-connect, protocol handlers, mounts React root | `src/index.tsx` |
| Global Providers | Wires EventStore/AccountsProvider/ActionsProvider/Theme/Publish/Emoji at app root | `src/providers/global/index.tsx` |
| Route Providers | Per-route-tree providers (modals: delete-event, mute, invoice, post, app-handler) | `src/providers/route/index.tsx` |
| EventStore | Single in-memory reactive Nostr event store (applesauce-core) | `src/services/event-store.ts` |
| RelayPool | Manages relay connections, liveness, notices | `src/services/pool.ts` |
| Loaders | Cold observables that fetch events/profiles/reactions/zaps/timelines from relays with cache-first strategy | `src/services/loaders.ts` |
| ActionHub | Executes write operations (follow, mute, publish, etc.) against EventStore + signer + outbox publish | `src/services/actions.ts` |
| AccountManager | Manages signed-in accounts (extension, NIP-46, password, readonly, hardware, Android) | `src/services/accounts.ts` |
| Event Cache | Pluggable local persistence backends behind a common interface | `src/services/event-cache/interface.ts`, `index.ts` |
| Models | Typed reactive read-projections over EventStore data (app-specific, beyond applesauce's built-ins) | `src/models/*.ts` |
| Views | Route-level page components, one directory per top-level route | `src/views/*` |
| Components | Reusable/shared UI building blocks | `src/components/*` |
| Service Worker | Background caching, PWA update, cross-tab RPC | `src/sw/worker/sw.ts`, `src/sw/client/*` |
| Theme | Chakra UI theme customization | `src/theme/*` |

## Pattern Overview

**Overall:** Reactive, event-store-centered single-page application (SPA) built on the **applesauce** Nostr SDK. There is no traditional backend API — the "backend" is the Nostr relay network plus local browser persistence. The app follows a **unidirectional reactive data flow**: relays/cache → EventStore → Models (RxJS observables) → React hooks (`use$`, `useEventModel`) → components. Writes flow the opposite direction: components → Actions/Factories → ActionHub → EventStore + RelayPool.publish.

**Key Characteristics:**
- Single global `EventStore` instance (`src/services/event-store.ts`) is the source of truth; every event from relay or cache must pass through `eventStore.add(...)`.
- Feature-based route structure: each route in `src/views/<feature>/` owns its own `routes.tsx`, page components, and `components/` subfolder.
- Singleton services module pattern: cross-cutting app state (pool, accounts, actions, wallets, notifications, preferences, social graph) is instantiated once as a module-level singleton under `src/services/`, imported wherever needed (no DI container).
- Heavy use of RxJS observables for all reactive state (relay connections, models, loaders, preferences) rather than a traditional state-management library (no Redux/Zustand).
- Local persistence is pluggable: IndexedDB (`nostr-idb`), native SQLite (Capacitor), WASM SQLite (worker), or a hosted relay cache — selected behind a common interface.
- Progressive Web App with a custom service worker for offline caching and background updates (`vite-plugin-pwa`, injectManifest strategy).
- Multi-platform: same React codebase targets web (Vite) and native (Capacitor Android/iOS) via `CAP_IS_NATIVE`/`CAP_IS_WEB` checks (`src/env.ts`).

## Layers

**Views (Route/Page Layer):**
- Purpose: top-level page composition per route, param parsing, page-level data loading hooks
- Location: `src/views/<feature>/`
- Contains: `index.tsx` (page), `routes.tsx` (react-router children), `components/` (page-local components), `<sub-page>/` (nested route dirs)
- Depends on: components, hooks, models, services
- Used by: `src/app.tsx` route tree

**Components (Presentation Layer):**
- Purpose: reusable UI building blocks shared across views (notes, timelines, user cards, modals, forms, icons)
- Location: `src/components/<feature>/`
- Contains: presentational and some stateful React components, often paired with a `components/` sub-directory for internal pieces
- Depends on: hooks, helpers, models
- Used by: views and other components

**Providers (Context Layer):**
- Purpose: React context providers for cross-cutting concerns
- Location: `src/providers/global` (app-root, mounted once), `src/providers/local` (feature-scoped, mounted per subtree), `src/providers/route` (route-tree-scoped, e.g. modals)
- Depends on: services
- Used by: `src/index.tsx` (global), individual views/components (local/route)

**Hooks (Data-Binding Layer):**
- Purpose: bridge RxJS observables (models, loaders, services) into React state
- Location: `src/hooks/*`, `src/hooks/timeline/*`
- Contains: `use$`/`useEventModel` wrappers, timeline pagination hooks, form/async helpers
- Depends on: models, services, applesauce-react
- Used by: views, components

**Models (Read Layer):**
- Purpose: typed, memoized reactive queries over the EventStore for app-specific data shapes not covered by applesauce's built-in models
- Location: `src/models/*.ts` (e.g. `lists.ts`, `mutes.ts`, `messages.ts`, `stream.ts`, `badges.ts`)
- Depends on: `applesauce-core`/`applesauce-common` model framework, EventStore
- Used by: hooks (`useEventModel`), components directly

**Services (Domain/Infrastructure Layer):**
- Purpose: singleton app-wide state and integrations — relay pool, event store, loaders, actions, accounts, preferences, wallets, notifications, caching, social graph, lookups
- Location: `src/services/*.ts`, with subfolders `event-cache/`, `sqlite/`, `database/`, `notifications/`, `lookup/`
- Depends on: applesauce packages, external SDKs (cashu-ts, bitcoin-connect), browser storage APIs
- Used by: every other layer

**Classes (Domain Objects):**
- Purpose: custom account/signer implementations and small utility classes not provided by applesauce
- Location: `src/classes/accounts/`, `src/classes/signers/`, plus top-level helpers (`super-map.ts`, `preference-subject.ts`, `encrypted-storage.tsx`, `article-speech-reader.ts`)
- Used by: `src/services/accounts.ts` and signer-selection UI

**Helpers/Lib (Pure Utility Layer):**
- Purpose: framework-agnostic utility functions and vendored/adapted libraries
- Location: `src/helpers/*` (app-specific utilities: nostr, blossom, lightning, media-upload), `src/lib/*` (vendored libs: qrcodegen, bencode, open-graph-scraper, fix-image-orientation)
- Depends on: nothing app-specific (or minimal)
- Used by: all layers

**Service Worker Layer:**
- Purpose: PWA background caching, offline support, RPC bridge between page and SW
- Location: `src/sw/worker/` (runs in SW context), `src/sw/client/` (runs in page, talks to SW), `src/sw/common/` (shared RPC/interface types)
- Registered from: `src/services/worker.ts`, invoked in `src/index.tsx`

## Data Flow

### Primary Request Path (reading notes/timeline)

1. View mounts and calls a hook (e.g. timeline hook) — (`src/hooks/timeline/*`)
2. Hook subscribes to a **loader** observable (`createTimelineLoader`/`createOutboxTimelineLoader`) which checks the local **event cache** first (`cacheRequest` from `src/services/event-cache/index.ts`), then requests from relays via the shared `RelayPool` (`src/services/pool.ts`)
3. Retrieved events are pushed into the singleton `eventStore` (`src/services/event-store.ts:5`), which verifies signatures (`src/services/verify-event.ts`) unless already cache-flagged
4. React components read data through **models** (`src/models/*.ts`, plus applesauce's built-in models) via `useEventModel`/`use$` hooks, which re-render reactively as the EventStore emits updates
5. Rendered note/profile content is parsed through `applesauce-content` (NAST) and rendered by content components (`src/components/content/*`)

### Write / Publish Flow

1. User action in a component (e.g. follow, mute, post note, react) calls an **Action** (`applesauce-actions` blueprint) or an **EventFactory** blueprint directly
2. `ActionHub`/`ActionRunner` (`src/services/actions.ts`) signs the event using the active account's signer (`src/services/accounts.ts` → `AccountManager`)
3. On publish, the event is first added to the local `eventStore` optimistically, then published to the user's outbox relays resolved from their NIP-65 relay list (`getOutboxes`) via `pool.publish(...)`
4. `PublishProvider` (`src/providers/global/publish-provider.tsx`) tracks publish status/results for UI feedback (toast, task manager)

**State Management:**
- No global client-state store (no Redux/Zustand). All shared state lives in RxJS observables exposed by singleton services/models, consumed via `use$`/`useEventModel`/`useObservableMemo` hooks from `applesauce-react`.
- Local component state uses standard React `useState`/`useReducer`.
- Persistent user preferences are stored via `src/services/preferences.ts` (uses `PreferenceSubject`, `src/classes/preference-subject.ts`) backed by localStorage/Capacitor Preferences.

## Key Abstractions

**EventStore (single source of truth):**
- Purpose: in-memory reactive store of all Nostr events the app has seen, with signature verification and model caching
- Examples: `src/services/event-store.ts`
- Pattern: singleton instantiated once, imported everywhere; every event must flow through `eventStore.add()`

**Loaders (data fetching):**
- Purpose: cold RxJS observables that fetch events by id/address/timeline/reactions/zaps, cache-first then relay
- Examples: `src/services/loaders.ts`
- Pattern: `createXLoader(pool, { cacheRequest, eventStore, extraRelays, ... })`; must be subscribed to trigger network requests

**Models (typed read projections):**
- Purpose: memoized reactive queries derived from EventStore events, exposed as observables keyed by pubkey/id
- Examples: `src/models/lists.ts`, `src/models/mutes.ts`, `src/models/messages.ts`, `src/models/event-zaps.ts`
- Pattern: functions returning `Model<T>` consumed via `useEventModel(store, ModelFn, args)`

**Actions (write operations):**
- Purpose: encapsulate the "how" of mutating Nostr state (follow/mute/bookmark/publish) independent of signing/publishing mechanics
- Examples: `src/services/actions.ts` (ActionHub wiring); action classes come from `applesauce-actions`
- Pattern: `actions.run(SomeAction, ...args)` or `.exec()` for manual publish control

**Account/Signer abstraction:**
- Purpose: uniform `ISigner` interface across extension (NIP-07), NIP-46 bunker, password-encrypted keys, hardware, Android native signers
- Examples: `src/services/accounts.ts`, `src/classes/accounts/android-signer-account.ts`, `src/classes/signers/android-native-signer.ts`
- Pattern: `AccountManager` holds all accounts, exposes `active$`; components use `useActiveAccount()`

**Event Cache (pluggable persistence):**
- Purpose: abstracts over multiple local storage backends behind one `cacheRequest`/interface contract
- Examples: `src/services/event-cache/interface.ts`, `nostr-idb.ts`, `native-sqlite.ts`, `wasm-worker.ts`, `hosted-relay.ts`, `local-relay.ts`
- Pattern: runtime-selected implementation based on platform/settings, all conforming to `interface.ts`

## Entry Points

**Web/App bootstrap:**
- Location: `src/index.tsx`
- Triggers: page load (browser or Capacitor WebView)
- Responsibilities: load polyfills, init dayjs, init bitcoin-connect, register `nostr:`/`web+nostr:` protocol handlers, mount `GlobalProviders` + `App`, register service worker

**Route/App shell:**
- Location: `src/app.tsx`
- Triggers: called from `index.tsx`
- Responsibilities: defines the full `createBrowserRouter` route tree, wraps app in `ErrorBoundary`, `TaskManagerProvider`, `RouterProvider`

**Service Worker:**
- Location: `src/sw/worker/sw.ts`
- Triggers: browser SW lifecycle (install/activate/fetch)
- Responsibilities: offline caching (injectManifest via `vite-plugin-pwa`), RPC responses to page via `src/sw/worker/rpc.ts`

**Native shell (Capacitor):**
- Location: `android/`, `ios/` (native wrapper projects), driven by `src/env.ts` (`CAP_IS_NATIVE`)
- Responsibilities: wraps the same web build for native distribution, adds native SQLite/barcode-scanning/preferences/share plugins

## Architectural Constraints

- **Threading:** Single-threaded main JS context for UI; SQLite persistence (WASM) can run in a Web Worker (`src/services/event-cache/wasm-worker.ts`); service worker runs in its own thread/context.
- **Global state:** Numerous module-level singletons: `eventStore` (`src/services/event-store.ts`), `pool` (`src/services/pool.ts`), `accounts` (`src/services/accounts.ts`), `actions` (`src/services/actions.ts`), plus most files under `src/services/*.ts` export a default singleton instance. This is the primary state-sharing mechanism instead of DI.
- **Single EventStore rule:** Only one `EventStore` should exist per running app (per applesauce hard rules) — do not instantiate a second one; models cache per-store and a second store would desync from the first.
- **Cold observables must be subscribed:** Loaders and relay pool subscriptions do nothing until `.subscribe()`/consumed via `use$`; unsubscribed loaders silently produce no network requests.
- **Platform branching:** Code frequently branches on `CAP_IS_NATIVE`/`CAP_IS_WEB`/`IS_SERVICE_WORKER_SUPPORTED` (`src/env.ts`) to select persistence backend or native APIs.

## Anti-Patterns

### Bypassing the EventStore

**What happens:** Fetching events directly from `pool.request(...)` or a loader and using them in a component without calling `eventStore.add(...)`.
**Why it's wrong:** Models and any other reactive consumer will never see these events; state silently desyncs from the rest of the app.
**Do this instead:** Use the existing loaders in `src/services/loaders.ts` (they already wire `eventStore`), or manually call `eventStore.add(event)` when consuming raw pool results, as done in `src/services/actions.ts`.

### Unsubscribed relay/loader observables

**What happens:** Calling `pool.request(...)`/`pool.subscription(...)` or a loader and not subscribing or composing with a completing operator.
**Why it's wrong:** No network request is ever sent (cold observable), and if it is subscribed but never torn down, the relay subscription leaks indefinitely.
**Do this instead:** Use `use$`/`useObservableMemo`/`useEventModel` (auto-managed lifecycle) for React consumers; for one-off imperative code use `firstValueFrom`/`take`/`takeUntil`.

## Error Handling

**Strategy:** React `ErrorBoundary` (`src/components/error-boundary`) wraps the whole app at the router level (`src/app.tsx`); async/network errors are generally surfaced via toast notifications and the Task Manager (`src/views/task-manager/`) rather than thrown to the boundary.

**Patterns:**
- Signature verification failures are handled inside `eventStore.verifyEvent` (`src/services/event-store.ts:8`) — cache-sourced events skip re-verification (`isFromCache`)
- Publish failures are tracked per-relay and surfaced through `PublishProvider` (`src/providers/global/publish-provider.tsx`) and the task manager log (`src/views/task-manager/publish-log`)
- Relay connection errors are tracked reactively via `RelayLiveness` and `connections$`/`notices$` (`src/services/pool.ts`)

## Cross-Cutting Concerns

**Logging:** `debug` package wrapped in `src/helpers/debug.ts` (namespaced loggers, e.g. `logger("Rendering app")` in `src/index.tsx`); a Debug Modal surfaces internal state for troubleshooting (`src/components/debug-modal/`, `src/views/tools/event-console`).
**Validation:** Nostr event signature verification centralized in `src/services/verify-event.ts`, invoked from `eventStore.verifyEvent`.
**Authentication:** Handled entirely via Nostr signer abstraction (`AccountManager`, `ISigner`), not a traditional session/auth system — see `src/services/accounts.ts` and `src/services/authentication-signer.ts`.

---

*Architecture analysis: 2026-07-01*
