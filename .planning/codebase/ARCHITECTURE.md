<!-- refreshed: 2026-07-29 -->
# Architecture

**Analysis Date:** 2026-07-29

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 React Router + Chakra UI App                 │
├──────────────────┬──────────────────┬───────────────────────┤
│      Views       │    Components    │    Route Providers     │
│  `src/views/`    │ `src/components/`│ `src/providers/route/` │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│      Hooks, Nostr Helpers, Applesauce Models, Services       │
│ `src/hooks/` `src/helpers/nostr/` `src/models/` `src/services/`│
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Nostr relays, EventStore, browser/native storage, SW cache   │
│ `src/services/pool.ts` `src/services/event-store.ts`         │
│ `src/services/event-cache/` `src/sw/`                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Browser/native bootstrap | Loads polyfills, initializes Bitcoin Connect/dayjs, mounts React, handles native `nostr:` URLs, registers service worker | `src/index.tsx` |
| Router shell | Defines top-level routes and wraps all rendered pages in layout, suspense, and error boundary | `src/app.tsx` |
| Global providers | Provides Applesauce EventStore, account manager, action runner, Chakra theme, publishing, napplet shell, and emoji context | `src/providers/global/index.tsx` |
| Route providers | Provides route-scoped modal/action contexts for delete, mute, debug, invoice, post, list history, and app handler functionality | `src/providers/route/index.tsx` |
| Layout selector | Chooses mobile or desktop application layout from breakpoint state | `src/components/layout/index.tsx` |
| Views | Own route-level page composition, URL parameters, filtering controls, and feature-specific provider wrappers | `src/views/` |
| Shared components | Own reusable UI primitives and feature widgets used across views | `src/components/` |
| Hooks | Bridge React components to RxJS, EventStore, relay loaders, route state, account state, and browser APIs | `src/hooks/` |
| Nostr helpers | Encapsulate event kind constants, tag extraction, validation, and protocol-specific pure functions | `src/helpers/nostr/` |
| Applesauce models | Define EventStore query projections consumed by `useEventModel` | `src/models/` |
| Singleton services | Own process-wide relay pool, accounts, event store, action hub, cache, preferences, lookups, wallets, and background tasks | `src/services/` |
| Service worker | Handles PWA precache, navigation fallback, cache RPC, and worker error logging | `src/sw/` |
| Native shells | Capacitor Android/iOS wrappers for mobile app builds | `android/`, `ios/` |

## Pattern Overview

**Overall:** Feature-sliced React SPA with singleton service layer, RxJS reactive streams, and Applesauce EventStore for Nostr data.

**Key Characteristics:**
- Route modules under `src/views/<feature>/` compose page UI and import shared logic instead of owning global state.
- Nostr data flows through `src/services/pool.ts`, `src/services/loaders.ts`, `src/hooks/use-timeline-loader.ts`, `src/hooks/use-outbox-timeline-loader.ts`, and the singleton `src/services/event-store.ts`.
- Persistent client settings use `PreferenceSubject` in `src/classes/preference-subject.ts` and are centralized in `src/services/preferences.ts`.
- Event cache implementations are dynamically selected behind the common interface in `src/services/event-cache/interface.ts` and orchestrated by `src/services/event-cache/index.ts`.
- Feature-specific event parsing belongs in `src/helpers/nostr/*.ts`; route components call helpers such as `validateTorrent` from `src/helpers/nostr/torrents.ts`.

## Layers

**Bootstrap Layer:**
- Purpose: Initialize global runtime side effects before React renders.
- Location: `src/index.tsx`
- Contains: Polyfill import, Capacitor platform checks, Bitcoin Connect setup, dayjs plugin setup, protocol handler registration, React root mount, service worker registration.
- Depends on: `src/env.ts`, `src/app.tsx`, `src/providers/global/index.tsx`, `src/services/worker.ts`.
- Used by: Vite entry from `index.html`.

