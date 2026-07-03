# Coding Conventions

**Analysis Date:** 2026-07-01

## Naming Patterns

**Files:**
- Always kebab-case, no exceptions: `user-avatar.tsx`, `compact-note-content.tsx`, `use-async-action.ts`, `app-settings.ts`
- Custom hooks are prefixed with `use-`: `src/hooks/use-event-reactions.ts`, `src/hooks/use-client-relays.ts`
- View directories mirror route names: `src/views/torrents/`, `src/views/messages/inbox/`
- Main module export per directory uses `index.tsx`/`index.ts`

**Functions/Variables:**
- camelCase throughout: `getDisplayName`, `useClientSideMuteFilter`, `validateFeature`
- Boolean-returning helpers read as predicates: `isGiftWrapUnlocked`, `isHiddenTagsUnlocked`
- Event-kind constants are SCREAMING_SNAKE_CASE: `YOUR_FEATURE_KIND`, defined near the helpers that use them (see `src/helpers/nostr/*`)

**Components:**
- PascalCase component names, default export, function declaration preferred:
  ```typescript
  export default function HomePage() { ... }
  ```
- When memoized, use `React.memo`/`memo()` with a named function and a separate default export:
  ```typescript
  export const CompactNoteContent = React.memo(({ event, maxLength, ...props }: Props) => { ... });
  ```
  or
  ```typescript
  function ItemRow({ item }: { item: NostrEvent }) { ... }
  export default memo(ItemRow);
  ```

**Types:**
- PascalCase for types/interfaces, colocated with the component/helper that uses them (`NoteContentsProps`, `Category`)
- Prop types typically extend/omit Chakra UI prop types: `Omit<ButtonProps, "children"> & { customProp?: string }`

## Code Style

**Formatting:**
- Prettier, config in `.prettierrc`: `tabWidth: 2`, `useTabs: false`, `printWidth: 120`
- Run via `pnpm format` (`prettier --ignore-path .prettierignore -w .`)
- `.prettierignore` excludes generated/build output

**Linting:**
- No ESLint config present in the repo (no `.eslintrc*` / `eslint.config.*`). Style is enforced only by Prettier and `tsc` (strict TypeScript), not by a linter.

**TypeScript strictness:**
- `tsconfig.json` has `"strict": true`, `"isolatedModules": true`, `"noEmit": true` (build script runs `tsc` then `vite build`)
- Target `ESNext`, module resolution `Bundler`, JSX `react-jsx`
- Path alias `~/*` → `./src/*` is configured but rarely used in practice — prefer relative imports (see below)

## Import Organization

**Order (observed convention, not enforced by tooling):**
1. External libraries (React, Chakra UI, `nostr-tools`, `applesauce-*`, `react-router-dom`)
2. Internal modules via relative paths — components, hooks, services, helpers, models (deepest first is common but not strict)

Example from `src/views/messages/inbox/components/locked-messages.tsx`:
```typescript
import { getGiftWrapRumor, isGiftWrapUnlocked, Rumor, unlockGiftWrap } from "applesauce-common/helpers";
import { GiftWrapsModel } from "applesauce-common/models";
import { useActiveAccount, useEventModel, use$ } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useEffect, useMemo, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";

import { UnlockIcon } from "../../../../components/icons";
import SimpleView from "../../../../components/layout/presets/simple-view";
import Timestamp from "../../../../components/timestamp";
import useAsyncAction from "../../../../hooks/use-async-action";
```

**Path Aliases:**
- `~/*` maps to `src/*` (configured in `tsconfig.json` and via `vite-tsconfig-paths`), but the codebase overwhelmingly uses relative imports (`../../../../hooks/use-async-action`) even in deeply nested files. Prefer relative imports to match existing style; only the AGENTS.md examples reference `~/hooks/...`.

**applesauce SDK imports:**
- Import from public package entry points only, never `dist/` paths: `applesauce-core`, `applesauce-core/models`, `applesauce-core/helpers`, `applesauce-common/factories`, `applesauce-common/helpers`, `applesauce-common/models`, `applesauce-loaders/loaders`, `applesauce-react/hooks`.
- See `.claude/skills/applesauce/SKILL.md` for the full package map and hard rules (one `EventStore` per app, every event must reach `eventStore.add(...)`, loader observables must be subscribed, subscriptions must be torn down).

## Error Handling

