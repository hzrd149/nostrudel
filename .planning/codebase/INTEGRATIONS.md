# External Integrations

**Analysis Date:** 2026-07-01

## APIs & External Services

**Nostr Relays (primary data source, not a traditional backend):**
- The app has no conventional backend API - all social/content data comes from Nostr relays over WebSocket
- Relay pool: `applesauce-relay` `RelayPool`, instantiated once in `src/services/pool.ts` with `keepAlive: 60_000`
- Relay liveness/backoff tracking: `RelayLiveness` (`applesauce-relay`) persisted via `localforage` instance `"liveness"` (`src/services/pool.ts`)
- Default/bootstrap relay lists defined in `src/const.ts`:
  - Search relays: `relay.nostr.band`, `search.nos.today`, `relay.noswhere.com`, `filter.nostr.wine`
  - Lookup relays (profile/outbox discovery): `purplepag.es`, `index.hzrd149.com`, `indexer.coracle.social`
  - Fallback relays: `relay.primal.net`, `relay.damus.io`, `nos.lol`
  - NIP-66 relay discovery relays: `relay.nostr.watch`, `monitorlizard.nostr1.com`
  - Default NIP-46 (remote signer) relay: `bucket.coracle.social`
  - Default wallet (NIP-60) relays: `relay.damus.io`, `nos.lol`, `relay.primal.net`
  - Local/cache relay default: `ws://localhost:4869/` (`src/const.ts` `LOCAL_RELAY_URL`); Docker deployments can point this at a `nostr-rs-relay` sidecar via the `CACHE_RELAY` env var proxied at `/local-relay` (`docker-entrypoint.sh`)

**Blossom (BUD-01/02) media servers:**
- Client: `blossom-client-sdk`, used in `src/helpers/blossom.ts` and `src/helpers/media-upload/blossom.ts` for uploading/fetching media (images, video, files) to/from user-selected Blossom servers
- Blossom server discovery/management UI: `src/views/blossom/`
- Auth: NIP-98 HTTP auth events signed by the user's Nostr key (per Blossom protocol), no separate API key

**Tenor GIF API:**
- Used for the GIF picker (`gif-picker-react`, `src/components/gif/tenor-gif-icon-button.tsx`)
- Auth: `VITE_TENOR_API_KEY` build-time env var, exposed as `TENOR_API_KEY` in `src/const.ts`

**LNURL / Lightning Address metadata:**
- `src/services/lnurl-metadata.ts` fetches LNURL-pay metadata (callback URL, min/max sendable) directly from the recipient's LNURL/Lightning-address endpoint using `fetchWithProxy`
- Used to construct zap (NIP-57) Lightning invoices

**Exchange rate API:**
- `src/services/exchange-rates.ts` fetches fiat exchange rates from a configurable endpoint (`localSettings.exchangeRateEndpoint`, a user-configurable app setting, not hardcoded), cached in IndexedDB via `idbKeyValueStore`

**DNS-based NIP-05 identity verification:**
- `src/services/dns-identity-loader.ts` uses `applesauce-loaders` `DnsIdentityLoader`, fetching `/.well-known/nostr.json` from user-specified domains via `fetchWithProxy`, cached in IndexedDB (`identities` store)

**Cashu mints:**
- `@cashu/cashu-ts` (`src/services/cashu-mints.ts`) connects directly to Cashu mint HTTP APIs (mint info, wallet operations) for NIP-60 ecash wallets
- Suggested default mints: `https://mint.minibits.cash/Bitcoin`, `https://21mint.me` (`src/services/wallets.ts`)

**CORS / Request Proxy (self-hosted, optional):**
- `src/helpers/request.ts` (`fetchWithProxy`) and `src/services/wallets.ts` (`createRequestProxyUrl`) route outbound HTTP requests through an optional CORS/request proxy for onion (`.onion`) and i2p (`.i2p`) hosts, or as a fallback when a direct clearnet request fails
- Configured via `window.REQUEST_PROXY` (injected at container start) or user setting `settings.corsProxy`
- Reference implementation: `docker-cors-anywhere` (`docker-compose.yaml`)

**Image proxy (self-hosted, optional):**
- `IMAGE_PROXY` env var wires an `imageproxy` (willnorris/imageproxy) instance behind nginx at `/imageproxy/` for resizing profile/content images (`docker-entrypoint.sh`, `docker-compose.yaml`)

**Tor / I2P proxies (self-hosted, optional):**
- `docker-compose.yaml` provisions `purplei2p/i2pd` and `dockage/tor-privoxy` sidecars so the app can reach `.onion`/`.i2p` relays; `TOR_PROXY`/`I2P_PROXY` env vars documented for the Docker image

## Data Storage

