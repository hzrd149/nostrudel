# Codebase Structure

**Analysis Date:** 2026-07-01

## Directory Layout

```
noStrudel/
├── src/                    # Application source (React + TypeScript SPA)
│   ├── app.tsx             # Route tree + app shell
│   ├── index.tsx           # Bootstrap / entry point
│   ├── env.ts              # Platform/env flags (CAP_IS_NATIVE, feature flags)
│   ├── const.ts             # App-wide constants
│   ├── polyfill.ts          # Runtime polyfills loaded first
│   ├── classes/             # Custom domain classes (accounts, signers, misc utils)
│   ├── components/          # Reusable UI components, one dir per feature/widget
│   ├── helpers/              # Pure utility functions (nostr, blossom, lightning, etc.)
│   ├── hooks/                # React hooks bridging RxJS/services into components
│   ├── lib/                  # Vendored/adapted third-party libraries
│   ├── models/                # Reactive read-projections over the EventStore
│   ├── providers/              # React context providers (global/local/route scoped)
│   ├── services/                # Singleton app-wide services (pool, store, cache, wallets)
│   ├── styles/                  # Global CSS-in-JS / style resets
│   ├── sw/                       # Service worker (worker/client/common)
│   ├── theme/                     # Chakra UI theme customization
│   ├── types/                      # Shared TypeScript type declarations
│   └── views/                       # Route-level pages, one dir per top-level route
├── android/                # Capacitor native Android wrapper project
├── ios/                    # Capacitor native iOS wrapper project (if present)
├── public/                 # Static assets served as-is
├── assets/                 # Source design assets (icons, etc.) for build-icons script
├── screenshots/            # README/marketing screenshots
├── scripts/                # Build/tooling scripts (e.g. build-icons.mjs)
├── .agents/skills/          # Agent skill references (e.g. applesauce SDK skill)
├── .claude/                 # Claude Code project config
├── .planning/                # GSD planning artifacts (this doc lives here)
├── .changeset/                # Changesets for versioning/changelog
├── .github/                    # CI workflows
├── docker-compose.yaml, dockerfile, docker-entrypoint.sh  # Container deployment
├── capacitor.config.ts       # Capacitor native app config
├── vite.config.ts             # Vite build config (PWA plugin, chunking)
├── tsconfig.json               # TypeScript config, path alias `~/*` -> `src/*`
└── package.json                  # Scripts and dependencies (pnpm)
```

## Directory Purposes

**`src/views/`:**
- Purpose: one directory per top-level route/feature (articles, badges, blossom, channels, messages, settings, streams, wallet, etc.)
- Contains: `index.tsx` (page component), `routes.tsx` (react-router `RouteObject[]` for the feature's sub-routes), `components/` (view-local components), nested route directories for sub-pages (e.g. `src/views/user/tabs/`, `src/views/settings/relays/`)
- Key files: `src/app.tsx` imports each feature's `routes.tsx` and mounts it under a path segment

**`src/components/`:**
- Purpose: shared, reusable UI components used across multiple views
- Contains: one subdirectory per feature/widget (`note/`, `timeline/`, `layout/`, `user/`, `zap/`, `wallet` bits under `cashu/`, `relay/`, `relays/`) each with its own `components/` for internals; some flat files for simple single-file components
- Key files: `src/components/layout/` (app shell/desktop/mobile layout), `src/components/error-boundary` (referenced from `app.tsx`), `src/components/timeline/` and `src/components/timeline-page/` (feed rendering)

**`src/services/`:**
- Purpose: singleton, app-wide infrastructure and domain services (no React dependency)
- Contains: flat `*.ts` files each exporting one default singleton (e.g. `pool.ts`, `event-store.ts`, `accounts.ts`, `actions.ts`, `preferences.ts`, `wallets.ts`, `social-graph.ts`), plus subfolders for multi-file concerns: `event-cache/` (pluggable local persistence backends), `sqlite/` (SQLite driver + migrations), `database/` (IndexedDB/localforage key-value wrapper), `notifications/`, `lookup/` (NIP-05/user lookup)
- Key files: `src/services/event-store.ts` (the single EventStore), `src/services/pool.ts` (RelayPool), `src/services/loaders.ts` (all data loaders), `src/services/actions.ts` (ActionHub wiring)

**`src/models/`:**
- Purpose: app-specific reactive query functions over the EventStore, consumed via `useEventModel`
- Contains: one file per data domain (`lists.ts`, `mutes.ts`, `messages.ts`, `badges.ts`, `stream.ts`, `event-zaps.ts`, `reactions.ts`, `app-settings.ts`, `outbox-selection.ts`, `trusted-mints.ts`, `blossom-servers.ts`, `dvm-responses.ts`, `channel-metadata.ts`, `group.ts`)
- Key files: `src/models/index.ts` (barrel export)

**`src/hooks/`:**
- Purpose: React hooks that adapt services/models/RxJS into component-friendly state
- Contains: flat `use-*.ts`/`use-*.tsx` files, plus `timeline/` subfolder for feed pagination hooks
- Key files: `src/hooks/timeline/` (timeline loading patterns reused by multiple feed views)

**`src/providers/`:**
- Purpose: React context providers grouped by scope
- Contains:
  - `global/` — mounted once at app root (`index.tsx`): theme, breakpoint, emoji, publish status, event store/accounts/actions providers
  - `local/` — mounted around specific feature subtrees (content settings, upload, thread, people-list, kind-selection, media-owner)
  - `route/` — mounted per route-tree via `RouteProviders` in `src/providers/route/index.tsx` (delete-event modal, mute modal, invoice modal, post modal, app-handler modal, debug modal, decryption-cache gate)

**`src/classes/`:**
- Purpose: custom class-based domain objects not provided by applesauce
- Contains: `accounts/android-signer-account.ts`, `signers/android-native-signer.ts`, plus utility classes at top level: `super-map.ts`, `preference-subject.ts`, `encrypted-storage.tsx`, `article-speech-reader.ts`

**`src/helpers/`:**
- Purpose: pure, stateless utility functions grouped by domain
- Contains: `nostr/` (nostr-specific helpers subfolder), `media-upload/` (upload helpers subfolder), flat files for blossom, lightning/lnurl, color, identicon, image, string, time-grouping, url, parse, request, debug (logger factory), applesauce (small applesauce glue helpers)

**`src/lib/`:**
- Purpose: vendored or heavily adapted third-party code not published as an npm package
- Contains: `qrcodegen.ts`, `bencode/`, `open-graph-scraper/`, `fix-image-orientation/`

**`src/sw/`:**
- Purpose: service worker implementation split by execution context
- Contains: `worker/` (runs in the SW: `sw.ts`, `cache.ts`, `error-handler.ts`, `rpc.ts`), `client/` (runs in the page, talks to SW: `cache.ts`, `error-logger.ts`, `rpc.ts`, `index.ts`), `common/` (shared RPC/interface types used by both sides)

**`src/theme/`:**
- Purpose: Chakra UI theme customization
- Contains: `default/` with a `components/` subfolder for per-component theme overrides

**`android/`, `ios/`:**
- Purpose: native Capacitor wrapper projects generated/maintained for native app distribution
- Generated: partially (native project scaffolding is generated by Capacitor CLI, but app-specific native code such as `android/app/src/main/java/earth/satellite` is hand-maintained)
- Committed: yes

## Key File Locations

**Entry Points:**
- `src/index.tsx`: app bootstrap, mounts React root, registers service worker and protocol handlers
- `src/app.tsx`: route tree definition and app shell (`App` component)
- `src/sw/worker/sw.ts`: service worker entry (built via `vite-plugin-pwa` injectManifest)

**Configuration:**
- `vite.config.ts`: build config, PWA plugin, manual chunking (Capacitor bundle isolation)
- `tsconfig.json`: path alias `~/*` → `src/*`, strict mode
- `capacitor.config.ts`: native app configuration
- `src/env.ts`: runtime platform/feature flags (`CAP_IS_NATIVE`, `CAP_IS_WEB`, `IS_SERVICE_WORKER_SUPPORTED`)
- `src/const.ts`: app-wide constants (default relays, kinds, limits)

**Core Logic:**
- `src/services/event-store.ts`: the single EventStore instance
- `src/services/pool.ts`: RelayPool + connection/notice tracking
- `src/services/loaders.ts`: all data-loading observables
- `src/services/actions.ts`: ActionHub wiring for writes
- `src/services/accounts.ts`: AccountManager for signed-in identities
- `src/services/event-cache/`: pluggable local persistence

**Testing:**
- Not detected — no dedicated test directory or `*.test.*`/`*.spec.*` files found under `src/`. See TESTING.md (quality focus) for confirmation and details.

## Naming Conventions

**Files:**
- kebab-case for all TypeScript/TSX files: `use-event-zaps.ts`, `note-published-using.tsx`, `direct-message-form.tsx`
- React hooks always prefixed `use-`: `src/hooks/use-*.ts`
- Route definition files always named `routes.tsx` inside each feature's `src/views/<feature>/` directory
- Page/entry component for a feature directory is `index.tsx`

**Directories:**
- Feature/domain-named, singular or plural matching the domain concept (`note/`, `relays/`, `messages/`, `wallet/`)
- Nested `components/` subdirectory holds internals private to that view/component (e.g. `src/views/articles/components/`, `src/components/timeline/note/components/`)
- Nested `tabs/` subdirectory for tabbed sub-views within a feature (e.g. `src/views/wallet/tabs/`, `src/views/relays/relay/tabs/`)

## Where to Add New Code

**New top-level route/feature:**
- Create `src/views/<feature>/index.tsx` (landing page) and `src/views/<feature>/routes.tsx` (exporting `RouteObject[]`)
- Register the path in `src/app.tsx` (`import <feature>Routes from "./views/<feature>/routes"` and add `{ path: "<feature>", children: <feature>Routes }`)
- Feature-local components go in `src/views/<feature>/components/`

**New shared UI component:**
- Add under `src/components/<feature>/` if it belongs to an existing feature area, or create a new top-level folder under `src/components/` for a new cross-cutting widget
- Icons go in `src/components/icons/svg/`

**New service/singleton state:**
- Add a new file in `src/services/` exporting a default singleton instance, following the pattern in `src/services/pool.ts`/`event-store.ts`
- If it needs multiple files, create a subfolder (see `src/services/event-cache/`, `src/services/lookup/` as examples)

**New reactive read-model:**
- Add a file in `src/models/` following the pattern in existing files (e.g. `src/models/mutes.ts`), export from `src/models/index.ts`

**New React hook:**
- Add `src/hooks/use-<name>.ts` (or `.tsx` if it returns JSX); timeline-specific hooks go in `src/hooks/timeline/`

**Utilities:**
- Pure, stateless helpers: `src/helpers/<domain>.ts` (create a subfolder if multi-file, as with `src/helpers/nostr/` and `src/helpers/media-upload/`)
- Vendored/adapted third-party code with no natural npm home: `src/lib/<name>/`

**Custom account/signer types:**
- `src/classes/accounts/` and `src/classes/signers/`, following `android-signer-account.ts`/`android-native-signer.ts`

## Special Directories

**`src/sw/`:**
- Purpose: service worker source, built into the PWA's `sw.js` via `vite-plugin-pwa` injectManifest
- Generated: no (source is hand-written; the final `sw.js` bundle is generated at build time)
- Committed: yes (source only)

**`android/`, `ios/`:**
- Purpose: native Capacitor projects for app-store distribution
- Generated: scaffolding generated by Capacitor CLI; app-specific native code is committed
- Committed: yes

**`dist/`:**
- Purpose: Vite production build output
- Generated: yes
- Committed: no

**`.planning/`:**
- Purpose: GSD planning artifacts (phase plans, codebase maps)
- Generated: partially (written by GSD tooling)
- Committed: yes (per project convention)

**`.agents/skills/`:**
- Purpose: local agent skill definitions (e.g. `applesauce` SDK reference skill) used by Claude Code to understand the applesauce framework in depth
- Generated: no
- Committed: yes

---

*Structure analysis: 2026-07-01*
