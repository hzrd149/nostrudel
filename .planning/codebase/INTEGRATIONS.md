# External Integrations

**Analysis Date:** 2026-07-29

## APIs & External Services

**Nostr Protocol / Relays:**

- Public and user-configured Nostr relays - Primary data transport for profiles, feeds, messages, reactions, lists, wallets, search, relay discovery, and publishing.
  - SDK/Client: `applesauce-relay`, `applesauce-loaders`, `applesauce-actions`, `nostr-tools`
  - Implementation: single `RelayPool` with liveness tracking in `src/services/pool.ts`; default relay constants in `src/const.ts`; loading/publishing helpers in `src/services/loaders.ts` and `src/services/actions.ts`.
  - Auth: NIP-42 authentication via active signer in `src/services/authentication-signer.ts`; behavior controlled by preferences in `src/services/preferences.ts`.
- Default search relays - Used for NIP-50-style content/user search.
  - SDK/Client: `RelayPool` / Nostr filters
  - Defaults: `wss://relay.nostr.band`, `wss://search.nos.today`, `wss://relay.noswhere.com`, `wss://filter.nostr.wine` in `src/const.ts`.
  - Auth: Nostr relay auth when required by relay.
- Lookup and fallback relays - Used for profiles, outboxes, and fallback event fetching.
  - SDK/Client: `applesauce-core` outbox helpers and `applesauce-relay`
  - Defaults: `wss://purplepag.es/`, `wss://index.hzrd149.com`, `wss://indexer.coracle.social`, `wss://relay.primal.net/`, `wss://nos.lol/` in `src/const.ts`.
  - Auth: Nostr relay auth when required by relay.
- Relay discovery relays and monitors - NIP-66 relay discovery.
  - SDK/Client: Nostr relay queries
  - Defaults: `wss://relay.nostr.watch/`, `wss://monitorlizard.nostr1.com/`, monitor pubkey in `src/const.ts`.
  - Auth: Nostr relay auth when required by relay.
- Local relay event cache - Optional local WebSocket relay cache.
  - SDK/Client: `applesauce-relay` `Relay`
  - Endpoint: `ws://localhost:4869/` in `src/const.ts`, adapter in `src/services/event-cache/local-relay.ts`.
  - Auth: None detected.
- Hosted relay cache - Optional same-origin relay endpoint for Docker/deployment cache.
  - SDK/Client: `applesauce-relay` `Relay`
  - Endpoint: `${wss/ws}://${location.host}/local-relay` in `src/services/event-cache/hosted-relay.ts`.
  - Auth: Controlled by deployment; client-side auth not detected.

**Identity, Search, and Discovery:**

- NIP-05 DNS identity lookup - Resolves `name@domain` identifiers.
  - SDK/Client: `applesauce-loaders/loaders/dns-identity-loader`
  - Implementation: `src/services/dns-identity-loader.ts` persists identities in IndexedDB and uses `fetchWithProxy` from `src/helpers/request.ts`.
  - Auth: None; optional HTTP request proxy configured by user/deployment.
- Primal cache / username lookup - Default username lookup provider stores configurable Primal cache URL.
  - SDK/Client: Nostr relay/client logic in lookup services and local preferences
  - Endpoint: default `wss://cache2.primal.net/v1` in `src/const.ts`; user setting `primal-cache-url` in `src/services/preferences.ts`.
  - Auth: Nostr relay auth if required.
- Vertex - Ranked user search and credit balance.
  - SDK/Client: dynamic `Vertex` import from `applesauce-extra`
  - Implementation: `src/services/lookup/vertex.ts`, configured in `src/views/settings/search/components/vertex-config.tsx` and status UI in `src/views/settings/search/components/vertex-status.tsx`.
  - Auth: active Nostr account signer passed to `new Vertex(account.signer, relay)`.
- Open Graph and generic HTTP fetches - URL metadata, media fetches, feeds, and external resources.
  - SDK/Client: browser `fetch`, custom `fetchWithProxy`
  - Implementation: proxy routing in `src/helpers/request.ts`; proxy may be `window.REQUEST_PROXY` or user setting `corsProxy`.
  - Auth: None unless target endpoint requires it.

**Media and Files:**