**Required pattern for async actions/callbacks in components — `useAsyncAction`:**
`src/hooks/use-async-action.ts` wraps a function, tracks `loading` state, and shows a Chakra `useToast` error on failure instead of manual `try/catch` in the component body:
```typescript
const { loading, run } = useAsyncAction(async () => {
  await someAsyncOperation();
}, [dependencies]);

<Button onClick={run} isLoading={loading}>Submit</Button>
```
Do NOT hand-roll `try/catch` + toast in components — use this hook (per `AGENTS.md`).

**Error type checking:**
- Guard with `if (e instanceof Error)` before accessing `.message` (see `use-async-action.ts:20`)

**Error Boundaries:**
- Wrap critical/detail-view sections with `<ErrorBoundary>` from `react-error-boundary`, using project component `src/components/error-boundary` and a `fallback={<ErrorFallback />}`

**Service/helper-level errors:**
- Non-component code (services, service worker) mostly logs and continues rather than throwing, e.g. `src/services/verify-event.ts`, `src/services/event-cache/index.ts`, `src/services/nip66-relay-discovery.ts` all catch and `console.error(...)` with a descriptive prefix like `"Failed to load cached relay events:"`.
- Validation helpers in `src/helpers/nostr/*` typically throw inside a getter (`throw new Error("Missing title")`) and provide a paired `validateX(event)` boolean wrapper that catches internally:
  ```typescript
  export function getFeatureTitle(event: NostrEvent) {
    const title = event.tags.find((t) => t[0] === "title")?.[1];
    if (!title) throw new Error("Missing title");
    return title;
  }
  export function validateFeature(event: NostrEvent) {
    try {
      getFeatureTitle(event);
      return true;
    } catch (e) {
      return false;
    }
  }
  ```

## Logging

**Framework:** `debug` package, exposed as a shared logger in `src/helpers/debug.ts`:
```typescript
import debug from "debug";
export const logger = debug("noStrudel");
```
Modules typically create a namespaced child logger from this (`logger.extend("feature-name")`) rather than importing `debug` directly, though many files still use raw `console.log`/`console.error`/`console.time` (see `src/services/social-graph.ts`, `src/sw/worker/sw.ts`, `src/index.tsx`).

**Patterns:**
- Prefer `console.error("Failed to X:", error)` — a short present-tense description ending in a colon, followed by the error value — for caught exceptions in services and settings views.
- `console.log` is used for lifecycle/status messages (service worker init, migrations) rather than for errors.

## Comments

- Sparse; code is generally self-documenting through descriptive function/variable names.
- No enforced JSDoc/TSDoc convention. Comments appear mainly as short inline clarifications or `// TODO`/`// eslint-disable`-style markers rather than full doc blocks.

## Function Design

**Size:** Small, single-purpose functions/hooks; complex UI is decomposed into `components/` subdirectories per view (see `src/views/<feature>/components/`).

**Parameters:** Destructured props objects for components; hooks take explicit typed args plus an optional `DependencyList` (mirroring React's `useCallback`/`useMemo` signature), e.g. `useAsyncAction<Args, T>(fn, deps = [])`.

**Return Values:** Hooks that expose multiple values return an object (`{ loading, run }`, `{ loader, timeline }`) rather than a tuple.

## Module Design

**Exports:**
- Components and hooks: default export is the norm.
- Helpers/services: named exports for individual functions and constants (e.g. `src/helpers/nostr/*`, `src/services/*`).

**Barrel files:** Not a general pattern — most directories are imported from directly by file path rather than through an `index.ts` re-export barrel, except each view module's own `index.tsx`.

## Project-Specific Architecture Conventions (from AGENTS.md)

- Directory roles: `components/` (reusable UI), `views/` (route pages), `hooks/`, `helpers/` (pure functions), `providers/` (React context), `services/` (singletons/business logic), `models/` (applesauce query models), `classes/`, `types/`, `theme/`, `sw/` (service worker).
- New Nostr-event-backed features: put kind constants + tag getters + a `validateX` boolean guard in `src/helpers/nostr/<feature>.ts` before writing any UI.
- State layering: React Context (global/shared, e.g. EventStore/Accounts) → RxJS Observables (`BehaviorSubject`) → Singleton services (pool, accounts, eventStore) → local React hook state.
- Use `useEventModel(SomeModel, [...])` for reading Nostr data reactively and `useTimelineLoader` for paginated feeds, per the applesauce pattern.

---

*Convention analysis: 2026-07-01*
