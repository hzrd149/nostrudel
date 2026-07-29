# Coding Conventions

**Analysis Date:** 2026-07-29

## Naming Patterns

**Files:**
- Use kebab-case for source files and feature directories. Examples: `src/hooks/use-async-action.ts`, `src/views/torrents/components/torrent-table-row.tsx`, `src/views/settings/accounts/components/simple-signer-backup.tsx`.
- Use `index.tsx` as the main module/view file inside a feature directory. Examples: `src/views/torrents/index.tsx`, `src/providers/route/index.tsx`, `src/views/wallet/index.tsx`.
- Use `routes.tsx` for route arrays in view directories. Example: `src/views/torrents/routes.tsx` exports a `RouteObject[]` via `satisfies RouteObject[]`.
- Hook files must start with `use-`. Examples: `src/hooks/use-timeline-loader.ts`, `src/hooks/use-route-search-value.ts`, `src/hooks/use-client-side-mute-filter.ts`.
- Nostr event helper modules live under `src/helpers/nostr/` and use feature names. Example: `src/helpers/nostr/torrents.ts`.

**Functions:**
- React components use PascalCase and are usually default-exported function declarations: `export default function TorrentsView()` in `src/views/torrents/index.tsx`, `export default function SendTokenModal()` in `src/views/wallet/components/send-token-modal.tsx`.
- Internal component helpers use PascalCase when returning JSX, even when not exported. Examples: `Warning()` and `TorrentsPage()` in `src/views/torrents/index.tsx`.
- Custom hooks use camelCase names prefixed with `use`. Examples: `useTimelineLoader()` in `src/hooks/use-timeline-loader.ts`, `usePeopleListContext()` in `src/providers/local/people-list-provider.tsx`.
- Pure helpers use camelCase verb/noun names. Examples: `getTorrentTitle()`, `getTorrentBtih()`, `validateTorrent()` in `src/helpers/nostr/torrents.ts`.
- Model query factories use PascalCase with `Query`/`Model` suffixes. Examples: `UserSetsQuery()` in `src/models/lists.ts`, `TrustedMintsModel()` in `src/models/trusted-mints.ts`.

**Variables:**
- Use camelCase for local variables and props: `peopleParam`, `defaultSelected`, `eventFilter`, `muteFilter` in `src/providers/local/people-list-provider.tsx` and `src/views/torrents/index.tsx`.
- Use uppercase constants for fixed event kinds and global identifiers. Examples: `TORRENT_KIND` in `src/helpers/nostr/torrents.ts`, `DEFAULT_ANON_PUBKEY` imported by `src/providers/local/people-list-provider.tsx`.
- RxJS observable variables use a trailing `$` where applicable. Examples are referenced via `wallet?.balance$` in `src/views/wallet/components/send-token-modal.tsx` and `eventCache$.value` in `src/services/search.ts`.
- Boolean/derived UI state names should be direct and readable: `loading`, `creating`, `sensitive`, `account`, `metadata` in `src/hooks/use-async-action.ts`, `src/views/torrents/index.tsx`, and `src/views/settings/accounts/components/simple-signer-backup.tsx`.

**Types:**
- Use PascalCase for types and interfaces. Examples: `PeopleListContextType`, `PeopleListProviderProps`, and `ListId` in `src/providers/local/people-list-provider.tsx`; `Category` in `src/helpers/nostr/torrents.ts`.
- Prefer inline prop object types for small components and extracted `type` aliases for shared or non-trivial props. Examples: `{ torrent: NostrEvent }` in `src/views/torrents/components/torrent-table-row.tsx`; `PeopleListProviderProps` in `src/providers/local/people-list-provider.tsx`.
- Use `Omit<ChakraProps, "children">` when wrapping Chakra components that own their children. Example: `Omit<ModalProps, "children">` in `src/views/wallet/components/send-token-modal.tsx`.

## Code Style