- Blossom media servers - User-configured media upload, mirroring, blob details, and media fallback.
  - SDK/Client: `blossom-client-sdk`
  - Implementation: `src/helpers/media-upload/blossom.ts`, `src/hooks/use-upload-file.ts`, media server settings in `src/views/settings/media-servers/index.tsx`, and mirroring in `src/components/timeline/note/components/share-modal.tsx`.
  - Auth: Blossom upload auth events signed by the active account via `createUploadAuth`; `always-auth-upload` setting in `src/services/preferences.ts`.
- Default Blossom server suggestions - Quick-add media servers.
  - SDK/Client: `blossom-client-sdk`
  - Endpoints: `https://nostr.download/` and `https://blossom.primal.net/` in `src/views/settings/media-servers/index.tsx`.
  - Auth: Active Nostr signer when upload auth is required.
- nostr.build - Optional legacy media upload service.
  - SDK/Client: browser `fetch`, `nostr-tools` NIP-98 token creation
  - Endpoint: `https://nostr.build/api/v2/upload/files` in `src/helpers/media-upload/nostr-build.ts`.
  - Auth: NIP-98 `Authorization` header when a signer is provided.
- Image proxy - Optional deployment/user image resize proxy.
  - SDK/Client: URL rewriting in `src/helpers/image.ts`
  - Endpoint: `window.IMAGE_PROXY_PATH` or user setting `imageProxy`.
  - Auth: None detected.
- Request/CORS proxy - Optional HTTP proxy for CORS, `.onion`, and `.i2p` access.
  - SDK/Client: browser `fetch`
  - Endpoint: `window.REQUEST_PROXY` or user setting `corsProxy` in `src/helpers/request.ts`.
  - Auth: None detected.
- Simple STL viewer script - External web component for STL rendering.
  - SDK/Client: dynamic script URL constant
  - Endpoint: `https://hzrd149.github.io/simple-stl-viewer/component.js` in `src/helpers/stl-viewer-loader.ts`.
  - Auth: None.

**GIF, Embeds, Maps, and Rich Content:**

- Tenor GIF search - Optional GIF picker when API key is configured.
  - SDK/Client: `gif-picker-react`
  - Implementation: `src/components/gif/tenor-gif-icon-button.tsx`; enabled by `TENOR_API_KEY` from `src/const.ts`.
  - Auth: `VITE_TENOR_API_KEY`.
- Nostr GIF fallback/search - In-app GIF picker from Nostr events when Tenor key is absent.
  - SDK/Client: Nostr relay search/timeline loader
  - Implementation: `src/components/gif/gif-picker-modal.tsx`.
  - Auth: Nostr relay auth if required.
- YouTube no-cookie embeds, CodePen embeds, Archive.org embeds, SimpleX links, nostrchat links, NIP documentation links - External content rendering and navigation.
  - SDK/Client: browser iframe/link rendering
  - Implementation: link components under `src/components/content/links/` and channel metadata links in `src/views/channels/components/channel-metadata-drawer.tsx`.
  - Auth: None detected.

**Lightning, Cashu, and Wallets:**

- WebLN providers - Lightning invoice payment and invoice generation through browser extensions or Bitcoin Connect.
  - SDK/Client: `webln`, `@getalby/bitcoin-connect-react`, `@getalby/bitcoin-connect`
  - Implementation: Bitcoin Connect initialization in `src/index.tsx`; WebLN backend in `src/services/wallets.ts`; invoice UI in `src/components/invoice-modal.tsx`.
  - Auth: WebLN provider permission prompt / extension authorization.
- Nostr Wallet Connect (NIP-47) - Remote Lightning wallet connection.
  - SDK/Client: `applesauce-wallet-connect`
  - Implementation: wallet backend in `src/services/wallets.ts`; wallet auth/connect flow in `src/views/settings/wallet/add-wallet-modal.tsx`.
  - Auth: NWC connection URI secret stored as `StoredNwcWallet.uri` through `src/services/preferences.ts`.
- Cashu / NIP-60 wallet - Ecash minting, token send/receive, melt payments, and wallet events.
  - SDK/Client: `applesauce-wallet`, `@cashu/cashu-ts`
  - Implementation: `NutWallet` backend in `src/services/wallets.ts`; wallet UI under `src/views/wallet/`; settings under `src/views/settings/wallet/`; mint controls under `src/components/cashu/`.
  - Auth: Active Nostr signer for encrypted wallet/token events; Cashu mint URLs are user-configured.
