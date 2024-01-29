import { MouseEventHandler, PropsWithChildren, useCallback } from "react";
import { Button, Card, CardBody, CardHeader, Flex, Heading } from "@chakra-ui/react";

import { useReadRelays } from "../../hooks/use-client-relays";
import clientRelaysService, { recommendedReadRelays, recommendedWriteRelays } from "../../services/client-relays";
import AddRelayForm from "../../components/relay-management-drawer/add-relay-form";
import { RelayMode } from "../../classes/relay";
import useSubject from "../../hooks/use-subject";
import { offlineMode } from "../../services/offline-mode";
import { safeRelayUrls } from "../../helpers/relay";
import RelaySet from "../../classes/relay-set";
import HoverLinkOverlay from "../../components/hover-link-overlay";

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

  if (readRelays.size === 0 && !offline)
    return (
      <Flex direction="column" maxW="md" mx="auto" h="full" alignItems="center" justifyContent="center" gap="4">
        <Heading size="md">Looks like you don't have any relays setup</Heading>
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
        <Button onClick={() => offlineMode.next(true)}>Offline mode</Button>
      </Flex>
    );

  return children;
}
