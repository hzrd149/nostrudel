import { useCallback, useState } from "react";
import { useAsync } from "react-use";
import {
  Box,
  Button,
  ButtonGroup,
  ButtonGroupProps,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Flex,
  Heading,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { CacheRelay, clearDB } from "nostr-idb";
import { Link as RouterLink } from "react-router-dom";

import BackButton from "../../../components/router/back-button";
import { NOSTR_RELAY_TRAY_URL, checkNostrRelayTray, localDatabase, localRelay } from "../../../services/local-relay";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import WasmRelay from "../../../services/wasm-relay";
import MemoryRelay from "../../../classes/memory-relay";
import Trash01 from "../../../components/icons/trash-01";

function EnableWithDelete({
  enable,
  enabled,
  wipe,
  ...props
}: Omit<ButtonGroupProps, "children"> & {
  enable: () => void;
  enabled: boolean;
  wipe: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const wipeDatabase = useCallback(async () => {
    try {
      setDeleting(true);
      await wipe();
      location.reload();
    } catch (error) {}
    setDeleting(false);
  }, []);

  return (
    <ButtonGroup isAttached {...props}>
      <Button colorScheme="primary" onClick={enable} isDisabled={enabled}>
        {enabled ? "Enabled" : "Enable"}
      </Button>
      <Menu>
        <MenuButton as={IconButton} icon={<ChevronDownIcon />} aria-label="More options" />
        <MenuList>
          <MenuItem icon={<Trash01 />} color="red.500" onClick={wipeDatabase}>
            Clear Database
          </MenuItem>
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
}

function InternalRelay() {
  const enabled = localRelay instanceof CacheRelay;
  const enable = () => {
    localStorage.setItem("localRelay", "nostr-idb://internal");
    location.reload();
  };

  const wipe = async () => {
    await clearDB(localDatabase);
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Browser Cache</Heading>
        <EnableWithDelete size="sm" ml="auto" enable={enable} enabled={enabled} wipe={wipe} />
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Use the browsers built-in database to cache events.</Text>
        <Text>Maximum capacity: 10k events</Text>
        <Text>Performance: Usable, but limited by the browser</Text>
      </CardBody>
      {enabled && (
        <CardFooter p="4" pt="0">
          <Button size="sm" colorScheme="primary" ml="auto" as={RouterLink} to="/relays/cache/database">
            Database Tools
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function WasmWorkerRelay() {
  const enabled = localRelay instanceof WasmRelay;
  const enable = () => {
    localStorage.setItem("localRelay", "nostr-idb://wasm-worker");
    location.reload();
  };

  const wipe = async () => {
    if (localRelay instanceof WasmRelay) {
      await localRelay.wipe();
    } else {
      // import and delete database
      console.log("Importing worker to wipe database");
      const { default: worker } = await import("../../../services/wasm-relay/worker");
      await worker.wipe();
    }
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Internal SQLite Cache</Heading>
        <EnableWithDelete size="sm" ml="auto" enable={enable} enabled={enabled} wipe={wipe} />
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">
          Use{" "}
          <Link
            href="https://git.v0l.io/Kieran/snort/src/branch/main/packages/worker-relay"
            isExternal
            color="blue.500"
          >
            @snort/worker-relay
          </Link>{" "}
          with SQLite running in the browser.
        </Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: Slightly slower than Browser Cache</Text>
        <Text color="yellow.500">NOTE: Can increase the initial load time of the app by ~2 seconds</Text>
        <Text color="yellow.500">NOTE: Does not work well with multiple tabs</Text>
      </CardBody>
      {enabled && (
        <CardFooter p="4" pt="0">
          <Button size="sm" colorScheme="primary" ml="auto" as={RouterLink} to="/relays/cache/database">
            Database Tools
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function NostrRelayTray() {
  const { value: available, loading: checking } = useAsync(checkNostrRelayTray);

  const enabled = localRelay?.url.startsWith(NOSTR_RELAY_TRAY_URL);
  const enable = () => {
    localStorage.setItem("localRelay", NOSTR_RELAY_TRAY_URL);
    location.reload();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Nostr Relay Tray</Heading>
        <Link color="blue.500" href="https://github.com/CodyTseng/nostr-relay-tray" isExternal>
          GitHub
        </Link>
        {available || enabled ? (
          <Button size="sm" colorScheme="primary" ml="auto" isLoading={checking} onClick={enable} isDisabled={enabled}>
            {enabled ? "Enabled" : "Enable"}
          </Button>
        ) : (
          <Button
            as={Link}
            isExternal
            href="https://github.com/CodyTseng/nostr-relay-tray"
            colorScheme="blue"
            size="sm"
            ml="auto"
          >
            Get the app
          </Button>
        )}
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">A cool little app that runs a local relay in your systems tray</Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: As fast as your computer</Text>
      </CardBody>
    </Card>
  );
}

function CitrineRelay() {
  const { value: available, loading: checking } = useAsync(checkNostrRelayTray);

  const enabled = localRelay?.url.startsWith(NOSTR_RELAY_TRAY_URL);
  const enable = () => {
    localStorage.setItem("localRelay", NOSTR_RELAY_TRAY_URL);
    location.reload();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Citrine</Heading>
        <Link color="blue.500" href="https://github.com/greenart7c3/Citrine" isExternal>
          GitHub
        </Link>
        {available ? (
          <Button size="sm" colorScheme="primary" ml="auto" isLoading={checking} onClick={enable} isDisabled={enabled}>
            {enabled ? "Enabled" : "Enable"}
          </Button>
        ) : (
          <Button
            as={Link}
            isExternal
            href="https://github.com/greenart7c3/Citrine"
            colorScheme="blue"
            size="sm"
            ml="auto"
          >
            Get the app
          </Button>
        )}
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">A cool little app that runs a local relay in your phone</Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: As fast as your phone</Text>
      </CardBody>
    </Card>
  );
}

function SatelliteRelay() {
  const { value: relay } = useAsync(() => window.satellite!.getLocalRelay());
  const { value: enabled } = useAsync(async () => localRelay?.url === relay, [localRelay?.url, relay]);
  const enable = () => {
    if (relay) {
      localStorage.setItem("localRelay", relay);
      location.reload();
    }
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Satellite Relay</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Satellite desktop exposes a local caching relay that can be used to store you events</Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: As fast as your computer</Text>
      </CardBody>
    </Card>
  );
}

function HostedRelay() {
  const enabled = localRelay?.url.includes(location.host + "/local-relay");
  const enable = () => {
    localStorage.removeItem("localRelay");
    location.reload();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Hosted Relay</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Your installation of noStrudel is setup with a local relay that can be used as a cache</Text>
        <Text>Maximum capacity: Unknown</Text>
        <Text>Performance: Unknown, but probably fast...</Text>
      </CardBody>
    </Card>
  );
}

function InMemoryRelay() {
  const enabled = localRelay instanceof MemoryRelay;
  const enable = () => {
    localStorage.setItem("localRelay", ":memory:");
    location.reload();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">In-memory Cache</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Stores all events in memory</Text>
        <Text>Maximum capacity: Unlimited, until your system freezes</Text>
        <Text>Performance: Very fast</Text>
        <Text color="yellow.500">NOTE: All events are forgotten when you close the app</Text>
      </CardBody>
      {enabled && (
        <CardFooter p="4" pt="0">
          <Button size="sm" colorScheme="primary" ml="auto" as={RouterLink} to="/relays/cache/database">
            Database Tools
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function NoLocalRelay() {
  const enabled = localRelay === null;
  const enable = () => {
    localStorage.setItem("localRelay", ":none:");
    location.reload();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">No Cache</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">No local relay, nothing is cached</Text>
        <Text>Maximum capacity: 0</Text>
        <Text>Performance: As fast as the relays your connecting to</Text>
        <Text color="blue.500">NOTE: Profiles and Timelines are still cached in memory</Text>
      </CardBody>
    </Card>
  );
}

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
      <InternalRelay />
      {WasmRelay.SUPPORTED && <WasmWorkerRelay />}
      {navigator.userAgent.includes("Android") ? <CitrineRelay /> : <NostrRelayTray />}
      {window.satellite && <SatelliteRelay />}
      {window.CACHE_RELAY_ENABLED && <HostedRelay />}
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
          <InMemoryRelay />
          <NoLocalRelay />
        </>
      )}
    </Flex>
  );
}
