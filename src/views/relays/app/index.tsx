import { MouseEventHandler, useCallback, useMemo } from "react";

import { Button, ButtonGroup, Card, CardBody, CardHeader, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";
import useSubject from "../../../hooks/use-subject";
import { offlineMode } from "../../../services/offline-mode";
import WifiOff from "../../../components/icons/wifi-off";
import Wifi from "../../../components/icons/wifi";
import BackButton from "../../../components/router/back-button";
import AddRelayForm from "./add-relay-form";
import clientRelaysService, { recommendedReadRelays, recommendedWriteRelays } from "../../../services/client-relays";
import { RelayMode } from "../../../classes/relay";
import RelaySet from "../../../classes/relay-set";
import { useReadRelays, useWriteRelays } from "../../../hooks/use-client-relays";
import useCurrentAccount from "../../../hooks/use-current-account";
import RelayControl from "./relay-control";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { getRelaysFromExt } from "../../../helpers/nip07";
import { useUserDNSIdentity } from "../../../hooks/use-user-dns-identity";
import useUserContactRelays from "../../../hooks/use-user-contact-relays";
import SelectRelaySet from "./select-relay-set";
import { safeRelayUrls } from "../../../helpers/relay";
import HoverLinkOverlay from "../../../components/hover-link-overlay";

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
        {RelaySet.from(read, write).urls.map((url) => (
          <Text key={url} whiteSpace="pre" isTruncated>
            {url}
          </Text>
        ))}
      </CardBody>
    </Card>
  );
}

export default function AppRelays() {
  const account = useCurrentAccount();
  const readRelays = useReadRelays();
  const writeRelays = useWriteRelays();
  const offline = useSubject(offlineMode);
  const { event: nip65 } = useUserMailboxes(account?.pubkey) ?? {};
  const nip05 = useUserDNSIdentity(account?.pubkey);
  const contactRelays = useUserContactRelays(account?.pubkey);

  const sorted = useMemo(() => RelaySet.from(readRelays, writeRelays).urls.sort(), [readRelays, writeRelays]);

  return (
    <Flex gap="2" direction="column" overflow="auto hidden" flex={1}>
      <Flex gap="2" alignItems="center">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="lg" px={{ base: 0, lg: "2" }}>
          App Relays
        </Heading>
        <Button
          onClick={() => offlineMode.next(!offline)}
          leftIcon={offline ? <WifiOff /> : <Wifi />}
          ml="auto"
          size={{ base: "sm", lg: "md" }}
        >
          {offline ? "Offline" : "Online"}
        </Button>
      </Flex>

      <Text fontStyle="italic" px="2" mt="-2">
        These relays are stored locally and are used for everything in the app
      </Text>

      {sorted.map((url) => (
        <RelayControl key={url} url={url} />
      ))}
      <AddRelayForm
        onSubmit={(url) => {
          clientRelaysService.addRelay(url, RelayMode.ALL);
        }}
      />

      {writeRelays.size === 0 && (
        <Text color="yellow.500">
          <WarningIcon /> There are no write relays set, any note you create might not be saved
        </Text>
      )}

      <Heading size="md" mt="2">
        Set from:
      </Heading>
      <Flex wrap="wrap" gap="2">
        {window.nostr && (
          <Button
            onClick={async () => {
              const { read, write } = await getRelaysFromExt();
              clientRelaysService.readRelays.next(read);
              clientRelaysService.writeRelays.next(write);
              clientRelaysService.saveRelays();
            }}
          >
            Extension
          </Button>
        )}
        {nip65 && (
          <Button
            onClick={() => {
              clientRelaysService.setRelaysFromRelaySet(nip65);
            }}
          >
            NIP-65 (Mailboxes)
          </Button>
        )}
        {nip05 && (
          <Button
            onClick={() => {
              clientRelaysService.readRelays.next(RelaySet.from(nip05.relays));
              clientRelaysService.writeRelays.next(RelaySet.from(nip05.relays));
              clientRelaysService.saveRelays();
            }}
          >
            NIP-05
          </Button>
        )}
        {contactRelays && (
          <Button
            onClick={() => {
              clientRelaysService.readRelays.next(contactRelays.inbox);
              clientRelaysService.writeRelays.next(contactRelays.outbox);
              clientRelaysService.saveRelays();
            }}
          >
            Contact List (Legacy)
          </Button>
        )}
      </Flex>
      {account && (
        <>
          <Heading size="md" mt="2">
            Use relay set
          </Heading>
          <SelectRelaySet onChange={(cord, set) => set && clientRelaysService.setRelaysFromRelaySet(set)} />
        </>
      )}

      <Heading size="md" mt="2">
        Presets:
      </Heading>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
        <RelaySetCard label="Popular Relays" read={recommendedReadRelays} write={recommendedWriteRelays} />
        <RelaySetCard label="Japanese relays" read={JapaneseRelays} write={JapaneseRelays} />
      </SimpleGrid>
    </Flex>
  );
}