**Databases:**
- No server-side database - this is a client-only SPA
- Browser: IndexedDB via `idb` (`src/services/database/index.ts`, schema in `src/services/database/schema.ts`) stores cached Nostr events, DNS identities, key/value app data
- Browser: `localforage` for smaller keyed caches (relay liveness, exchange rates)
- Local Nostr event cache: `nostr-idb` + `@snort/worker-relay` (WASM relay running in a Web Worker) for fast local event querying (`src/services/event-cache/`)
- Native (Capacitor iOS/Android): `@capacitor-community/sqlite` + `applesauce-sqlite` (`src/services/sqlite/`), configured per-platform in `capacitor.config.ts` (non-encrypted by default)
- Optional external cache relay: any NIP-01 relay (recommended `nostr-rs-relay`) via `CACHE_RELAY` env var, proxied through nginx at `/local-relay` in Docker deployments

**File Storage:**
- Blossom servers (user-selected, decentralized) - see APIs section above; no centralized/first-party file storage

**Caching:**
- Service worker (Workbox, `src/sw/worker/sw.ts`, built via `vite-plugin-pwa` injectManifest strategy) caches static assets for offline/PWA use
- In-memory + IndexedDB/localforage caching throughout services (relay info, relay scoreboard, exchange rates, LNURL metadata, DNS identities)

## Authentication & Identity

**Auth Provider:**
- No traditional auth provider/backend - identity is a Nostr keypair (secp256k1)
- Supported signer types (`src/services/accounts.ts`, `applesauce-accounts`):
  - Browser extension signer (NIP-07, `window.nostr`)
  - Raw private key signer (nsec) - explicitly discouraged in `README.md` due to XSS risk
  - Remote signer / NIP-46 "Nostr Connect" (`NostrConnectSigner` from `applesauce-signers`), default bunker relay `bucket.coracle.social` (`src/const.ts`)
  - Native Capacitor signer plugin (`nostr-signer-capacitor-plugin`) for Android/iOS signer apps
  - Nostr Wallet Connect (NIP-47) is used for wallet auth/payments, not identity auth

## Monitoring & Observability

**Error Tracking:**
- Not detected - no Sentry/Bugsnag or similar SaaS error tracking service integrated
- `src/sw/worker/error-handler.ts` handles service-worker level errors locally
- `debug` package used for namespaced console logging (`src/helpers/debug.ts`, referenced throughout services as `logger.extend(...)`)

**Logs:**
- Client-side console logging via the `debug` npm package; no remote log shipping detected

## CI/CD & Deployment

**Hosting:**
- Live instance: `nostrudel.ninja` (static hosting, per `README.md` / `CNAME`)
- Distributed as a Docker image: `ghcr.io/hzrd149/nostrudel` (built from `dockerfile`, multi-stage: pnpm build → nginx runtime)
- Also distributed as installable PWA and native iOS/Android apps (Capacitor, `android/`, `ios/`)
- `zapstore.yaml` present - suggests distribution via Zapstore (Nostr-based app store) as well

**CI Pipeline:**
- GitHub Actions present (`.github/` directory) - specific workflow contents not inspected in this scope, but repo is hosted on GitHub (`github.com/hzrd149/nostrudel`) with a `.github/` workflows directory

## Environment Configuration

**Required env vars (build-time, `VITE_*`):**
- `VITE_APP_VERSION`, `VITE_COMMIT_HASH` - version display (`src/components/version-button.tsx`)
- `VITE_TENOR_API_KEY` - Tenor GIF API key (optional; GIF picker degrades without it)
- `VITE_BASE` - Vite `base` path override for non-root deployments

**Runtime env vars (Docker container, injected into `index.html` post-build):**
- `CACHE_RELAY` - address of a local cache relay (e.g. `nostr-rs-relay`)
- `IMAGE_PROXY` - address of an image-resizing proxy
- `REQUEST_PROXY` - address of a CORS/request proxy for onion/i2p/failed clearnet requests
- `PROXY_FIRST` - if `true`, force all HTTP requests through `REQUEST_PROXY` first
- `TOR_PROXY` - enables in-container Tor SOCKS proxy when set to `true`

**Secrets location:**
- No `.env` file committed; no server-side secrets exist since there is no backend. Build-time keys (e.g. Tenor) are expected to be supplied via CI/deploy environment variables, not committed files

## Webhooks & Callbacks

**Incoming:**
- None - client-only SPA, no server endpoints to receive webhooks
- PWA registers custom protocol handlers `web+nostr:` and `nostr:` (`vite.config.ts` manifest `protocol_handlers`) so the OS/browser can route nostr: links into the app at `/l/%s`

**Outgoing:**
- LNURL-pay callback requests (fetched dynamically from LNURL metadata, see APIs section) when sending zaps
- Nostr Wallet Connect (NIP-47) requests/responses published as Nostr events (not HTTP webhooks) via the shared relay pool (`WalletConnect.pool = pool` in `src/services/wallets.ts`)

---

*Integration audit: 2026-07-01*
