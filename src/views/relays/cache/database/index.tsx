import { lazy } from "react";
import { Flex, Heading, Link, Text } from "@chakra-ui/react";
import { CacheRelay } from "nostr-idb";
import { Link as RouterLink } from "react-router-dom";

import BackButton from "../../../../components/router/back-button";
import { localRelay } from "../../../../services/local-relay";
import WasmRelay from "../../../../services/wasm-relay";
import MemoryRelay from "../../../../classes/memory-relay";
import SimpleView from "../../../../components/layout/presets/simple-view";

const MemoryDatabasePage = lazy(() => import("./memory"));
const WasmDatabasePage = lazy(() => import("./wasm"));
const InternalDatabasePage = lazy(() => import("./internal"));

export default function DatabaseView() {
  let content = (
    <Text>
      noStrudel does not have access to the selected cache relays database{" "}
      <Link as={RouterLink} to="/relays/cache" color="blue.500">
        Change cache relay
      </Link>
    </Text>
  );

  if (localRelay instanceof WasmRelay) content = <WasmDatabasePage />;
  else if (localRelay instanceof CacheRelay) content = <InternalDatabasePage />;
  else if (localRelay instanceof MemoryRelay) content = <MemoryDatabasePage />;

  return <SimpleView title="Event Cache">{content}</SimpleView>;
}