**Formatting:**
- Use Prettier only. `CONTRIBUTING.md` states all code is formatted with Prettier and `package.json` exposes `pnpm run format`.
- Prettier config is `/.prettierrc`: 2 spaces, no tabs, 120-column print width.
- Keep JSX props multiline when long, matching `src/views/wallet/components/send-token-modal.tsx` and `src/views/torrents/components/torrent-table-row.tsx`.
- Keep compact conditional returns for simple helpers, as in `src/providers/local/people-list-provider.tsx`:
```typescript
if (selected === "self") {
  if (account) return { authors: [account.pubkey] };
  else return undefined;
}
```

**Linting:**
- ESLint/Biome configuration is not detected: no `.eslintrc*`, `eslint.config.*`, or `biome.json` files are present at the repo root.
- TypeScript strict mode is enforced by `tsconfig.json` with `strict: true`, `isolatedModules: true`, `forceConsistentCasingInFileNames: true`, and `noEmit: true`.
- `pnpm build` in `package.json` runs `tsc --project tsconfig.json && vite build`; use it as the primary static quality gate.
- Prefer type-safe `satisfies` where constraining literals. Example: `src/views/torrents/routes.tsx` uses `satisfies RouteObject[]`.

## Import Organization

**Order:**
1. External library imports first: React, Chakra UI, router, applesauce, nostr-tools. Example: `src/views/torrents/index.tsx` lines 1-5.
2. Blank line, then internal shared modules via relative paths: `../../components/...`, `../../hooks/...`, `../../helpers/...`, `../../providers/...`.
3. Feature-local component imports last: `./components/torrent-table-row`, `./components/category-select` in `src/views/torrents/index.tsx`.
4. In route files, import `RouteObject` first, then local views. Example: `src/views/torrents/routes.tsx`.

**Path Aliases:**
- `tsconfig.json` configures `~/*` to `./src/*`.
- Use relative imports by default. Existing source predominantly imports internal code with `../` and `./`, as seen in `src/app.tsx`, `src/views/torrents/index.tsx`, and `src/providers/local/people-list-provider.tsx`.
- The project agent guide in `AGENTS.md` explicitly prefers relative imports and notes that `~/` exists but is rarely used.
- Barrel files are used selectively. Example: `src/models/index.ts` re-exports model modules, while most component/view imports target concrete files directly.

## Error Handling

**Patterns:**
- Use `useAsyncAction` for async component actions that should surface user-facing errors. `src/hooks/use-async-action.ts` sets `loading`, catches thrown `Error` objects, displays a Chakra toast, logs the error, and returns `{ loading, run }`.
```typescript
const create = useAsyncAction(async () => {
  if (!wallet) throw new Error("No Cashu wallet is loaded");
  const sats = parseInt(amount, 10);
  if (!sats || sats <= 0) throw new Error("Enter a valid amount");
  setToken(await wallet.sendToken(sats, { mint: mint || undefined }));
}, [wallet, amount, mint]);
```
- Throw `new Error(...)` from helpers when required Nostr event fields are missing, then validate by catching internally. Example: `getTorrentTitle()`, `getTorrentBtih()`, and `validateTorrent()` in `src/helpers/nostr/torrents.ts`.
- Wrap critical UI with `ErrorBoundary` from `src/components/error-boundary.tsx`. `src/app.tsx` wraps the full app in `<ErrorBoundary>`.
- When using manual try/catch in components, type-check before showing messages: `if (e instanceof Error) toast({ description: e.message, status: "error" })` in `src/views/torrents/index.tsx`.
- Service and platform modules may reject/throw directly. Example: `src/services/sqlite/index.ts` throws on web import and returns rejected promises from database operations.

## Logging

**Framework:** console/debug

**Patterns:**
- Use `console.log`, `console.warn`, and `console.error` sparingly for platform/service diagnostics. Examples: `src/sw/worker/sw.ts`, `src/sw/worker/error-handler.ts`, `src/sw/common/rpc-client.ts`.
- Use the `debug` package for scoped runtime diagnostics where imported. `package.json` includes `debug`; `src/services/social-graph.ts` uses timing/logging around graph loading.
- Do not use console logging as the only user-facing error path in components. Prefer `useToast` directly or `useAsyncAction` from `src/hooks/use-async-action.ts`.
- `vite.config.ts` logs `VITE_*` build variables during build startup; avoid logging secrets or non-`VITE_` environment variables.