**Routing and Layout Layer:**
- Purpose: Convert URLs into view components and provide responsive app chrome.
- Location: `src/app.tsx`, `src/components/layout/`
- Contains: `createBrowserRouter` route tree, top-level `RootPage`, no-layout auth pages, mobile/desktop layout selection.
- Depends on: `react-router-dom`, `src/views/*`, `src/providers/route/index.tsx`.
- Used by: `src/index.tsx` through `<App />`.

**View Layer:**
- Purpose: Own route-level page composition, filters, tab/detail pages, and feature-specific components.
- Location: `src/views/`
- Contains: Feature directories such as `src/views/torrents/`, `src/views/articles/`, `src/views/settings/`, `src/views/user/`, and `src/views/wallet/`.
- Depends on: Shared components from `src/components/`, hooks from `src/hooks/`, helpers from `src/helpers/nostr/`, route providers, and services.
- Used by: `src/app.tsx` route tree.

**Component Layer:**
- Purpose: Provide reusable UI blocks that do not define routes.
- Location: `src/components/`
- Contains: Layout, timelines, note rendering, content rendering, user widgets, modals, forms, relay widgets, wallet/cashu widgets, and media components.
- Depends on: Chakra UI, React, local hooks/helpers, applesauce hooks where needed.
- Used by: `src/views/` and other components.

**Reactive Data Layer:**
- Purpose: Query, derive, and distribute Nostr data to React using Applesauce and RxJS.
- Location: `src/services/event-store.ts`, `src/models/`, `src/hooks/`
- Contains: Singleton `EventStore`, model projections like `ReactionsQuery`, hook wrappers like `useTimelineLoader`, direct `eventStore.timeline(...)` subscriptions.
- Depends on: `applesauce-core`, `applesauce-react`, RxJS, `nostr-tools`.
- Used by: Views and components that render profiles, timelines, reactions, zaps, lists, and settings.

**Relay and Loader Layer:**
- Purpose: Connect to Nostr relays, request historical data, keep live subscriptions open, and route events into EventStore.
- Location: `src/services/pool.ts`, `src/services/loaders.ts`, `src/services/outbox-cache.ts`, `src/services/outbox-subscriptions.ts`, `src/hooks/use-outbox-timeline-loader.ts`
- Contains: `RelayPool`, relay liveness tracking, profile/address/event/zap/reaction loaders, outbox map cache, live outbox subscriptions.
- Depends on: `applesauce-relay`, `applesauce-loaders`, `src/services/event-cache/index.ts`, `src/services/preferences.ts`.
- Used by: Timeline hooks, feature views, event helpers, and services.

**Persistence Layer:**
- Purpose: Persist preferences, legacy app data, event caches, and native/web storage.
- Location: `src/services/preferences.ts`, `src/services/database/`, `src/services/event-cache/`, `src/services/sqlite/`
- Contains: Capacitor Preferences settings, IndexedDB schema migrations, cache adapters for local relay, hosted relay, `nostr-idb`, WASM worker, native SQLite.
- Depends on: `@capacitor/preferences`, `idb`, `nostr-idb`, `@snort/worker-relay`, native SQLite packages.
- Used by: Accounts, event loaders, settings views, relay lookup services, and cache settings pages.

**Protocol Helper Layer:**
- Purpose: Keep Nostr event parsing, validation, and pointer formatting out of UI code.
- Location: `src/helpers/nostr/`, `src/helpers/nip19.ts`, `src/helpers/applesauce.ts`
- Contains: Kind constants, tag getters, validation functions, list/profile/reaction/zap/poll/file/torrent helpers.
- Depends on: `nostr-tools`, Applesauce helpers where useful.
- Used by: Views, components, models, and services.

**Background Worker Layer:**
- Purpose: Provide PWA offline behavior and typed main-thread/service-worker RPC.
- Location: `src/sw/`, `src/services/worker.ts`
- Contains: Service worker registration, Workbox routes, cache handlers, error logging, RPC client/server.
- Depends on: `vite-plugin-pwa`, Workbox, RxJS.
- Used by: App bootstrap and settings/cache/background-worker views.

## Data Flow

