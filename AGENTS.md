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