## Comments

**When to Comment:**
- Add comments to explain non-obvious platform/build constraints. Example: `vite.config.ts` explains bundled Capacitor chunks and Workbox cache limits.
- Add comments for migration compatibility or deliberate coercions. Example: `src/providers/local/people-list-provider.tsx` comments default logged-out list behavior and null-to-undefined conversion.
- Keep comments concise and close to the line they explain.
- Avoid comments that restate obvious JSX; use descriptive component and helper names instead.

**JSDoc/TSDoc:**
- JSDoc is lightweight and used for context on exported UI/service helpers, not required for every function. Example: `src/views/wallet/components/send-token-modal.tsx` documents the Cashu token modal.
- Use `@deprecated` only when preserving compatibility. Example: `timeline` return value in `src/hooks/use-timeline-loader.ts` is marked deprecated.
- Use `@ts-expect-error` with a short reason when intentionally exposing dev-only globals. Example: `src/services/event-store.ts` uses `// @ts-expect-error debug` before `window.eventStore`.

## Function Design

**Size:**
- Keep hooks and helpers focused. Examples: `src/hooks/use-timeline-loader.ts` is a 45-line loader hook; `src/hooks/use-async-action.ts` is a 27-line async action wrapper.
- Split page-level views into internal helper components when a page has distinct sections or providers. Example: `src/views/torrents/index.tsx` uses `Warning`, `TorrentsPage`, and exported `TorrentsView`.
- Extract repeated Nostr parsing and validation into `src/helpers/nostr/` before rendering UI. Example: `src/helpers/nostr/torrents.ts` owns torrent title, BTIH, size, magnet, and validation logic.

**Parameters:**
- Destructure React props in the function signature and spread remaining Chakra props into the wrapped component. Example: `SendTokenModal({ onClose, ...props }: Omit<ModalProps, "children">)` in `src/views/wallet/components/send-token-modal.tsx`.
- Pass domain objects directly to feature components when they render a single entity. Example: `TorrentTableRow({ torrent }: { torrent: NostrEvent })` in `src/views/torrents/components/torrent-table-row.tsx`.
- For hooks with reactive dependencies, accept primitive/domain inputs and memoize derived objects internally. Example: `useTimelineLoader(key, relays, filters, opts)` in `src/hooks/use-timeline-loader.ts`.

**Return Values:**
- Hooks returning multiple values should return objects. Example: `useAsyncAction()` returns `{ loading, run }`; `useTimelineLoader()` returns `{ loader, timeline }`.
- Validation helpers return booleans and hide thrown parsing errors. Example: `validateTorrent()` in `src/helpers/nostr/torrents.ts`.
- Components return `null` for unsupported/non-applicable UI state. Example: `SimpleSignerBackup()` returns `null` when the signer is not a `SimpleSigner` in `src/views/settings/accounts/components/simple-signer-backup.tsx`.

## Module Design

**Exports:**
- Components are usually default exports, especially files containing one visual component. Examples: `src/views/torrents/index.tsx`, `src/views/wallet/components/send-token-modal.tsx`, `src/views/torrents/components/torrent-table-row.tsx`.
- Export named hooks/helpers when multiple related exports live together. Examples: `usePeopleListContext()` and `usePeopleListSelect()` in `src/providers/local/people-list-provider.tsx`; `getTorrentTitle()` and `validateTorrent()` in `src/helpers/nostr/torrents.ts`.
- Export constants and types beside domain helpers. Example: `TORRENT_KIND`, `Trackers`, `Category`, and `torrentCatagories` in `src/helpers/nostr/torrents.ts`.
- Use singleton service modules for app-wide state. Example: `src/services/event-store.ts` exports `eventStore` initialized once.

**Barrel Files:**
- Barrel files are limited and should not be the default for components. `src/models/index.ts` is a barrel for model queries, but `src/app.tsx` imports views/routes directly from their concrete modules.
- Prefer explicit concrete imports for feature components and helpers so dependencies remain navigable. Examples: `src/views/torrents/index.tsx` and `src/views/torrents/components/torrent-table-row.tsx`.

---

*Convention analysis: 2026-07-29*
