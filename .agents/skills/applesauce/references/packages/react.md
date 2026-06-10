# applesauce-react

React hooks and providers for applesauce

## Installation

```bash
npm install applesauce-react
```

## Example

```tsx
import { EventStore, Models } from "applesauce-core";
import { EventStoreProvider } from "applesauce-react/providers";
import { useEventModel } from "applesauce-react/hooks";

const eventStore = new EventStore();

function UserName({ pubkey }) {
  const profile = useEventModel(Models.ProfileModel, [pubkey]);

  return <span>{profile.name || "loading..."}</span>;
}

function App() {
  return (
    <EventStoreProvider eventStore={eventStore}>
      <h1>App</h1>

      <UserName pubkey="82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2" />
    </EventStoreProvider>
  );
}
```
