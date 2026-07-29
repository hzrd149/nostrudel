# Codebase Structure

**Analysis Date:** 2026-07-29

## Directory Layout

```text
noStrudel/
├── src/                    # React/TypeScript application source
│   ├── app.tsx             # Router and app shell
│   ├── index.tsx           # Browser/native bootstrap entry
│   ├── env.ts              # Capacitor/platform feature flags
│   ├── assets/             # Static assets imported by source
│   ├── classes/            # Reusable class implementations
│   ├── components/         # Shared reusable UI components
│   ├── helpers/            # Pure helpers and Nostr protocol helpers
│   ├── hooks/              # React hooks for app/service data
│   ├── lib/                # Vendored or low-level utility libraries
│   ├── models/             # Applesauce EventStore model queries
│   ├── providers/          # Global, route, and local React providers
│   ├── services/           # Singleton services and business logic
│   ├── styles/             # Global style modules
│   ├── sw/                 # Service worker client/common/worker code
│   ├── theme/              # Chakra UI theme customizations
│   ├── types/              # Ambient TypeScript declarations
│   └── views/              # Route-level feature pages
├── android/                # Capacitor Android native project
├── ios/                    # Capacitor iOS native project
├── assets/                 # Root-level generated/source app assets
├── screenshots/            # README/project screenshots
├── dist/                   # Built web output
├── .github/workflows/      # CI and deployment workflows
├── .changeset/             # Changeset release notes/config
├── .planning/codebase/     # Generated GSD codebase maps
├── package.json            # Scripts and npm dependencies
├── pnpm-lock.yaml          # pnpm lockfile
├── vite.config.ts          # Vite/PWA/build configuration
├── tsconfig.json           # TypeScript configuration and `~/*` path alias
├── capacitor.config.ts     # Capacitor app configuration
├── dockerfile              # Docker image build
├── docker-compose.yaml     # Local service composition example
└── index.html              # Vite HTML entry
```

## Directory Purposes

**`src/`:**
- Purpose: All web application TypeScript and React source.
- Contains: Entry files, app shell, feature views, shared components, hooks, helpers, services, models, providers, theme, service worker code.
- Key files: `src/index.tsx`, `src/app.tsx`, `src/env.ts`, `src/const.ts`.

**`src/views/`:**
- Purpose: Route-level feature modules.
- Contains: Page components, nested `routes.tsx` files, feature-local components, tabs, detail pages, create forms.
- Key files: `src/views/home/index.tsx`, `src/views/torrents/routes.tsx`, `src/views/settings/routes.tsx`, `src/views/user/routes.tsx`.

**`src/components/`:**
- Purpose: Shared UI used by multiple views.
- Contains: Layout components, timeline renderers, note/content rendering, modals, forms, user widgets, relay widgets, media components, wallet/cashu widgets.
- Key files: `src/components/layout/index.tsx`, `src/components/timeline-page/index.tsx`, `src/components/error-boundary.tsx`, `src/components/vertical-page-layout.tsx`.

**`src/hooks/`:**
- Purpose: React-facing adapters for services, EventStore, route state, local browser state, and reusable UI behavior.
- Contains: Timeline loaders, user/profile hooks, relay hooks, wallet hooks, route parameter/search helpers, upload hooks, mute/read status hooks.
- Key files: `src/hooks/use-timeline-loader.ts`, `src/hooks/use-outbox-timeline-loader.ts`, `src/hooks/use-client-relays.ts`, `src/hooks/use-params-event-pointer.ts`.

**`src/helpers/`:**
- Purpose: Pure utility functions and protocol helpers that are not React components.
- Contains: Generic helpers and `src/helpers/nostr/` event-specific helpers.
- Key files: `src/helpers/nostr/event.ts`, `src/helpers/nostr/profile.ts`, `src/helpers/nostr/torrents.ts`, `src/helpers/nip19.ts`, `src/helpers/applesauce.ts`.

**`src/models/`:**
- Purpose: Applesauce model query wrappers consumed by `useEventModel` and EventStore model APIs.
- Contains: Query functions for reactions, mutes, lists, messages, badges, streams, app settings, outbox selection, and related projections.
- Key files: `src/models/index.ts`, `src/models/reactions.ts`, `src/models/outbox-selection.ts`, `src/models/messages.ts`.

**`src/providers/`:**
- Purpose: React context providers grouped by required scope.
- Contains: `global/` providers close to root, `route/` providers under router, and `local/` providers for feature-local state.
- Key files: `src/providers/global/index.tsx`, `src/providers/route/index.tsx`, `src/providers/local/people-list-provider.tsx`, `src/providers/local/intersection-observer.tsx`.

**`src/services/`:**
- Purpose: Singleton services, persistence, relay IO, account/signing, cache, lookup, wallet, and background business logic.
- Contains: Top-level service modules plus subdirectories for database, event cache, notifications, lookup, and SQLite.
- Key files: `src/services/event-store.ts`, `src/services/pool.ts`, `src/services/accounts.ts`, `src/services/actions.ts`, `src/services/loaders.ts`, `src/services/preferences.ts`.

**`src/services/event-cache/`:**
- Purpose: Runtime-selectable event cache backends.
- Contains: Common interface, orchestrator, and adapters for hosted relay, local relay, native SQLite, `nostr-idb`, and WASM worker.
- Key files: `src/services/event-cache/index.ts`, `src/services/event-cache/interface.ts`, `src/services/event-cache/nostr-idb.ts`, `src/services/event-cache/wasm-worker.ts`, `src/services/event-cache/native-sqlite.ts`.

**`src/services/database/`:**
- Purpose: IndexedDB app database and legacy data migrations.
- Contains: DB open/migration logic, schema types, key-value helpers.
- Key files: `src/services/database/index.ts`, `src/services/database/schema.ts`, `src/services/database/kv.ts`.

**`src/sw/`:**
- Purpose: Service worker implementation and main-thread client APIs.
- Contains: `client/` utilities, `common/` RPC contracts/client/server, `worker/` service worker modules.
- Key files: `src/sw/worker/sw.ts`, `src/sw/worker/cache.ts`, `src/sw/common/rpc-client.ts`, `src/sw/common/rpc-server.ts`, `src/sw/client/index.ts`.

**`src/theme/`:**
- Purpose: Chakra UI theme construction and component overrides.
- Contains: Theme entry point, default theme tokens, container/drawer overrides, helper functions.
- Key files: `src/theme/index.ts`, `src/theme/container.ts`, `src/theme/drawer.ts`, `src/theme/default/`.

**`src/classes/`:**
- Purpose: Reusable class abstractions that do not fit hooks/services.
- Contains: Account classes, signer classes, encrypted storage, preference subject, utility maps, article speech reader.
- Key files: `src/classes/preference-subject.ts`, `src/classes/encrypted-storage.tsx`, `src/classes/accounts/`, `src/classes/signers/`.

**`src/lib/`:**
- Purpose: Low-level helper libraries and vendored-style utilities.
- Contains: Bencode, image orientation fixing, open graph scraper, QR code generator.
- Key files: `src/lib/qrcodegen.ts`, `src/lib/bencode/`, `src/lib/fix-image-orientation/`, `src/lib/open-graph-scraper/`.

**`src/types/`:**
- Purpose: Ambient declarations for browser/global integrations.
- Contains: Extension, WebLN, and window type augmentations.
- Key files: `src/types/nostr-extensions.d.ts`, `src/types/webln.d.ts`, `src/types/window.d.ts`.

**`android/` and `ios/`:**
- Purpose: Capacitor native app projects.
- Contains: Native build files, app delegates/activities, resources, icons, splash screens.
- Key files: `android/app/src/main/java/earth/satellite/MainActivity.java`, `android/app/src/main/AndroidManifest.xml`, `ios/App/App/AppDelegate.swift`, `ios/App/App/Info.plist`.

## Key File Locations

**Entry Points:**
- `src/index.tsx`: Main React bootstrap and service worker registration.
- `src/app.tsx`: Router tree and top-level app component.
- `index.html`: Vite HTML entry containing the `#root` mount target.
- `src/sw/worker/sw.ts`: PWA service worker entry configured by Vite PWA.
- `android/app/src/main/java/earth/satellite/MainActivity.java`: Android native entry activity.
- `ios/App/App/AppDelegate.swift`: iOS native application delegate.

**Configuration:**
- `package.json`: Scripts, package manager, dependencies, project metadata.
- `tsconfig.json`: TypeScript strict settings and `~/*` alias to `src/*`.
- `vite.config.ts`: Vite, React, tsconfig-paths, PWA manifest/service worker, and build output configuration.
- `capacitor.config.ts`: Capacitor app configuration.
- `.prettierrc`: Formatting configuration.
- `pnpm-workspace.yaml`: Workspace configuration.
- `.github/workflows/`: Docker image, Pages, release, and nsite workflows.

**Core Logic:**
- `src/services/event-store.ts`: Singleton Applesauce EventStore and verification policy.
- `src/services/pool.ts`: Singleton RelayPool, relay liveness, connection state, notices, request helper.
- `src/services/loaders.ts`: Shared profile/address/event/reaction/zap/social graph loaders.
- `src/services/actions.ts`: Applesauce ActionHub and publish callback.
- `src/services/accounts.ts`: Account manager, signer setup, account persistence/migration.
- `src/services/preferences.ts`: Reactive app settings backed by Capacitor Preferences.
- `src/services/event-cache/index.ts`: Active event cache selection, buffered writes, cache reads.
- `src/hooks/use-timeline-loader.ts`: Generic historical timeline loader hook.
- `src/hooks/use-outbox-timeline-loader.ts`: Outbox-aware timeline loader hook.

**Feature Implementation:**
- `src/views/<feature>/index.tsx`: Main feature route/page.
- `src/views/<feature>/routes.tsx`: Nested route definitions when a feature has multiple pages.
- `src/views/<feature>/components/`: Components only used by that feature.
- `src/views/<feature>/tabs/`: Tab pages for tabbed features such as `src/views/wallet/tabs/` and `src/views/user/tabs/`.
- `src/helpers/nostr/<feature>.ts`: Event kind constants, tag getters, and validation for feature-specific Nostr event types.

**Testing:**
- `android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java`: Android template unit test.
- `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`: Android template instrumented test.
- JavaScript/TypeScript test files and test runner configuration: Not detected in the source tree.

## Naming Conventions

**Files:**
- Use kebab-case for source files: `src/hooks/use-timeline-loader.ts`, `src/components/compact-note-content.tsx`, `src/views/settings/use-settings-form.ts`.
- Use `index.tsx` for a directory's main React module: `src/views/home/index.tsx`, `src/components/layout/index.tsx`, `src/components/timeline-page/index.tsx`.
- Use `routes.tsx` for nested React Router route arrays: `src/views/torrents/routes.tsx`, `src/views/settings/routes.tsx`.
- Use `.ts` for non-JSX services/helpers/models: `src/services/pool.ts`, `src/helpers/nostr/torrents.ts`, `src/models/reactions.ts`.
- Use `.tsx` for React components/providers/hooks that return JSX: `src/providers/global/index.tsx`, `src/views/torrents/index.tsx`.

**Directories:**
- Use kebab-case for feature/component directories: `src/views/other-stuff/`, `src/views/task-manager/`, `src/components/people-list-selection/`.
- Use feature folders under `src/views/` for route families: `src/views/torrents/`, `src/views/wallet/`, `src/views/settings/`.
- Use scope folders under `src/providers/`: `src/providers/global/`, `src/providers/route/`, `src/providers/local/`.
- Use backend folders under `src/services/` when a service has multiple implementations: `src/services/event-cache/`, `src/services/database/`, `src/services/notifications/`.

## Where to Add New Code

**New Feature:**
- Primary code: create `src/views/<feature>/index.tsx` and, if there are multiple pages, `src/views/<feature>/routes.tsx`.
- Register route: import the route module or view in `src/app.tsx` and add it to the `children` array near related routes.
- Feature helpers: create `src/helpers/nostr/<feature>.ts` for event kinds, tag extraction, and validation before building UI.
- Feature components: place feature-only components in `src/views/<feature>/components/`.
- Shared UI promoted from feature code: move to `src/components/<component-name>/` or `src/components/<component-name>.tsx`.
- Tests: JavaScript/TypeScript test structure is not detected; if tests are added, colocate feature tests beside source or establish a repo-wide test convention first.

**New Component/Module:**
- Shared component implementation: `src/components/<domain>/<component-name>.tsx` for domain-specific widgets, or `src/components/<component-name>.tsx` for small generic components.
- Component directory entry: use `src/components/<component-name>/index.tsx` when the component has subcomponents or companion files.
- Feature-local component: `src/views/<feature>/components/<component-name>.tsx`.
- Layout/navigation component: `src/components/layout/` or `src/components/navigation/`.

**Utilities:**
- Generic pure helper: `src/helpers/<name>.ts`.
- Nostr event helper: `src/helpers/nostr/<feature-or-kind>.ts`.
- React hook: `src/hooks/use-<name>.ts` or `src/hooks/use-<name>.tsx` if it returns JSX.
- EventStore model: `src/models/<name>.ts` and export it from `src/models/index.ts` when shared.
- Singleton service: `src/services/<name>.ts`.
- Service with multiple backends: `src/services/<name>/index.ts` plus implementation files in that folder.
- Ambient type augmentation: `src/types/<name>.d.ts`.

**New Nostr Data Flow:**
- Event kind/tag helpers: `src/helpers/nostr/<feature>.ts`.
- Query projection: `src/models/<feature>.ts` when data is derived from EventStore.
- Loader integration: prefer existing loaders in `src/services/loaders.ts`; add new configured loader there only when multiple features need it.
- Timeline view: use `src/hooks/use-timeline-loader.ts` for generic relays or `src/hooks/use-outbox-timeline-loader.ts` for NIP-65/outbox-based timelines.
- Live subscription: use patterns from `src/services/outbox-subscriptions.ts` and consume results from EventStore rather than local component arrays.

**New Persistence or Integration:**
- User/app preference: add a `PreferenceSubject` in `src/services/preferences.ts`.
- Legacy IndexedDB store/migration: update `src/services/database/index.ts` and `src/services/database/schema.ts`.
- Event cache backend: add an adapter in `src/services/event-cache/<backend>.ts` that implements `src/services/event-cache/interface.ts`, then register it in `src/services/event-cache/index.ts`.
- Service worker functionality: add shared types in `src/sw/common/interface.ts`, worker handler in `src/sw/worker/`, and client wrapper in `src/sw/client/`.

## Special Directories

**`dist/`:**
- Purpose: Built web assets and PWA output.
- Generated: Yes.
- Committed: Present in repository.

**`node_modules/`:**
- Purpose: Installed npm dependencies.
- Generated: Yes.
- Committed: No.

**`.changeset/`:**
- Purpose: Release notes and versioning metadata for Changesets.
- Generated: Partially; change files are authored, release metadata is tool-managed.
- Committed: Yes.

**`.planning/codebase/`:**
- Purpose: GSD codebase mapping documents consumed by planning/execution agents.
- Generated: Yes.
- Committed: Project-dependent; current mapping files are present in the working tree.

**`.github/workflows/`:**
- Purpose: CI/CD workflows for Docker image, GitHub Pages, releases, and nsite deployment.
- Generated: No.
- Committed: Yes.

**`android/`:**
- Purpose: Capacitor Android native project and resources.
- Generated: Partially by Capacitor; native source/config is maintained.
- Committed: Yes.

**`ios/`:**
- Purpose: Capacitor iOS native project and resources.
- Generated: Partially by Capacitor/CocoaPods; native source/config is maintained.
- Committed: Yes.

**`src/sw/`:**
- Purpose: Source service worker modules and RPC helpers.
- Generated: No; built service worker output is generated into `dist/`.
- Committed: Yes.

---

*Structure analysis: 2026-07-29*
