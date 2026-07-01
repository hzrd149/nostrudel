# Technology Stack

**Analysis Date:** 2026-07-01

## Languages

**Primary:**
- TypeScript 5.9 (`tsconfig.json`, `strict: true`) - entire `src/` tree, compiled with `tsc --project tsconfig.json` before Vite build

**Secondary:**
- Shell (POSIX sh) - `docker-entrypoint.sh` (nginx config templating for Docker deployment)
- JavaScript (Node, ESM) - build scripts in `scripts/` (e.g. `scripts/build-icons.mjs`)

## Runtime

**Environment:**
- Browser (SPA/PWA) as primary target; Vite build target `["chrome89", "edge89", "firefox89", "safari15"]` (`vite.config.ts`)
- Node.js 24 (`.nvmrc` = `24`; Docker build image `node:24-alpine`)
- Native wrapper via Capacitor 7 for iOS/Android (`capacitor.config.ts`, `android/`, `ios/`)

**Package Manager:**
- pnpm (declared `packageManager: pnpm@11.2.2` in `package.json`; Dockerfile pins `pnpm@9.14.4` for the build image)
- Lockfile: present (`pnpm-lock.yaml`)
- Workspace config: `pnpm-workspace.yaml` (allows native builds for `better-sqlite3`/`sharp`, pins `nostr-tools` override to `2.23.5`, excludes several `applesauce-*` next-tag packages from minimum release age check)

## Frameworks

**Core:**
- React 19.2 (`react`, `react-dom`) - UI layer, `src/app.tsx`, `src/index.tsx`
- React Router 6.30 (`react-router`, `react-router-dom`) - client-side routing, `src/views/`
- Chakra UI 2.10 (`@chakra-ui/react` + related packages) - component library and theming, `src/theme/`
- Applesauce suite (`applesauce-core`, `applesauce-accounts`, `applesauce-actions`, `applesauce-common`, `applesauce-content`, `applesauce-loaders`, `applesauce-react`, `applesauce-relay`, `applesauce-signers`, `applesauce-sqlite`, `applesauce-wallet`, `applesauce-wallet-connect`, `applesauce-extra`) - Nostr event store, relay pool, account/signer management, wallet (NIP-60/NIP-47) abstractions. Most are pinned to a nightly tag `0.0.0-next-20260617211338`
- nostr-tools 2.23.5 (pinned via pnpm override) - low-level Nostr protocol utilities

**Testing:**
- Not detected - no test runner, `*.test.*`/`*.spec.*` files, or test script found in `package.json`

**Build/Dev:**
- Vite 8 (`vite.config.ts`) - dev server and production bundler
- `@vitejs/plugin-react` - React fast refresh/JSX transform
- `vite-tsconfig-paths` - resolves the `~/*` → `./src/*` path alias from `tsconfig.json`
- `vite-plugin-pwa` (injectManifest strategy) - builds the service worker from `src/sw/worker/sw.ts` using Workbox (`workbox-core`, `workbox-precaching`, `workbox-routing`, `workbox-build`, `workbox-window`)
- Prettier 3.8 (`.prettierrc`, `.prettierignore`) - code formatting (`pnpm format`)
- `@changesets/cli` - versioning/changelog management (`.changeset/`, `CHANGELOG.md`)
- Capacitor CLI/tooling (`@capacitor/cli`, `@capacitor/assets`) - native app packaging for iOS/Android

## Key Dependencies

**Critical (Nostr protocol / crypto):**
- `nostr-tools` 2.23.5 - event signing, NIP encodings, relay primitives
- `nostr-wasm` - WASM-accelerated event verification (`src/services/verify-event.ts`, `src/services/event-cache/wasm-worker.ts`)
- `@noble/curves`, `@noble/hashes`, `@noble/ciphers`, `@noble/secp256k1` - cryptography primitives (signing, NIP-04/NIP-44 encryption)
- `nostr-social-graph` - web-of-trust / social graph computation (`src/services/social-graph.ts`)
- `@snort/worker-relay` - WASM-backed local relay worker used for in-browser event caching (`src/services/event-cache/`)

