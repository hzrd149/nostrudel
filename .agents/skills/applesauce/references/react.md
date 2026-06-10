# Applesauce + React

Read this when wiring Applesauce into a React (or React Native) app. Pair it with `packages/react.md` for the full hook inventory.

`applesauce-react` provides hooks and providers that bridge RxJS observables into React's render cycle and manage the lifetimes for you. You do not need to write `useEffect` + `subscribe` + `setState` by hand — that's what these hooks are for.

## Providers

Wrap your app once near the root:

```tsx
import { EventStoreProvider, AccountsProvider, ActionsProvider } from "applesauce-react/providers";

<EventStoreProvider eventStore={eventStore}>
  <AccountsProvider manager={accountManager}>
    <ActionsProvider runner={actionRunner}>
      <App />
    </ActionsProvider>
  </AccountsProvider>
</EventStoreProvider>;
```

Inside the tree, `useEventStore()`, `useAccountManager()`, `useActiveAccount()`, `useActionRunner()` read from these.

## `use$` — the workhorse hook

`use$` subscribes to a `BehaviorSubject` or `Observable` and re-renders when it emits. Three call shapes:

```tsx
import { use$ } from "applesauce-react/hooks";

// 1. Subject — synchronous initial value
const accounts = use$(manager.accounts$);

// 2. Observable — value may be undefined until first emission
const note = use$(eventStore.event(pointer));

// 3. Factory + deps — use this whenever the observable depends on props/state
const profile = use$(() => eventStore.profile(pubkey), [pubkey]);
```

**Always use the factory form when the observable depends on props/state.** The bare `use$(eventStore.profile(pubkey))` creates a new observable on every render and re-subscribes every time — the #1 React mistake.

## Other commonly-used hooks

- `useEventModel(ModelClass, [args])` — subscribe to a NIP-specific model from `applesauce-common/models`. Handles the factory-with-deps pattern internally.
- `useObservableMemo(factory, deps)` — like `use$`, but returns the observable's _latest_ value across renders rather than subscribing freshly.
- `useObservable(observable)` — bare observable subscription; prefer `use$`.
- `useObservableEagerState(observable, initial)` — when you need a synchronous initial render value.
- `useActiveAccount()` / `useAccountManager()` / `useEventStore()` — context accessors.
- `useAction(Action)` / `useActionRunner()` — wrap an action for use as an event handler.
- `useRenderedContent(event, components)` — renders parsed note content with the `ComponentMap` you supply (mentions, hashtags, embeds, …). See `packages/content.md`.

## Timeline observables in React

Timeline observables already emit a _new array_ each time the timeline changes, so cloning with `map((t) => [...t])` is unnecessary — React will see the new reference and re-render.

```tsx
const notes = use$(() => eventStore.timeline({ kinds: [1] }), []);
// notes: NostrEvent[] — already a fresh array per change
```

For typed casts in the list:

```tsx
import { castTimelineStream } from "applesauce-common/observable";
import { Note } from "applesauce-common/casts";

const notes = use$(() => eventStore.timeline({ kinds: [1] }).pipe(castTimelineStream(Note, eventStore)), []);
```

## Render once, no flicker

For values you only need at mount and won't change (e.g. an `nprofile` from the URL), use `useObservableMemo` + `firstValueFrom`-style patterns sparingly — most "won't change" values still come through `use$` cleanly. Only reach for `useObservableEagerState` when you need a synchronous initial value for SSR or first paint correctness.

## Worked examples

See `assets/examples/` (indexed in `examples.md`) — virtually every React example demonstrates the canonical `EventStoreProvider` + `use$` + `castTimelineStream` shape.
