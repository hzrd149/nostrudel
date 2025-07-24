import { Box, Button, Divider, Text, useDisclosure } from "@chakra-ui/react";

import { useObservableEagerState } from "applesauce-react/hooks";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import { CAP_IS_NATIVE, WASM_RELAY_SUPPORTED } from "../../../env";
import { eventCache$ } from "../../../services/event-cache";
import CitrineRelayCard from "./components/citrine-relay-card";
import HostedRelayCard from "./components/hosted-relay-card";
import NativeSqliteCard from "./components/native-sqlite";
import NoCacheCard from "./components/no-cache-card";
import NostrIdbCard from "./components/nostr-idb-card";
import NostrRelayTrayCard from "./components/nostr-relay-tray-card";
import WasmWorkerCard from "./components/wasm-worker-card";

export default function CacheRelayView() {
  const eventCache = useObservableEagerState(eventCache$);
  const showAdvanced = useDisclosure({ defaultIsOpen: eventCache === null });

  return (
    <SimpleView title="Cache Relay" maxW="4xl">
      <Text fontStyle="italic" mt="-2" px={{ base: "2", lg: 0 }}>
        The cache relay is used to cache events locally so they can be loaded quickly
      </Text>
      <NostrIdbCard />
      {WASM_RELAY_SUPPORTED && <WasmWorkerCard />}
      {CAP_IS_NATIVE && <NativeSqliteCard />}
      {navigator.userAgent.includes("Android") ? <CitrineRelayCard /> : <NostrRelayTrayCard />}
      {window.CACHE_RELAY_ENABLED && <HostedRelayCard />}
      <Button w="full" variant="link" p="4" onClick={showAdvanced.onToggle}>
        <Divider />
        <Box as="span" ml="4" mr="2">
          Advanced
        </Box>
        {showAdvanced.isOpen ? <ChevronUpIcon boxSize={5} mr="2" /> : <ChevronDownIcon boxSize={5} mr="2" />}
        <Divider />
      </Button>
      {showAdvanced.isOpen && (
        <>
          <NoCacheCard />
        </>
      )}
    </SimpleView>
  );
}
