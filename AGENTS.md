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

## Changesets for Version Management

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs. **Always create a changeset for any user-facing change** — this includes UI changes, not just API changes.

### When to Create a Changeset

**CREATE a changeset when:**

- ✅ Adding, removing, or significantly changing a view or page
- ✅ Adding or removing navigation items (sidebar, bottom nav, app registry)
- ✅ Adding new features users can see or interact with
- ✅ Fixing bugs that affect user-facing behavior
- ✅ Adding new public functions, classes, or methods
- ✅ Modifying signatures of exported functions/methods
- ✅ Adding/removing/changing public exports
- ✅ Changing the behavior of existing APIs
- ✅ Deprecating or removing public APIs

**DO NOT create a changeset for:**

- ❌ Internal refactoring with no visible change to the user
- ❌ Test-only changes
- ❌ Documentation updates (unless they reflect behavioral changes)
- ❌ Build configuration changes
- ❌ Changes to dev dependencies
- ❌ Code formatting or linting fixes
- ❌ Internal helper functions not exported

### Determining the Bump Type

Follow [Semantic Versioning](https://semver.org/):

**PATCH (0.0.X) - Bug Fixes**

- Bug fixes in existing APIs
- Performance improvements
- Internal refactoring (if it fixes user-facing issues)

```markdown
---
"nostrudel": patch
---

Fix memory leak in event handler cleanup
```

**MINOR (0.X.0) - New Features (Backwards Compatible)**

- New public functions/classes/methods
- New optional parameters
- New exports
- Deprecation warnings (not removal)

```markdown
---
"nostrudel": minor
---

Add `getGroupMembers()` method to retrieve all members in a group
```

**MAJOR (X.0.0) - Breaking Changes**

- Removing public APIs
- Changing required parameters
- Removing/renaming exports
- Incompatible behavior changes

```markdown
---
"nostrudel": major
---

**Breaking:** Remove deprecated `sendMessage()` method. Use `send()` instead.
```

### One Changeset Per Logical Change

**IMPORTANT: When a single PR or commit contains multiple distinct user-facing changes, create one changeset per change — not one combined changeset.**

Each changeset should describe exactly one thing. This keeps the generated changelog readable: entries map to individual features, fixes, or breaking changes rather than a mixed list.

```bash
# Example: a PR that adds a new method AND removes a deprecated one
pnpm changeset add --empty   # changeset 1: minor — Add foo() method
pnpm changeset add --empty   # changeset 2: major — Remove deprecated bar() method
```

Multiple changesets are combined automatically at release time; separate entries produce cleaner per-item changelog lines.

### How to Create a Changeset

**IMPORTANT: Always use the CLI to create changesets. Never manually create changeset files.**

Use the `pnpm changeset add` command with the `--empty` flag to create a changeset template:

```bash
pnpm changeset add --empty
```

This will:

1. Create a new changeset file with a randomly generated name (e.g., `.changeset/funny-cats-smile.md`)
2. Generate an empty template that you can then edit

After the file is created, you'll see output like:

```
🦋  Empty Changeset added! - you can now commit it
🦋  info /home/user/project/.changeset/funny-cats-smile.md
```

Then, edit the generated file to add the package name, bump type, and **a single line description**:

```markdown
---
"nostrudel": minor
---

Add support for encrypted group messaging
```

**Important Guidelines:**

- Keep the description to a **single line of text**
- This ensures it fits cleanly into the changelog
- Be concise but descriptive

**Why use the CLI?**

- Ensures correct file naming and format
- Prevents formatting errors
- Follows the project's changeset conventions

### Changeset Writing Guidelines

**User-Facing Language:** Write for library users, not developers:

- ✅ "Add `maxRetries` option to connection configuration"
- ❌ "Implement retry logic in ConnectionManager class"

**Action-Oriented:** Start with a verb:

- **Add:** New features
- **Fix:** Bug fixes
- **Update:** Improvements
- **Remove:** Deleted features
- **Change:** Modified behavior

**Be Specific:**

- ✅ "Fix reconnection failure after network timeout"
- ❌ "Fix bug"

**Single Line Only:**

- ✅ "Add group management methods including mute, pin, and stats"
- ❌ Multi-line descriptions with bullet points (these don't format well in changelogs)

### Workflow Integration

When making changes that affect the public API:

1. Make your code changes
2. Run `pnpm format` to format code
3. Run `pnpm test` to ensure tests pass
4. Run `pnpm build` to verify compilation
5. **Create a changeset using `pnpm changeset add --empty`** if the change is user-facing
6. Edit the generated changeset file to add package name, bump type, and **a single line description**
7. Commit both your changes AND the changeset file

```bash
# After making changes to public API
pnpm changeset add --empty
# This creates .changeset/some-random-name.md

# Edit the file to add your changeset details
# Then commit everything together
git add .
git commit -m "Add group encryption feature"
# Both code changes and the changeset file are committed together
```

### Example Scenarios

**Scenario 1: Adding a new public method**

```typescript
// In src/client/marmot-client.ts
export class MarmotClient {
  // New method added
  public async getGroupInfo(groupId: string): Promise<GroupInfo> {}
}
```

Run `pnpm changeset add --empty`, then edit the generated file:

```markdown
---
"nostrudel": minor
---

Add getGroupInfo() method to retrieve group metadata
```

**Scenario 2: Fixing a bug**

```typescript
// Fixed: Connection now properly retries on timeout
```

Run `pnpm changeset add --empty`, then edit the generated file:

```markdown
---
"nostrudel": patch
---

Fix connection retry logic to handle network timeouts
```

**Scenario 3: Breaking change**

```typescript
// Changed signature from:
// createGroup(name: string, relays: string[])
// to:
// createGroup(options: CreateGroupOptions)
```

Run `pnpm changeset add --empty`, then edit the generated file:

```markdown
---
"nostrudel": major
---

Change createGroup() to accept options object instead of positional arguments
```

### Additional Notes

- Changeset files are consumed during the release process by maintainers
- Multiple changesets can exist and will be combined during version bumping
- See `.changeset/README.md` for comprehensive documentation
- The configuration uses `master` as the base branch