- Cashu mint default suggestion - Initial wallet creation suggests `https://mint.minibits.cash/Bitcoin`.
  - SDK/Client: `applesauce-wallet` / `@cashu/cashu-ts`
  - Implementation: `src/views/wallet/components/create-wallet-modal.tsx`.
  - Auth: Mint-specific protocol; active Nostr signer for wallet persistence.
- Lightning URI handoff - Opens external Lightning apps with `lightning:` URI.
  - SDK/Client: browser `window.open`
  - Implementation: `src/components/invoice-modal.tsx`.
  - Auth: External app handles payment authorization.

**Signing and Authentication:**

- NIP-07 browser extensions - Browser signer extension login.
  - SDK/Client: `applesauce-signers` `ExtensionSigner`
  - Implementation: `src/views/signin/start.tsx`; type augmentation in `src/types/nostr-extensions.d.ts`.
  - Auth: `window.nostr` extension approval.
- Nostr Connect / bunker (NIP-46) - Remote signer login.
  - SDK/Client: `applesauce-signers` `NostrConnectSigner`, `applesauce-accounts` `NostrConnectAccount`
  - Implementation: `src/views/signin/connect/index.tsx`, `src/views/signin/address.tsx`, and signer wiring in `src/services/accounts.ts`.
  - Auth: Nostr Connect URI permissions from `NOSTR_CONNECT_PERMISSIONS` in `src/const.ts`; default relay `wss://bucket.coracle.social/`.
- Amber Android signer - Android signer account type and web Android flow.
  - SDK/Client: `applesauce-accounts` `AmberClipboardAccount`, Android-specific account class
  - Implementation: `src/services/accounts.ts`, `src/views/signin/start.tsx`, and `src/classes/accounts/android-signer-account.ts`.
  - Auth: Amber app/user approval.
- Native Android signer plugin - Native signer discovery/use on Android.
  - SDK/Client: `nostr-signer-capacitor-plugin`
  - Implementation: `src/views/signin/native.tsx` and `src/classes/signers/android-native-signer.ts`.
  - Auth: Native signer app approval.
- Web Serial signing device - USB serial signer login.
  - SDK/Client: `applesauce-signers` `SerialPortSigner`
  - Implementation: `src/views/signin/start.tsx`.
  - Auth: Browser Web Serial permission and device signing approval.
- Local password/nsec account - Encrypted local private-key account.
  - SDK/Client: `applesauce-signers` `PasswordSigner`, `applesauce-accounts` `PasswordAccount`
  - Implementation: `src/views/signin/nsec.tsx`, persistence through `src/services/accounts.ts` and `src/services/preferences.ts`.
  - Auth: User password prompt; README warns users not to trust web clients with nsec in `README.md`.

**Native Device Capabilities:**

- Capacitor App plugin - Native `nostr:` deep link handling.
  - SDK/Client: `@capacitor/app`
  - Implementation: `src/index.tsx` handles `appUrlOpen`; web protocol handler configured in `vite.config.ts`.
  - Auth: OS-level app link handling.
- Capacitor Preferences - Cross-platform local settings/account persistence.
  - SDK/Client: `@capacitor/preferences`
  - Implementation: `src/classes/preference-subject.ts` and `src/services/preferences.ts`.
  - Auth: Device/browser local storage boundary.
- Capacitor SQLite - Native event cache and SQL-backed Nostr event storage.
  - SDK/Client: `@capacitor-community/sqlite`, `applesauce-sqlite`
  - Implementation: `src/services/sqlite/index.ts`, `src/services/sqlite/migrations.ts`, and `src/services/event-cache/native-sqlite.ts`.
  - Auth: None; database encryption flags are disabled in `capacitor.config.ts`.
- Capacitor Share - Native share sheet support.
  - SDK/Client: `@capacitor/share`
  - Implementation: imported through app capabilities; plugin configured in Capacitor native projects.
  - Auth: OS share sheet permissions.
- ML Kit barcode scanning - QR/barcode scanning for signer and wallet flows.
  - SDK/Client: `@capacitor-mlkit/barcode-scanning`, `react-qr-barcode-scanner`
  - Implementation: QR scanner component in `src/components/qr-code/qr-code-scanner-button.tsx`.
  - Auth: Camera permission.

**Embedded Apps and Mini-App Runtimes:**