### Primary Request Path

1. Vite loads the application entry and `src/index.tsx:63` renders `<GlobalProviders><App /></GlobalProviders>` into `#root`.
2. `src/app.tsx:80` creates the browser router and `src/app.tsx:94` renders `RootPage` for normal app routes.
3. `src/app.tsx:66` wraps route content in `RouteProviders`, then `src/components/layout/index.tsx:5` selects mobile or desktop layout.
4. A view such as `src/views/home/index.tsx:85` renders route-specific content and wraps feature state with local providers when needed.
5. The view creates loaders/subscriptions through hooks such as `src/hooks/use-outbox-timeline-loader.ts:12` or `src/hooks/use-timeline-loader.ts:16`.
6. Loaders use `src/services/pool.ts:10` for relay IO and `src/services/event-cache/index.ts:101` for cached reads.
7. Events are verified by `src/services/event-store.ts:8`, added to the singleton EventStore, and queried by `eventStore.timeline(...)` in `src/views/home/index.tsx:64` or `useEventModel(...)` in `src/views/home/index.tsx:44`.
8. Components render the resulting event arrays through timeline components such as `src/components/timeline-page/index.tsx:32`.

### Feature Route Flow

1. Route groups are registered in `src/app.tsx:97` through `src/app.tsx:137`; nested modules export `RouteObject[]` such as `src/views/torrents/routes.tsx:6`.
2. Feature views place list/detail/create pages in the same directory, as in `src/views/torrents/index.tsx`, `src/views/torrents/torrent.tsx`, and `src/views/torrents/new.tsx`.
3. Feature-specific helpers validate and extract Nostr data before render, such as `TORRENT_KIND` and `validateTorrent` in `src/helpers/nostr/torrents.ts:3` and `src/helpers/nostr/torrents.ts:61`.
4. List rows/components live under feature-local `components/` directories, such as `src/views/torrents/components/torrent-table-row.tsx`.

### Publishing Flow

1. Global provider `src/providers/global/index.tsx:31` exposes the singleton ActionHub from `src/services/actions.ts`.
2. `src/services/actions.ts:9` constructs `ActionHub` with EventStore, active account signer, and a publish callback.
3. The callback reads relay list data from EventStore at `src/services/actions.ts:10`, adds the signed event locally at `src/services/actions.ts:16`, and publishes to outboxes through `src/services/pool.ts` at `src/services/actions.ts:17`.
4. Route providers such as `src/providers/route/post-modal-provider.tsx` and publish helpers use this shared action path for user-facing actions.

### Cache and Persistence Flow

1. `src/services/preferences.ts:119` exposes all local settings as `PreferenceSubject` instances backed by Capacitor Preferences.
2. `src/services/event-cache/index.ts:65` creates `eventCache$` from the selected setting and fallback cache list.
3. Cache reads go through `cacheRequest` exported by `src/services/event-cache/index.ts:126`.
4. Cache writes are buffered by `writeEvent$` in `src/services/event-cache/index.ts:108` and flushed to the active cache implementation.
5. IndexedDB migrations and legacy stores are managed by `src/services/database/index.ts:23`; event cache-specific storage uses adapters under `src/services/event-cache/`.

**State Management:**
- Use React state for transient UI state inside views/components.
- Use React Context providers in `src/providers/global/`, `src/providers/route/`, and `src/providers/local/` for cross-component UI state.
- Use RxJS `BehaviorSubject` and Observable streams for service state, preferences, relay connection state, and live data.
- Use Applesauce `EventStore` in `src/services/event-store.ts` as the central in-memory Nostr event state.
- Use Capacitor Preferences, IndexedDB, native SQLite, and cache adapters for persistent state.

## Key Abstractions

**EventStore Singleton:**
- Purpose: Central in-memory Nostr event database with verification hook and query APIs.
- Examples: `src/services/event-store.ts`, `src/providers/global/index.tsx`, `src/views/home/index.tsx`.
- Pattern: Module-level singleton injected into React through `EventStoreProvider`.

