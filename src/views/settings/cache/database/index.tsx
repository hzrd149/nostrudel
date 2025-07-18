import { lazy } from "react";
import { Link, Text } from "@chakra-ui/react";
import { CacheRelay } from "nostr-idb";
import { Link as RouterLink } from "react-router-dom";

import SimpleView from "../../../../components/layout/presets/simple-view";
import { useObservableEagerState } from "applesauce-react/hooks";
import { eventCache$ } from "../../../../services/event-cache";

const WasmDatabasePage = lazy(() => import("./wasm"));
const InternalDatabasePage = lazy(() => import("./internal"));

export default function DatabaseView() {
  const eventCache = useObservableEagerState(eventCache$);

  let content = (
    <Text>
      noStrudel does not have access to the selected cache relays database{" "}
      <Link as={RouterLink} to="/relays/cache" color="blue.500">
        Change cache relay
      </Link>
    </Text>
  );

  if (eventCache?.type === "wasm-worker") content = <WasmDatabasePage />;
  else if (eventCache?.type === "nostr-idb") content = <InternalDatabasePage />;

  return <SimpleView title="Event Cache">{content}</SimpleView>;
}