- Napplets / Kehto runtime - Nostr app/napplet loading and sandboxed shell integration.
  - SDK/Client: `@napplet/core`, `@napplet/nap`, `@kehto/runtime`, `@kehto/services`, `@kehto/shell`
  - Implementation: `src/providers/global/napplet-shell-provider.tsx`, `src/components/napplets/`, and `src/views/napplets/`.
  - Auth: User approval and active Nostr signer for allowed actions.
- Webxdc - Webxdc app support.
  - SDK/Client: `@webxdc/types`
  - Implementation: `src/components/webxdc/webxdc.tsx` and `src/views/webxdc/`.
  - Auth: App/message bridge permissions managed in UI code.

## Data Storage

**Databases:**

- Browser IndexedDB app database `storage` version 13.
  - Connection: browser IndexedDB; no env var.
  - Client: `idb` in `src/services/database/index.ts`.
  - Stores: accounts migration, relay info, relay scoreboard stats, user search, read state, identities, and key/value data in `src/services/database/schema.ts`.
- Browser IndexedDB Nostr event cache.
  - Connection: browser IndexedDB; no env var.
  - Client: `nostr-idb` in `src/services/event-cache/nostr-idb.ts`.
- Native SQLite Nostr event cache.
  - Connection: Capacitor SQLite database `nostrudel_events`; no env var.
  - Client: `@capacitor-community/sqlite` and `applesauce-sqlite` in `src/services/event-cache/native-sqlite.ts` and `src/services/sqlite/index.ts`.
- WASM worker relay cache.
  - Connection: browser WebAssembly/Worker/storage APIs; no env var.
  - Client: event-cache module selected by `src/services/event-cache/index.ts` when `WASM_RELAY_SUPPORTED` from `src/env.ts` is true.
- Capacitor Preferences/local settings.
  - Connection: browser/device key-value storage; no env var.
  - Client: `@capacitor/preferences` via `src/services/preferences.ts` and `src/classes/preference-subject.ts`.

**File Storage:**

- Blossom media servers for user-selected uploads and mirroring (`src/helpers/media-upload/blossom.ts`).
- nostr.build media upload endpoint for optional uploads (`src/helpers/media-upload/nostr-build.ts`).
- Browser/native local caches through service worker/IndexedDB/SQLite; no server-side file storage is implemented in app source.

**Caching:**

- PWA Workbox precache and SPA navigation fallback in `vite.config.ts` and `src/sw/worker/sw.ts`.
- Event cache abstraction in `src/services/event-cache/index.ts` supports `wasm-worker`, `native-sqlite`, `nostr-idb`, `local-relay`, `hosted-relay`, and `none`.
- Relay liveness cache persisted by `localforage` in `src/services/pool.ts`.
- NIP-05 identities cached in IndexedDB by `src/services/dns-identity-loader.ts`.
- Decryption cache is managed by `src/services/decryption-cache.ts` and controlled by preferences in `src/services/preferences.ts`.
- Image size cache is in-memory in `src/helpers/image.ts`.

## Authentication & Identity

**Auth Provider:**

- Nostr-native multi-signer authentication.
  - Implementation: `AccountManager` in `src/services/accounts.ts` with common Applesauce account types, Amber clipboard accounts, Android signer accounts on native, NIP-07 extension accounts, Nostr Connect accounts, password accounts, serial signer accounts, and read-only/pubkey accounts.
  - Session/current account: active account is persisted through `src/services/preferences.ts` and set in `src/services/accounts.ts`.
  - Relay auth: NIP-42 wrapper signer in `src/services/authentication-signer.ts`.
  - Wallet auth: WebLN provider authorization, NWC connection secrets, active Nostr signer for Cashu/NIP-60 encrypted wallet events.

## Monitoring & Observability

**Error Tracking:**

- None detected. No Sentry, Datadog, Bugsnag, LogRocket, OpenTelemetry, or equivalent external error tracking SDK is present in `package.json`.

**Logs:**

- Namespaced `debug` logging through helper usage and service modules; service worker explicitly enables `noStrudel:*` in `src/sw/worker/sw.ts`.
- Browser console logging is used for startup/build diagnostics in `vite.config.ts`, app rendering in `src/index.tsx`, service worker lifecycle in `src/sw/worker/sw.ts`, and errors in service modules.
- Development-only globals expose service internals (`window.pool`, `window.eventStore`, `window.db`, `window.eventCache`, etc.) in files such as `src/services/pool.ts`, `src/services/event-store.ts`, and `src/services/database/index.ts`.

## CI/CD & Deployment

**Hosting:**