**Wallet / Lightning / Cashu:**
- `@cashu/cashu-ts` - Cashu ecash mint/wallet client (`src/services/cashu-mints.ts`, `src/services/cashu-couch.ts`)
- `@getalby/bitcoin-connect`, `@getalby/bitcoin-connect-react` - Lightning wallet connect UI/flow
- `webln` - WebLN provider interface for browser Lightning wallets
- `applesauce-wallet`, `applesauce-wallet-connect` - NIP-60 (Cashu wallet) and NIP-47 (Nostr Wallet Connect) implementations (`src/services/wallets.ts`)

**Storage/Persistence:**
- `idb` - IndexedDB wrapper (`src/services/database/index.ts`)
- `localforage` - key/value storage abstraction (relay liveness cache, exchange rates cache)
- `@capacitor-community/sqlite` + `applesauce-sqlite` + `jeep-sqlite` - native SQLite storage on Capacitor platforms (`src/services/sqlite/`)
- `nostr-idb` - IndexedDB-backed Nostr event storage

**Media/Content:**
- `blossom-client-sdk` - Blossom (BUD) media server client (`src/helpers/blossom.ts`, `src/helpers/media-upload/blossom.ts`)
- `react-markdown`, `remark`, `remark-gfm`, `strip-markdown`, `unified` - Markdown rendering/parsing
- `hls.js` - HLS video streaming playback
- `gif-picker-react` - Tenor GIF picker UI (`src/components/gif/`)
- `emoji-mart` (`@emoji-mart/data`, `@emoji-mart/react`), `emoji-regex` - emoji picker/rendering
- `leaflet`, `leaflet.locatecontrol`, `ngeohash` - maps and geohash handling (NIP-52 calendar/location features)
- `chart.js`, `react-chartjs-2` - charts/graphs (relay/relationship stats)
- `@codemirror/*`, `@uiw/react-codemirror`, `codemirror-json-schema` - embedded code/JSON editors

**Capacitor native plugins:**
- `@capacitor/preferences`, `@capacitor/share`, `@capacitor-mlkit/barcode-scanning`, `nostr-signer-capacitor-plugin`, `@webxdc/types`

## Configuration

**Environment:**
- Vite env vars prefixed `VITE_*`, read via `import.meta.env` (e.g. `VITE_APP_VERSION`, `VITE_COMMIT_HASH`, `VITE_TENOR_API_KEY` in `src/const.ts`)
- Runtime (post-build) configuration is injected into `dist/index.html` by `docker-entrypoint.sh` via `sed` string replacement of placeholder globals (`REQUEST_PROXY`, `CACHE_RELAY_ENABLED`, `IMAGE_PROXY_PATH`, `PROXY_FIRST`) rather than rebuilding - allows one Docker image to be reconfigured at container start
- `src/env.ts` derives platform flags at runtime from `@capacitor/core` (`CAP_IS_WEB`, `CAP_IS_NATIVE`, `CAP_IS_ANDROID`, `CAP_IS_IOS`) and feature-detects WASM/Worker/storage support
- No `.env` file present in repo root; devs set `VITE_*` vars via shell or `.env.local` (not committed)

**Build:**
- `vite.config.ts` - manual chunking to isolate Capacitor modules (avoids circular-promise hangs per code comment), PWA manifest with custom protocol handlers (`web+nostr:`, `nostr:`)
- `tsconfig.json` - `strict: true`, ESNext target, path alias `~/*` → `src/*`, `noEmit: true` (Vite does the actual transpilation; `tsc` is used only for build-time type checking)
- `.prettierrc` / `.prettierignore` - formatting rules and excluded paths
- `capacitor.config.ts` - native app id `ninja.nostrudel`, enables `CapacitorHttp`, configures `CapacitorSQLite` per-platform storage locations

## Platform Requirements

**Development:**
- Node.js 24 (per `.nvmrc`)
- pnpm as package manager
- `pnpm run dev` starts Vite dev server with `VITE_APP_VERSION=dev`

**Production:**
- Static SPA build (`pnpm run build` → `dist/`) served behind nginx in the official Docker image (`dockerfile`, `nginx:stable-alpine-slim`)
- Optional companion services for self-hosted/Docker deployments (`docker-compose.yaml`): `nostr-rs-relay` (local cache relay), `imageproxy` (image resizing), `docker-cors-anywhere` (CORS/request proxy), `tor` and `i2p` proxies for onion/i2p relay access
- Deployable as PWA (installable, offline caching via Workbox) and as native iOS/Android apps via Capacitor

---

*Stack analysis: 2026-07-01*