**RelayPool Singleton:**
- Purpose: Shared relay connection manager for requests, live subscriptions, notices, liveness, and publishing.
- Examples: `src/services/pool.ts`, `src/services/loaders.ts`, `src/services/actions.ts`.
- Pattern: Module-level singleton with RxJS observables for connection state.

**Applesauce Loaders:**
- Purpose: Encapsulate request/cache/EventStore loading for events, addresses, profiles, timelines, reactions, zaps, and outbox timelines.
- Examples: `src/services/loaders.ts`, `src/hooks/use-timeline-loader.ts`, `src/hooks/use-outbox-timeline-loader.ts`.
- Pattern: Loader factory functions configured with `pool`, `eventStore`, `cacheRequest`, and fallback relays.

**Feature Route Modules:**
- Purpose: Keep each page family self-contained with route config, views, and local components.
- Examples: `src/views/torrents/routes.tsx`, `src/views/wallet/routes.tsx`, `src/views/settings/routes.tsx`.
- Pattern: `routes.tsx` exports `RouteObject[]`; `index.tsx` is the default list/home page for the feature.

**PreferenceSubject:**
- Purpose: Reactive preference wrapper that persists values to Capacitor Preferences while exposing `BehaviorSubject` semantics.
- Examples: `src/classes/preference-subject.ts`, `src/services/preferences.ts`.
- Pattern: Static async constructors create typed settings; `next` persists before notifying subscribers.

**Event Cache Interface:**
- Purpose: Abstract interchangeable event cache backends.
- Examples: `src/services/event-cache/interface.ts`, `src/services/event-cache/nostr-idb.ts`, `src/services/event-cache/wasm-worker.ts`, `src/services/event-cache/native-sqlite.ts`.
- Pattern: Dynamic module loading in `src/services/event-cache/index.ts` behind `EventCache` read/write/clear shape.

## Entry Points

**Web application:**
- Location: `src/index.tsx`
- Triggers: Vite loads the script referenced by `index.html`.
- Responsibilities: Initialize runtime side effects, mount React, register service worker.

**Router configuration:**
- Location: `src/app.tsx`
- Triggers: Rendered by `src/index.tsx`.
- Responsibilities: Define route tree, choose layout wrappers, provide suspense/error handling.

**PWA service worker:**
- Location: `src/sw/worker/sw.ts`
- Triggers: Registered by `src/services/worker.ts` using `virtual:pwa-register` and configured in `vite.config.ts`.
- Responsibilities: Precache, SPA navigation fallback, cache RPC handlers, worker error handling.

**Vite build config:**
- Location: `vite.config.ts`
- Triggers: `pnpm dev`, `pnpm build`, Vite tooling.
- Responsibilities: React plugin, tsconfig paths, PWA manifest/service worker, build target, manual Capacitor chunk.

**Capacitor config:**
- Location: `capacitor.config.ts`
- Triggers: Capacitor sync/build commands.
- Responsibilities: Native app identity and web asset/native bridge settings.

**Android shell:**
- Location: `android/app/src/main/java/earth/satellite/MainActivity.java`
- Triggers: Android app launch.
- Responsibilities: Host Capacitor WebView and native plugins.

**iOS shell:**
- Location: `ios/App/App/AppDelegate.swift`
- Triggers: iOS app launch.
- Responsibilities: Host Capacitor WebView and native plugins.

## Architectural Constraints

- **Threading:** Main React app is single-threaded browser JavaScript; separate workers are used for PWA service worker code in `src/sw/worker/sw.ts` and WASM relay cache in `src/services/event-cache/wasm-worker.ts`.
- **Global state:** Module-level singletons are intentional in `src/services/event-store.ts`, `src/services/pool.ts`, `src/services/accounts.ts`, `src/services/actions.ts`, `src/services/preferences.ts`, and `src/services/event-cache/index.ts`.
- **Circular imports:** No confirmed circular dependency chain is documented in the repo. Keep helpers independent from views/components to avoid view-helper cycles.
- **Top-level await:** Several services initialize at module load using top-level await, including `src/services/accounts.ts`, `src/services/preferences.ts`, `src/services/database/index.ts`, and cache adapters under `src/services/event-cache/`.
- **Storage portability:** Code must branch on `CAP_IS_WEB` and `CAP_IS_NATIVE` from `src/env.ts` before using web-only or native-only storage/worker features.
- **Route provider placement:** Contexts that require router APIs must live under `RouteProviders` in `src/providers/route/index.tsx`, not `GlobalProviders` in `src/providers/global/index.tsx`.

