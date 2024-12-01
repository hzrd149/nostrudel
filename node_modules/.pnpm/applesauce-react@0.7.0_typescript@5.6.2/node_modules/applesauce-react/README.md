# applesauce-react

React hooks for applesauce

## Example

```jsx
import { EventStore, QueryStore, Queries } from "applesauce-core";
import { QueryStoreProvider, useStoreQuery } from "applesauce-react";

const events = new EventStore();
const store = new QueryStore(events);

function UserName({ pubkey }) {
  const profile = useStoreQuery(Queries.ProfileQuery, [pubkey]);

  return <span>{profile.name || "loading..."}</span>;
}

function App() {
  return (
    <QueryStoreProvider store={store}>
      <h1>App</h1>

      <UserName pubkey="82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2" />
    </QueryStoreProvider>
  );
}
```
