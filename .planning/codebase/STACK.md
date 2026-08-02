# Technology Stack

**Analysis Date:** 2026-07-29

## Languages

**Primary:**

- TypeScript 5.9.3 - Browser, service worker, Capacitor configuration, and all application source under `src/`; strict mode is enabled in `tsconfig.json`.
- TSX / React JSX - Page-level views and reusable UI components under `src/views/`, `src/components/`, and `src/providers/`.

**Secondary:**

- JavaScript / Node ESM - Build scripts and package scripts, including `scripts/build-icons.mjs` referenced by `package.json`.
- Swift - iOS Capacitor shell in `ios/App/App/AppDelegate.swift` and Xcode project files under `ios/App/`.
- Java - Android Capacitor host entry point in `android/app/src/main/java/earth/satellite/MainActivity.java`.
- Gradle Groovy - Android native build configuration in `android/build.gradle`, `android/app/build.gradle`, and `android/variables.gradle`.
- Ruby DSL - CocoaPods dependencies in `ios/App/Podfile`.

## Runtime

**Environment:**

- Browser runtime - Main React app starts in `src/index.tsx`; supported build targets are Chrome 89, Edge 89, Firefox 89, and Safari 15 in `vite.config.ts`.
- Service Worker runtime - PWA worker entry is `src/sw/worker/sw.ts`; registration is handled by `src/services/worker.ts`.
- Capacitor 7 native runtime - Platform detection is centralized in `src/env.ts`; native app metadata and plugin settings live in `capacitor.config.ts`.
- Android runtime - Android Gradle plugin 8.7.2, compile SDK 35, target SDK 35, min SDK 23 configured in `android/build.gradle` and `android/variables.gradle`.
- iOS runtime - iOS deployment target 14.0 configured in `ios/App/Podfile`.

**Package Manager:**

- pnpm 11.2.2 - Declared by `package.json` `packageManager`.
- Lockfile: present (`pnpm-lock.yaml`, lockfile version 9.0).

## Frameworks

**Core:**

- React 19.2.8 - UI rendering via `createRoot` in `src/index.tsx`; routes are rendered by `src/app.tsx`.
- React Router 6.30.4 - Browser routing via `createBrowserRouter` in `src/app.tsx`.
- Chakra UI 2.10.10 - Component system and theming used across `src/components/`, `src/views/`, and `src/theme/`.
- Vite 8.1.5 - Development server and production bundler configured in `vite.config.ts`.
- Capacitor 7.6.x - Native Android/iOS shell and plugins configured in `capacitor.config.ts`, `android/`, and `ios/App/Podfile`.
- Applesauce 6.x packages - Nostr data, accounts, relays, loaders, actions, signing, SQLite cache, and wallet abstractions in `src/services/*`, `src/models/*`, and hooks using `applesauce-react`.
- RxJS 7.8.2 - Reactive service and state streams in `src/services/pool.ts`, `src/services/preferences.ts`, `src/services/wallets.ts`, and loaders.

**Testing:**

- Not detected for the web app. No Jest/Vitest/Mocha dependency or root test script exists in `package.json`.
- Android template test dependencies exist in `android/app/build.gradle` (`junit`, AndroidX JUnit, Espresso) with generated example test files under `android/app/src/test/` and `android/app/src/androidTest/`.

**Build/Dev:**

- TypeScript compiler 5.9.3 - `pnpm build` runs `tsc --project tsconfig.json` before Vite bundling.
- `@vitejs/plugin-react` 6.0.4 - React transform configured in `vite.config.ts`.
- `vite-tsconfig-paths` 6.1.1 - Enables `~/*` path alias from `tsconfig.json`.
- `vite-plugin-pwa` 1.3.0 - Inject-manifest PWA build configured in `vite.config.ts` with `src/sw/worker/sw.ts` as the worker source.
- Workbox 7.x - Precaching and routing in `vite.config.ts` and `src/sw/worker/sw.ts`.
- Prettier 3.9.6 - Formatting script is `pnpm format` in `package.json`; config file is `.prettierrc`.
- Changesets 2.31.1 - Release metadata uses `.changeset/` and `@changesets/cli` in `package.json`.
- Capacitor CLI/assets - Native sync and icon generation scripts are `build-native-icons` and `cap-sync-version` in `package.json`.

