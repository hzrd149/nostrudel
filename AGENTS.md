# Agent Development Guide for noStrudel

This guide provides essential information for AI coding agents working on the noStrudel codebase.

## Project Overview

noStrudel is a React/TypeScript web application for exploring the [nostr protocol](https://github.com/nostr-protocol). It uses Vite as the build tool, Chakra UI for components, and a custom state management layer built around the applesauce pattern for Nostr data.

## Project Structure

```
src/
├── components/        # Reusable UI components (organized by feature)
├── views/            # Page-level components (route handlers)
├── hooks/            # Custom React hooks (70+ hooks)
├── helpers/          # Pure utility functions
├── providers/        # React context providers (global/local/route)
├── services/         # Singleton services & business logic
├── models/           # Data models (applesauce pattern)
├── classes/          # Class implementations
├── types/            # TypeScript type definitions
├── theme/            # Chakra UI theme customization
└── sw/               # Service worker code
```

## Code Style Guidelines

### File & Directory Naming

- **Always use kebab-case** for files and directories
- Components: `user-avatar.tsx`, `compact-note-content.tsx`
- Hooks: `use-async-action.ts`, `use-event-reactions.ts`
- Helpers: `relay.ts`, `app-settings.ts`
- Use `index.tsx` for main module exports

### Import Conventions

- **Use relative imports** (preferred in codebase)
- Path alias `~/` is configured but rarely used
- Example: `import UserAvatar from "../user/user-avatar"`
- Group imports: external libraries → internal modules → components

### Component Guidelines

#### Functional Components Only

```typescript
// Preferred: Default export with function declaration
export default function HomePage() {
  // component logic
}

// Alternative: Named export with React.memo
export const CompactNoteContent = React.memo(
  ({ event, maxLength, ...props }: NoteContentsProps & Omit<BoxProps, "children">) => {
    // component logic
  },
);
```

#### Component Patterns

- Use **functional components** exclusively (no class components)
- Use **default exports** for components
- Destructure props in function signature
- Spread remaining props: `...props` (common with Chakra UI)
- Use `React.memo()` for performance-critical components
- Use `forwardRef` when refs need to be forwarded

### Hook Guidelines

#### Custom Hook Conventions

- Prefix with `use-` in filename
- Export as default
- Return objects for multiple values: `{ loading, run }`
- Keep focused on single responsibility

#### useAsyncAction Hook (REQUIRED)

**IMPORTANT**: When writing async actions or callbacks in components, use the `useAsyncAction` hook instead of `try/catch`. The hook handles errors cleanly by showing toast notifications.

```typescript
// ✅ CORRECT: Use useAsyncAction
import useAsyncAction from "~/hooks/use-async-action";

const { loading, run } = useAsyncAction(async () => {
  await someAsyncOperation();
}, [dependencies]);

<Button onClick={run} isLoading={loading}>Submit</Button>

// ❌ INCORRECT: Don't use raw try/catch in components
const handleClick = async () => {
  try {
    await someAsyncOperation();
  } catch (e) {
    // error handling
  }
};
```

### TypeScript Conventions

#### Generic Types

```typescript
export default function useAsyncAction<Args extends Array<any>, T = any>(
  fn: (...args: Args) => Promise<T>,
  deps: DependencyList = [],
): { loading: boolean; run: (...args: Args) => Promise<T | undefined> };
```

### Error Handling

#### Error Boundaries

```typescript
import { ErrorBoundary } from "react-error-boundary";

<ErrorBoundary fallback={<ErrorFallback />}>
  <CriticalComponent />
</ErrorBoundary>
```

#### Error Patterns

- Use `ErrorBoundary` wrapper for critical sections
- Use Chakra UI `useToast` for user-facing errors
- Type-check errors: `if (e instanceof Error)`

#### Swallowed Exceptions

The adopted lint standard (see [Linting](#linting)) treats `ai-slop/swallowed-exception` as
error-severity, gating `pnpm lint:ci` on any touched file. Its detector looks for control flow or a
logging call inside the catch body — **a reason comment alone does not clear it.** A well-commented
`catch (err) {}` still fires the rule; this is the single most surprising fact in the convention below.

- **Deliberate parse/filter guard** — a reason comment plus an explicit exit that reproduces the value
  the code already fell through to: `return` in a function body, `continue` in a loop, or the
  accumulator itself in a `reduce` callback. Drop an unused caught binding to bare `catch {`.

  ```typescript
  try {
    return new URL(url).toString();
  } catch {
    // invalid URL string; callers already treat undefined as "no URL"
    return undefined;
  }
  ```

- **Code after the catch must still run** — log the cause instead of returning. A `log(...)` call
  inside the catch also satisfies the rule, and it is the correct form for a best-effort fallback where
  the fallback itself is the handling: a pending-map cleanup, an effect-cleanup registration, a
  fallback render, or the next iteration of a retry loop. See `src/services/event-cache/index.ts` for
  the in-repo shape.
- **User-triggered action** — delete the local try/catch and let the error throw; this is the
  `useAsyncAction` pattern above (see "useAsyncAction Hook (REQUIRED)"). The hook toasts `e.message`
  and logs it, and its `loading` replaces any hand-rolled loading state.
- **Logging channel** — the namespaced debug logger, `logger.extend("<Module>")` from
  `src/helpers/debug.ts`, silent in production unless the namespace is enabled. Not the direct
  browser console: `ai-slop/console-leftover` is on.
- **Last resort** — a rule-scoped `aislop-ignore-*` directive (see "Inline ignores" below), allowed
  only where the catch genuinely cannot return a value or log. Its `-- reason` must justify why the
  code could not be fixed instead, not merely that the behavior is deliberate. A `-line`/`-next-line`
  directive must sit textually adjacent to the flagged line.

### State Management

#### Layers of State

1. **React Context** - Global/shared state (EventStore, Accounts, etc.)
2. **RxJS Observables** - Reactive data streams (`BehaviorSubject`)
3. **Singleton Services** - App-wide concerns (pool, accounts, eventStore)
4. **React Hooks** - Local component state

#### Applesauce Pattern

```typescript
// Use EventModel queries for Nostr data
const reactions = useEventModel(ReactionsQuery, [event, relays]);

// Use timeline loaders for feeds
const timeline = useTimelineLoader(timelineName, relays, filters);
```

### Linting

The adopted lint standard is `aislop`, pinned exactly as the `aislop` 0.16.1 devDependency and configured by `.aislop/config.yml`; upgrades are deliberate changes because they can shift scores and the CI threshold.

```bash
pnpm lint      # aislop scan . — whole-repo human-readable report (informational)
pnpm lint:ci   # aislop ci --changes --base "$(git merge-base origin/next HEAD)" — the exact gate CI runs
```

- `pnpm lint` exits non-zero whenever any finding exists anywhere in the repo, which is always true today. Never chain it with `&&` or treat its exit code as pass/fail.
- `pnpm lint:ci` is the gate `.github/workflows/lint.yml` runs on pull requests and on pushes to every branch except `master`, `next` and `changeset-release/**`, and a failure blocks the job. Pushes to `master` and `next` are not gated because their content arrives through gated branches and PRs.
- Everything is built on `next` until a release, so changed files are measured from the merge-base of `HEAD` with `origin/next`, not from the tip of `next`. Commits that land on `next` after a branch was cut are not counted against that branch.
- The gate scores whole touched files, including findings that already existed in them. It fails on any error-severity finding in a touched file regardless of score. `ci.failBelow` in `.aislop/config.yml` is only a backstop: aislop 0.16.1 scores `--changes` against the whole-project file count (~2.1k files), so diffs score ~97-100 and the effective gate is "no error-severity findings in touched files". Warnings alone are very unlikely to fail it. Touching a legacy file means inheriting its errors: fix them or, in a source file, add a rule-scoped ignore with a reason.
- Changing `package.json` or `pnpm-lock.yaml` makes aislop audit the whole dependency tree. Advisories surface as `security/vulnerable-dependency` warnings (downgraded in `.aislop/config.yml`) and do not fail the gate. They are reported on `package.json`, which cannot hold an `aislop-ignore-*` comment, so the remedy is to upgrade or override the affected dependency.
- Remote caveat: locally `origin` is the ngit/nostr remote and GitHub is `gh`, while in GitHub Actions `origin` is GitHub. Both remotes carry `next`, but they can point at different commits. Run `git fetch origin next` before trusting a local `pnpm lint:ci`. To reproduce the CI base exactly, run `git fetch gh next` and then `pnpm exec aislop ci --changes --base "$(git merge-base gh/next HEAD)"`.
- Run `pnpm lint:ci` from a feature branch cut from `next`. On `next` itself the merge-base is the tip of `origin/next`, so it only scores local commits that have not been pushed yet.
- Vendored third-party code under `src/lib/` (qrcodegen.ts, open-graph-scraper, bencode, fix-image-orientation) is excluded in `.aislop/config.yml`. Rule policy changes also go in that file, each with a comment giving the reason.
- `.aislop/history.jsonl` is a local scan log and is gitignored.
- Claude Code sessions get per-edit aislop feedback from the project hook in `.claude/settings.json`. It is feedback only; CI is the single enforcement point.
- The hook runs `pnpm exec aislop`, so it only works after `pnpm install` in a fresh clone.
- After re-running `aislop hook install --claude --project` (e.g. on upgrade), restore both hook commands in `.claude/settings.json` to `pnpm exec aislop hook claude` and `pnpm exec aislop hook claude --on-file-changed`. The installer rewrites them to a bare `aislop`, which is not on PATH because aislop is a devDependency.

#### Inline ignores

The directives `aislop-ignore-line`, `aislop-ignore-next-line`, and `aislop-ignore-file` are allowed only when they name the rule(s) and end with `-- reason`. A directive without a rule or without a reason is not acceptable. This is enforced in review, not by tooling.

```typescript
// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output
```

## Common Patterns

### Chakra UI Integration

```typescript
import { Button, Box, Flex } from "@chakra-ui/react";

// Extend Chakra props
type CustomProps = Omit<ButtonProps, "children"> & {
  customProp?: string;
};
```

### NostrEvent Handling

```typescript
import { NostrEvent } from "nostr-tools";

// Work with events through helpers and services
import { getDisplayName } from "../../helpers/nostr/profile";
import eventStore from "../../services/event-store";
```

## Adding New Views

Views are page-level components that handle routing and display content. Follow this structured approach when adding new views to the app.

### File Structure

Create a new directory under `src/views/` with the following structure:

```
src/views/your-view/
├── index.tsx              # Main view (list/feed page)
├── routes.tsx             # Route definitions
├── [detail-page].tsx      # Detail view (optional)
├── new.tsx                # Create form (optional)
└── components/            # View-specific components
    ├── component-one.tsx
    └── component-two.tsx
```

### Step 1: Create Helper Functions

**IMPORTANT**: Always create helper functions for working with Nostr events in `src/helpers/nostr/`. This keeps business logic separate from UI components.

**File**: `src/helpers/nostr/your-feature.ts`

```typescript
import { NostrEvent } from "nostr-tools";

// Define event kinds
export const YOUR_FEATURE_KIND = 2003;
export const YOUR_FEATURE_COMMENT_KIND = 2004;

// Helper functions to extract data from events
export function getFeatureTitle(event: NostrEvent) {
  const title = event.tags.find((t) => t[0] === "title")?.[1];
  if (!title) throw new Error("Missing title");
  return title;
}

export function getFeatureData(event: NostrEvent) {
  const data = event.tags.find((t) => t[0] === "x")?.[1];
  if (!data) throw new Error("Missing data");
  return data;
}

// Validation helper
export function validateFeature(event: NostrEvent) {
  try {
    getFeatureTitle(event);
    getFeatureData(event);
    return true;
  } catch (e) {
    return false;
  }
}

// Add any constants or types needed
export type Category = {
  name: string;
  tag: string;
};
```

### Step 2: Create the Main View

**File**: `src/views/your-view/index.tsx`

```typescript
import { useCallback, useMemo } from "react";
import { Button, Flex, Spacer } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { NostrEvent } from "nostr-tools";

import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { YOUR_FEATURE_KIND, validateFeature } from "../../helpers/nostr/your-feature";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useReadRelays } from "../../hooks/use-client-relays";

function YourViewPage() {
  const { filter, listId } = usePeopleListContext();
  const relays = useReadRelays();

  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (e: NostrEvent) => {
      if (muteFilter(e)) return false;
      if (!validateFeature(e)) return false;
      return true;
    },
    [muteFilter],
  );

  const query = useMemo(() => {
    if (!filter) return undefined;
    return { ...filter, kinds: [YOUR_FEATURE_KIND] };
  }, [filter]);

  const { loader, timeline: items } = useTimelineLoader(
    `${listId || "global"}-your-view`,
    relays,
    query,
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <PeopleListSelection />
        <Spacer />
        <Button as={RouterLink} to="/your-view/new">
          Create New
        </Button>
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        {/* Render your items here */}
        {items?.map((item) => (
          <YourItemComponent key={item.id} item={item} />
        ))}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

// Export with provider wrapper
export default function YourView() {
  return (
    <PeopleListProvider>
      <YourViewPage />
    </PeopleListProvider>
  );
}
```

### Step 3: Create Detail View (Optional)

**File**: `src/views/your-view/detail.tsx`

```typescript
import { Spinner } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { ErrorBoundary } from "../../components/error-boundary";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import { getFeatureTitle } from "../../helpers/nostr/your-feature";

function DetailPage({ item }: { item: NostrEvent }) {
  return (
    <VerticalPageLayout>
      <h1>{getFeatureTitle(item)}</h1>
      {/* Render item details */}
    </VerticalPageLayout>
  );
}

export default function DetailView() {
  const pointer = useParamsEventPointer("id");
  const item = useSingleEvent(pointer);

  if (!item) return <Spinner />;

  return (
    <ErrorBoundary>
      <DetailPage item={item} />
    </ErrorBoundary>
  );
}
```

### Step 4: Define Routes

**File**: `src/views/your-view/routes.tsx`

```typescript
import { RouteObject } from "react-router-dom";
import YourView from ".";
import NewItemView from "./new";
import DetailView from "./detail";

export default [
  { index: true, Component: YourView },
  { path: "new", Component: NewItemView },
  { path: ":id", Component: DetailView },
] satisfies RouteObject[];
```

### Step 5: Register Routes in App

**File**: `src/app.tsx`

Add the import near other route imports (around line 45):

```typescript
import yourViewRoutes from "./views/your-view/routes";
```

Add the route to the router configuration (around line 122):

```typescript
const router = createHashRouter([
  {
    element: <RootPage />,
    children: [
      // ... existing routes
      { path: "your-view", children: yourViewRoutes },
    ],
  },
]);
```

### View Components Pattern

Create reusable components in `src/views/your-view/components/`:

**File**: `src/views/your-view/components/item-row.tsx`

```typescript
import { memo } from "react";
import { Link, Td, Tr } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import UserLink from "../../../components/user/user-link";
import Timestamp from "../../../components/timestamp";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import { getFeatureTitle } from "../../../helpers/nostr/your-feature";

function ItemRow({ item }: { item: NostrEvent }) {
  const ref = useEventIntersectionRef<HTMLTableRowElement>(item);
  const address = useShareableEventAddress(item);

  return (
    <Tr ref={ref}>
      <Td>
        <Link as={RouterLink} to={`/your-view/${address}`}>
          {getFeatureTitle(item)}
        </Link>
      </Td>
      <Td>
        <Timestamp timestamp={item.created_at} />
      </Td>
      <Td>
        <UserLink pubkey={item.pubkey} />
      </Td>
    </Tr>
  );
}

export default memo(ItemRow);
```

### Key Patterns

1. **Helper Functions First**: Always create helpers in `src/helpers/nostr/` before building UI
2. **Provider Wrapper**: Wrap main view with providers (PeopleListProvider, etc.)
3. **Timeline Loader**: Use `useTimelineLoader` for feeds with infinite scroll
4. **Event Validation**: Filter events with `eventFilter` callback
5. **Intersection Observer**: Use for lazy loading and performance
6. **Relative Imports**: Always use relative imports (`../../components/`)
7. **Memo Components**: Use `memo()` for list items to prevent re-renders
8. **Error Boundaries**: Wrap critical sections with `<ErrorBoundary>`

### Real Example: Torrents View

The torrents view (`src/views/torrents/`) demonstrates this pattern:

- **Helpers**: `src/helpers/nostr/torrents.ts` - Event kind, validation, data extraction
- **Main View**: `src/views/torrents/index.tsx` - List with filtering and infinite scroll
- **Detail View**: `src/views/torrents/torrent.tsx` - Individual torrent details
- **Routes**: `src/views/torrents/routes.tsx` - Route configuration
- **Components**: `src/views/torrents/components/` - Reusable UI components
