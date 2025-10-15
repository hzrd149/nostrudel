import { WarningIcon } from "@chakra-ui/icons";
import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import { relaySet } from "applesauce-core/helpers";
import SimpleView from "../../../components/layout/presets/simple-view";
import NipLink from "../../../components/nip-link";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayName from "../../../components/relay/relay-name";
import { RECOMMENDED_LOOKUP_RELAYS } from "../../../const";
import localSettings from "../../../services/preferences";
import AddRelayForm from "./add-relay-form";
import RelayControl from "./relay-control";

export default function AppRelaysView() {
  const readRelays = useObservableEagerState(localSettings.fallbackRelays);
  const writeRelays = useObservableEagerState(localSettings.extraPublishRelays);
  const lookupRelays = useObservableEagerState(localSettings.lookupRelays);

  const recommendedLookupRelays = RECOMMENDED_LOOKUP_RELAYS.filter((url) => lookupRelays.includes(url) === false);

  return (
    <SimpleView title="Relay Settings" maxW="6xl">
      {/* Index Relays */}
      <Heading size="md">Lookup Relays</Heading>
      <Text color="GrayText">
        Lookup relays are special indexing relays that are used to find user profiles and user mailboxes.
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
          localSettings.lookupRelays.next(relaySet(lookupRelays, url));
        }}
      />

      {recommendedLookupRelays.length > 0 && (
        <Flex gap="2" alignItems="center" wrap="wrap">
          <Text>Recommended:</Text>
          {RECOMMENDED_LOOKUP_RELAYS.filter((url) => lookupRelays.includes(url) === false).map((url) => (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RelayFavicon relay={url} size="xs" />}
              onClick={() => {
                localSettings.lookupRelays.next(relaySet(lookupRelays, url));
              }}
            >
              <RelayName relay={url} />
            </Button>
          ))}
        </Flex>
      )}

      {lookupRelays.length === 0 && (
        <Text color="yellow.500">
          <WarningIcon /> There are no index relays set, profile lookup and other features may not work properly
        </Text>
      )}

      {/* Fallback read relays */}
      <Heading size="md" mt="4">
        Fallback Relays
      </Heading>
      <Text color="GrayText">
        Fallback relays are used to load events from users who have not published a{" "}
        <NipLink nip={65} color="blue.500">
          NIP-65
        </NipLink>
      </Text>

      {readRelays.map((url) => (
        <RelayControl
          key={url}
          url={url}
          onRemove={() => {
            localSettings.fallbackRelays.next(readRelays.filter((r) => r !== url));
          }}
        />
      ))}
      <AddRelayForm
        onSubmit={(url) => {
          localSettings.fallbackRelays.next(relaySet(readRelays, url));
        }}
      />

      {/* Additional write relays */}
      <Heading size="md" mt="4">
        Additional publishing relays
      </Heading>
      <Text color="GrayText">Extra relays you always want to publish events to.</Text>

      {writeRelays.map((url) => (
        <RelayControl
          key={url}
          url={url}
          onRemove={() => {
            localSettings.extraPublishRelays.next(writeRelays.filter((r) => r !== url));
          }}
        />
      ))}
      <AddRelayForm
        onSubmit={(url) => {
          localSettings.extraPublishRelays.next(relaySet(writeRelays, url));
        }}
      />
    </SimpleView>
  );
}
