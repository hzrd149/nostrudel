import { WarningIcon } from "@chakra-ui/icons";
import { Button, Card, CardBody, CardHeader, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { mergeRelaySets } from "applesauce-core/helpers";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { MouseEventHandler, useCallback, useMemo } from "react";

import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import SimpleView from "../../../components/layout/presets/simple-view";
import { DEFAULT_LOOKUP_RELAYS, RECOMMENDED_JAPANESE_RELAYS, RECOMMENDED_RELAYS } from "../../../const";
import useUserContactRelays from "../../../hooks/use-user-contact-relays";
import { useUserDNSIdentity } from "../../../hooks/use-user-dns-identity";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { addAppRelay, RelayMode, removeAppRelay, toggleAppRelay } from "../../../services/app-relays";
import localSettings from "../../../services/preferences";
import AddRelayForm from "./add-relay-form";
import RelayControl from "./relay-control";

function RelaySetCard({ label, read, write }: { label: string; read: Iterable<string>; write: Iterable<string> }) {
  const handleClick = useCallback<MouseEventHandler>((e) => {
    e.preventDefault();
    localSettings.readRelays.next(Array.from(read));
    localSettings.writeRelays.next(Array.from(write));
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
        {mergeRelaySets(read, write).map((url) => (
          <Text key={url} whiteSpace="pre" isTruncated>
            {url}
          </Text>
        ))}
      </CardBody>
    </Card>
  );
}

export default function AppRelaysView() {
  const account = useActiveAccount();
  const readRelays = useObservableEagerState(localSettings.readRelays);
  const writeRelays = useObservableEagerState(localSettings.writeRelays);
  const lookupRelays = useObservableEagerState(localSettings.lookupRelays);
  const mailboxes = useUserMailboxes(account?.pubkey);
  const nip05 = useUserDNSIdentity(account?.pubkey);
  const contactRelays = useUserContactRelays(account?.pubkey);

  const sorted = useMemo(() => mergeRelaySets(readRelays, writeRelays).sort(), [readRelays, writeRelays]);

  return (
    <SimpleView title="App Relays" maxW="6xl">
      <Text fontStyle="italic" px="2" mt="-2">
        These relays are stored locally and are used for everything in the app
      </Text>

      {sorted.map((url) => (
        <RelayControl key={url} url={url} onRemove={() => removeAppRelay(url, RelayMode.BOTH)}>
          <Button
            variant={writeRelays.includes(url) ? "solid" : "ghost"}
            colorScheme={writeRelays.includes(url) ? "green" : "gray"}
            onClick={() => toggleAppRelay(url, RelayMode.WRITE)}
            title="Toggle Write"
          >
            {writeRelays.includes(url) ? "Read / Publish" : "Read only"}
          </Button>
        </RelayControl>
      ))}
      <AddRelayForm
        onSubmit={(url) => {
          addAppRelay(url, RelayMode.BOTH);
        }}
      />

      {writeRelays.length === 0 && (
        <Text color="yellow.500">
          <WarningIcon /> There are no write relays set, any note you create might not be saved
        </Text>
      )}

      <Heading size="md" mt="2">
        Set from
      </Heading>
      <Flex wrap="wrap" gap="2">
        {mailboxes && (
          <Button
            onClick={() => {
              localSettings.readRelays.next(mailboxes.inboxes);
              localSettings.writeRelays.next(mailboxes.outboxes);
            }}
          >
            NIP-65 (Mailboxes)
          </Button>
        )}
        {nip05?.status === IdentityStatus.Found && (
          <Button
            onClick={() => {
              if (!nip05.relays) return;
              localSettings.readRelays.next(Array.from(nip05.relays));
              localSettings.writeRelays.next(Array.from(nip05.relays));
            }}
          >
            NIP-05
          </Button>
        )}
        {contactRelays && (
          <Button
            onClick={() => {
              localSettings.readRelays.next(contactRelays.inbox);
              localSettings.writeRelays.next(contactRelays.outbox);
            }}
          >
            Contact List (Legacy)
          </Button>
        )}
      </Flex>

      {/* Relay presets */}
      <Heading size="md" mt="2">
        Presets
      </Heading>
      <Text fontStyle="italic" color="gray.500">
        These are the recommended relays presets for the app. They are used for everything in the app.
      </Text>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
        <RelaySetCard label="Popular Relays" read={RECOMMENDED_RELAYS} write={RECOMMENDED_RELAYS} />
        <RelaySetCard label="Japanese relays" read={RECOMMENDED_JAPANESE_RELAYS} write={RECOMMENDED_JAPANESE_RELAYS} />
      </SimpleGrid>

      {/* Index Relays */}
      <Heading size="md" mt="4">
        Index Relays
      </Heading>
      <Text fontStyle="italic" color="gray.500">
        Index (or lookup) relays are special indexing relays that are used to find user profiles, user mailboxes, and
        other important information
      </Text>

      {lookupRelays.map((url) => (
        <RelayControl
          key={url}
          url={url}
          onRemove={() => {
            localSettings.lookupRelays.next(lookupRelays.filter((r) => r !== url));
          }}
        />
      ))}
      <AddRelayForm
        onSubmit={(url) => {
          if (!lookupRelays.includes(url)) {
            localSettings.lookupRelays.next([...lookupRelays, url]);
          }
        }}
      />
      <Button
        ms="auto"
        size="sm"
        variant="link"
        onClick={() => {
          localSettings.lookupRelays.next(Array.from(DEFAULT_LOOKUP_RELAYS));
        }}
      >
        Reset to defaults
      </Button>

      {lookupRelays.length === 0 && (
        <Text color="yellow.500">
          <WarningIcon /> There are no index relays set, profile lookup and other features may not work properly
        </Text>
      )}
    </SimpleView>
  );
}
