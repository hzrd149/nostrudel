import { Box, Button, Divider, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";

import BackButton from "../../../components/router/back-button";
import { localRelay } from "../../../services/local-relay";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import WasmRelay from "../../../services/wasm-relay";
import WasmRelayCard from "./components/wasm-relay-card";
import InternalRelayCard from "./components/internal-relay-card";
import CitrineRelayCard from "./components/citrine-relay-card";
import NostrRelayTrayCard from "./components/nostr-relay-tray-card";
import HostedRelayCard from "./components/hosted-relay-card";
import MemoryRelayCard from "./components/memory-relay-card";
import NoRelayCard from "./components/no-relay-card";

export default function CacheRelayView() {
  const showAdvanced = useDisclosure({ defaultIsOpen: localRelay?.url === ":none:" || localRelay?.url === ":memory:" });

  return (
    <Flex gap="2" direction="column" flex={1}>
      <Flex gap="2" alignItems="center">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="lg">Cache Relay</Heading>
      </Flex>
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
    </Flex>
  );
}