## Key Dependencies

**Critical:**

- `nostr-tools` 2.23.5 - Core Nostr event, key, NIP-19, NIP-98, and protocol types throughout `src/helpers/`, `src/services/`, and `src/views/`.
- `applesauce-core` 6.2.0 - In-memory `EventStore` in `src/services/event-store.ts`, model abstraction in `src/models/*`, and event helpers.
- `applesauce-relay` 6.2.1 - `RelayPool`, `Relay`, and relay liveness in `src/services/pool.ts` and event-cache relay adapters.
- `applesauce-accounts` 6.2.0 - Account manager and account types in `src/services/accounts.ts` and signin flows in `src/views/signin/`.
- `applesauce-signers` 6.2.2 - NIP-07, Nostr Connect, serial, password, and authentication signer implementations in `src/views/signin/*` and `src/services/authentication-signer.ts`.
- `applesauce-loaders` 6.2.0 - Nostr loaders, including NIP-05 DNS identity loading in `src/services/dns-identity-loader.ts`.
- `applesauce-react` 6.0.0 - React hooks such as `useEventModel`, `use$`, and account hooks across `src/views/` and `src/hooks/`.
- `applesauce-wallet` 6.2.0 and `applesauce-wallet-connect` 6.2.0 - Cashu/NIP-60 wallet and Nostr Wallet Connect/NIP-47 backends in `src/services/wallets.ts` and `src/views/settings/wallet/`.
- `blossom-client-sdk` 5.0.0 - Blossom media upload, auth, mirroring, and content fallback handling in `src/helpers/media-upload/blossom.ts`, `src/components/timeline/note/components/share-modal.tsx`, and media link components.
- `@cashu/cashu-ts` 4.7.2 - Cashu token parsing and encoding in wallet views such as `src/views/wallet/components/receive-token-modal.tsx` and `src/views/wallet/tabs/tokens.tsx`.
- `@getalby/bitcoin-connect-react` 3.12.3 - Bitcoin Connect setup and WebLN provider injection in `src/index.tsx`.
- `@capacitor/core`, `@capacitor/app`, `@capacitor/preferences`, `@capacitor/share`, `@capacitor-community/sqlite`, `@capacitor-mlkit/barcode-scanning` - Native platform, app links, persistence, share sheet, SQLite cache, and QR/barcode scanning.

**Infrastructure:**

- `idb` 8.0.3 - Browser IndexedDB wrapper for app storage in `src/services/database/index.ts`.
- `nostr-idb` 5.1.0 - IndexedDB-backed Nostr event cache in `src/services/event-cache/nostr-idb.ts`.
- `@snort/worker-relay` 1.5.0 and `nostr-wasm` 0.1.0 - WASM/worker event cache and verification support used by event-cache modules and preferences.
- `localforage` 1.10.0 - Relay liveness persistence in `src/services/pool.ts`.
- `@capacitor/preferences` 7.0.4 - Cross-platform key/value settings persistence via `src/services/preferences.ts` and `src/classes/preference-subject.ts`.
- `@capacitor-community/sqlite` 7.0.3 and `applesauce-sqlite` 6.0.0 - Native SQLite event cache in `src/services/event-cache/native-sqlite.ts` and `src/services/sqlite/*`.
- `debug` 4.4.3 - Namespaced logging used by services and service worker (`src/sw/worker/sw.ts`).
- `dayjs` 1.11.21 - Date formatting initialized in `src/index.tsx`.
- `react-error-boundary` 4.1.2 - Error boundary wrappers via `src/components/error-boundary.tsx` and route-level usage.
- `react-hook-form` 7.83.0 - Form state in settings, wallet, profile, and posting views.
- `@uiw/react-codemirror`, `codemirror`, `codemirror-json-schema` - Code/editor UI in tools and napplet-related views.
- `hls.js`, `leaflet`, `chart.js`, `react-chartjs-2`, `react-window` - Media playback, maps, charts, and virtualization for specialized views.
- `@napplet/*`, `@kehto/*`, `@webxdc/types` - Napplet/webxdc app runtime and embedded app integration in `src/providers/global/napplet-shell-provider.tsx`, `src/components/napplets/`, and `src/views/webxdc/`.