## Anti-Patterns

### Event Parsing in UI Components

**What happens:** UI components directly search `event.tags` for domain fields instead of using helpers.
**Why it's wrong:** Tag semantics become duplicated across views and are harder to validate consistently.
**Do this instead:** Put constants, getters, and validators in `src/helpers/nostr/<feature>.ts`, following `src/helpers/nostr/torrents.ts`, then import those helpers from `src/views/<feature>/` and `src/components/`.

### Per-Component Relay Pools or EventStores

**What happens:** New code creates its own `RelayPool` or `EventStore` inside a component or hook.
**Why it's wrong:** Duplicate pools fragment subscriptions, cache writes, event verification, and connection status.
**Do this instead:** Import `pool` from `src/services/pool.ts` and `eventStore` from `src/services/event-store.ts`, or consume them through Applesauce providers/hooks configured in `src/providers/global/index.tsx`.

### Route Components Owning Shared Service State

**What happens:** A view implements persistence, relay lookup, account management, or cache selection inline.
**Why it's wrong:** Settings and service state become unavailable to other views and cannot be managed by background subscriptions.
**Do this instead:** Put shared state in `src/services/`, expose React access through `src/hooks/`, and keep the view focused on rendering and route-level filtering.

### Cache Backend Direct Imports from Feature Code

**What happens:** A feature imports `src/services/event-cache/nostr-idb.ts` or `src/services/event-cache/wasm-worker.ts` directly for normal reads/writes.
**Why it's wrong:** Direct imports bypass runtime cache selection and may load unsupported native/web modules.
**Do this instead:** Use `cacheRequest`, `writeEvent`, `getEvents`, or `eventCache$` from `src/services/event-cache/index.ts`; direct backend imports are reserved for cache settings diagnostics such as `src/views/settings/cache/database/internal.tsx`.

## Error Handling

**Strategy:** Use error boundaries for render failures, toasts for user-facing action failures, Observable fallbacks for stream failures, and console/debug logging for infrastructure failures.

**Patterns:**
- Wrap the app with `<ErrorBoundary>` in `src/app.tsx:144` and use feature boundaries for detail pages that parse events.
- Use Chakra `useToast` for direct user actions, as in `src/views/torrents/index.tsx:24` through `src/views/torrents/index.tsx:39`.
- Return `EMPTY`, `NEVER`, or caught fallback values for optional streams in `src/services/event-cache/index.ts:101`, `src/views/home/index.tsx:50`, and `src/services/local-relay.ts:7`.
- Use scoped debug loggers from `src/helpers/debug.ts` in services such as `src/services/pool.ts`, `src/services/database/index.ts`, and `src/services/worker.ts`.

## Cross-Cutting Concerns

**Logging:** Use the debug logger helper from `src/helpers/debug.ts`; services create scoped loggers such as `logger.extend("Database")` in `src/services/database/index.ts:19` and `logger.extend("ServiceWorker")` in `src/services/worker.ts:5`.
**Validation:** Nostr event validation belongs in helpers such as `src/helpers/nostr/torrents.ts:61`; cryptographic event verification is enforced in `src/services/event-store.ts:8` through `src/services/verify-event.ts`.
**Authentication:** Account and signer state is centralized in `src/services/accounts.ts`; signer methods for Nostr Connect are wired at `src/services/accounts.ts:14`, and global React access comes from `AccountsProvider` in `src/providers/global/index.tsx:30`.

---

*Architecture analysis: 2026-07-29*