- Static web/PWA deployment from Vite `dist/` output.
- Public live instance: `https://nostrudel.ninja` documented in `README.md`.
- Docker image: `ghcr.io/hzrd149/nostrudel:master` documented in `README.md`.
- Native deployment: Capacitor Android/iOS projects in `android/` and `ios/App/`.
- Zapstore metadata/configuration exists in `zapstore.yaml`.

**CI Pipeline:**

- Not detected in repo scan. No `.github/workflows/*` files were found.
- Release/versioning support is present through `.changeset/` and `@changesets/cli` in `package.json`.

## Environment Configuration

**Required env vars:**

- None required for baseline local development (`pnpm run dev`) or build (`pnpm build`) based on `package.json` and `vite.config.ts`.

**Optional env/runtime vars and globals:**

- `VITE_BASE` - Vite base path in `vite.config.ts`.
- `VITE_APP_VERSION` - displayed by `src/components/version-button.tsx`; set to `dev` by `pnpm dev`.
- `VITE_COMMIT_HASH` - displayed by `src/components/version-button.tsx` when available.
- `VITE_TENOR_API_KEY` - enables Tenor GIF picker through `src/const.ts` and `src/components/gif/tenor-gif-icon-button.tsx`.
- `CACHE_RELAY` / `window.CACHE_RELAY_ENABLED` - Docker/deployment option for same-origin hosted event relay cache; documented in `README.md`, consumed by `src/services/event-cache/index.ts` and `src/services/event-cache/hosted-relay.ts`.
- `IMAGE_PROXY` / `window.IMAGE_PROXY_PATH` - Docker/deployment image proxy option documented in `README.md`, consumed by `src/helpers/image.ts`.
- `REQUEST_PROXY` / `window.REQUEST_PROXY` - Docker/deployment CORS/request proxy option documented in `README.md`, consumed by `src/helpers/request.ts`.
- `PROXY_FIRST` - documented Docker option in `README.md`; direct client-side usage was not detected in `src/`.

**Secrets location:**

- No `.env*` files detected in repo root during scan.
- Client-exposed Vite values are not suitable for secrets; `VITE_TENOR_API_KEY` is public by design once bundled.
- NWC connection URI secrets and account metadata are persisted locally through `@capacitor/preferences` in `src/services/preferences.ts`; local password accounts are handled by Applesauce password signer/account classes.
- Android `google-services.json` is optionally consumed by `android/app/build.gradle`; file was not read and should be treated as deployment credential/configuration if present.

## Webhooks & Callbacks

**Incoming:**

- Web protocol handlers for `web+nostr` and `nostr` are declared in the PWA manifest in `vite.config.ts`; production web registers `web+nostr` in `src/index.tsx`.
- Native app URL callback for `nostr:` links is handled with Capacitor App `appUrlOpen` in `src/index.tsx`.
- Nostr Connect remote signer handshake listens over relays through `NostrConnectSigner` in `src/views/signin/connect/index.tsx` and `src/services/accounts.ts`.
- Nostr Wallet Connect notifications are consumed from NIP-47 relay subscriptions in `src/services/wallets.ts`.
- Napplet and webxdc message bridges receive `postMessage` events in `src/providers/global/napplet-shell-provider.tsx`, `src/components/napplets/napplet-frame.tsx`, and `src/components/webxdc/webxdc.tsx`.
- Service worker messages are handled in `src/sw/worker/sw.ts`.

**Outgoing:**

- Nostr relay WebSocket subscriptions and event publishing via `src/services/pool.ts`, `src/services/actions.ts`, and loaders.
- Blossom uploads/mirrors to user-selected media servers via `src/helpers/media-upload/blossom.ts` and `src/components/timeline/note/components/share-modal.tsx`.
- nostr.build multipart upload requests with optional NIP-98 auth via `src/helpers/media-upload/nostr-build.ts`.
- NIP-05 and general HTTP requests through `fetchWithProxy` in `src/helpers/request.ts`.
- Cashu mint HTTP/protocol calls through `NutWallet` and `@cashu/cashu-ts` in `src/services/wallets.ts` and wallet views.
- WebLN/NWC Lightning invoice payment and invoice creation via `src/services/wallets.ts`, `src/components/invoice-modal.tsx`, and wallet views.
- External app launches for `lightning:` invoices and links via `window.open` in `src/components/invoice-modal.tsx` and other link components.

---

_Integration audit: 2026-07-29_