## Configuration

**Environment:**

- Vite env vars are read from `process.env` only in `vite.config.ts` and logged when prefixed with `VITE_`; do not add secret values to `VITE_*` because they are client-exposed.
- `VITE_BASE` controls Vite `base` in `vite.config.ts`.
- `VITE_APP_VERSION` and `VITE_COMMIT_HASH` are displayed by `src/components/version-button.tsx`; `pnpm dev` sets `VITE_APP_VERSION=dev` in `package.json`.
- `VITE_TENOR_API_KEY` enables Tenor GIF picker integration via `src/const.ts` and `src/components/gif/tenor-gif-icon-button.tsx`.
- Docker/runtime globals are typed in `src/types/window.d.ts`: `window.CACHE_RELAY_ENABLED`, `window.IMAGE_PROXY_PATH`, and `window.REQUEST_PROXY`.
- User-controlled app settings are persisted through `@capacitor/preferences` in `src/services/preferences.ts`, including event cache mode, request/image proxies, relay settings, wallet settings, and Vertex settings.
- `.env` files: Not detected in repo root by mapping scan; continue to treat any `.env*` as secret configuration and do not commit values.

**Build:**

- `package.json` scripts: `start` (`vite serve`), `dev` (`VITE_APP_VERSION=dev vite serve`), `build` (`tsc --project tsconfig.json && vite build`), `format`, `analyze`, `build-icons`, `build-native-icons`, and `cap-sync-version`.
- `tsconfig.json` enables strict TS, `moduleResolution: Bundler`, DOM/WebWorker libs, React JSX transform, `noEmit`, and `~/*` alias to `src/*`.
- `vite.config.ts` sets browser build targets, sourcemaps, `global: "window"`, PWA inject-manifest options, and a manual `capacitor` chunk for Capacitor packages.
- `capacitor.config.ts` sets app id `ninja.nostrudel`, app name `noStrudel`, `webDir: "dist"`, cleartext/mixed-content allowances, Capacitor HTTP, and SQLite locations/encryption flags.
- `android/build.gradle`, `android/app/build.gradle`, and `android/variables.gradle` configure the Android native shell.
- `ios/App/Podfile` configures Capacitor iOS pods and native plugins.
- `public/.well-known/nostr.json` ships static well-known Nostr metadata with the web build.

## Platform Requirements

**Development:**

- Install dependencies with `pnpm install` and run locally with `pnpm run dev` as documented in `README.md`.
- Use Node.js compatible with Vite 8 and pnpm 11; no `.nvmrc` or explicit Node version file was detected.
- Browser features required by code paths include IndexedDB, WebSocket, WebCrypto, WebAssembly/Worker for WASM relay cache, service workers for PWA caching, optional Web Serial for signing devices, optional `window.nostr` for NIP-07, and optional `window.webln` for Lightning.
- Native development requires Capacitor 7 tooling plus Android SDK (compile/target SDK 35) or Xcode/CocoaPods for iOS target 14.0.

**Production:**

- Static web/PWA build output is `dist/` from Vite, with service worker generated through `vite-plugin-pwa`.
- Live instance documented in `README.md`: `https://nostrudel.ninja`.
- Docker image documented in `README.md`: `ghcr.io/hzrd149/nostrudel:master`, served on port 80 when run with Docker.
- Native production targets are Capacitor Android/iOS packages from `android/` and `ios/App/` using `dist/` as `webDir`.

---

_Stack analysis: 2026-07-29_
