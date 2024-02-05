import { MouseEventHandler, PropsWithChildren, useCallback } from "react";
import { Box, Button, ButtonGroup, Card, CardBody, CardHeader, Flex, Heading, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { useReadRelays } from "../../hooks/use-client-relays";
import clientRelaysService, { recommendedReadRelays, recommendedWriteRelays } from "../../services/client-relays";
import AddRelayForm from "../../views/relays/app/add-relay-form";
import { RelayMode } from "../../classes/relay";
import useSubject from "../../hooks/use-subject";
import { offlineMode } from "../../services/offline-mode";
import { safeRelayUrls } from "../../helpers/relay";
import RelaySet from "../../classes/relay-set";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import { useLocation } from "react-router-dom";

const JapaneseRelays = safeRelayUrls([
  "wss://r.kojira.io",
  "wss://nrelay-jp.c-stellar.net",
  "wss://nostr.fediverse.jp",
  "wss://nostr.holybea.com",
  "wss://relay-jp.nostr.wirednet.jp",
]);

function RelaySetCard({ label, read, write }: { label: string; read: Iterable<string>; write: Iterable<string> }) {
  const handleClick = useCallback<MouseEventHandler>((e) => {
    e.preventDefault();
    clientRelaysService.readRelays.next(RelaySet.from(read));
    clientRelaysService.writeRelays.next(RelaySet.from(write));
    clientRelaysService.saveRelays();
  }, []);

  return (
    <Card w="full" variant="outline">
      <CardHeader px="4" pt="4" pb="2">
        <Heading size="sm">
          <HoverLinkOverlay href="#" onClick={handleClick}>
            {label}:
          </HoverLinkOverlay>
        </Heading>
      </CardHeader>
      <CardBody px="4" pt="0" pb="4">
        {RelaySet.from(read, write).urls.join(", ")}
      </CardBody>
    </Card>
  );
}

export default function RequireReadRelays({ children }: PropsWithChildren) {
  const readRelays = useReadRelays();
  const offline = useSubject(offlineMode);
  const location = useLocation();

  if (readRelays.size === 0 && !offline && !location.pathname.startsWith("/relays"))
    return (
      <Flex direction="column" maxW="md" mx="auto" h="full" alignItems="center" justifyContent="center" gap="4">
        <Box w="full">
          <Heading size="md" textAlign="center">
            Setup App Relays
          </Heading>
          <Text fontStyle="italic">
            App Relays are stored locally and are used to fetch your timeline and other users notes
          </Text>
        </Box>
        <RelaySetCard label="Recommended Relays" read={recommendedReadRelays} write={recommendedWriteRelays} />
        <RelaySetCard label="Japanese relays" read={JapaneseRelays} write={JapaneseRelays} />
        <Card w="full" variant="outline">
          <CardHeader px="4" pt="4" pb="2">
            <Heading size="sm">Single relay:</Heading>
          </CardHeader>
          <CardBody px="4" pt="0" pb="4">
            <AddRelayForm onSubmit={(url) => clientRelaysService.addRelay(url, RelayMode.ALL)} w="full" />
          </CardBody>
        </Card>
        <ButtonGroup>
          <Button as={RouterLink} to="/relays/app" variant="outline" colorScheme="primary">
            Custom Relays
          </Button>
          <Button onClick={() => offlineMode.next(true)} variant="outline">
            Offline mode
          </Button>
        </ButtonGroup>
      </Flex>
    );

  return children;
}
