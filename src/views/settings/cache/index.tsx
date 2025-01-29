import { Box, Button, Divider, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";

import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import WasmRelay from "../../../services/wasm-relay";
import WasmRelayCard from "./components/wasm-relay-card";
import InternalRelayCard from "./components/internal-relay-card";
import CitrineRelayCard from "./components/citrine-relay-card";
import NostrRelayTrayCard from "./components/nostr-relay-tray-card";
import HostedRelayCard from "./components/hosted-relay-card";
import MemoryRelayCard from "./components/memory-relay-card";
import NoRelayCard from "./components/no-relay-card";
import SimpleView from "../../../components/layout/presets/simple-view";
import useCacheRelay from "../../../hooks/use-cache-relay";

export default function CacheRelayView() {
  const cacheRelay = useCacheRelay();
  const showAdvanced = useDisclosure({ defaultIsOpen: cacheRelay?.url === ":none:" || cacheRelay?.url === ":memory:" });

  return (
    <SimpleView title="Cache Relay" maxW="4xl">
      <Text fontStyle="italic" mt="-2" px={{ base: "2", lg: 0 }}>
        The cache relay is used to cache events locally so they can be loaded quickly
      </Text>
      <InternalRelayCard />
      {WasmRelay.SUPPORTED && <WasmRelayCard />}
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
          <MemoryRelayCard />
          <NoRelayCard />
        </>
      )}
    </SimpleView>
  );
}
