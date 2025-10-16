import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { relaySet } from "applesauce-core/helpers";
import { useObservableEagerState } from "applesauce-react/hooks";
import NipLink from "../../../../components/nip-link";
import RelayName from "../../../../components/relay/relay-name";
import { RECOMMENDED_FALLBACK_RELAYS } from "../../../../const";
import localSettings from "../../../../services/preferences";
import AddRelayForm from "./add-relay-form";
import RelayControl from "./relay-control";
import RelayFavicon from "../../../../components/relay/relay-favicon";

export default function FallbackRelaySettings() {
  const fallbacks = useObservableEagerState(localSettings.fallbackRelays);
  const recommendations = RECOMMENDED_FALLBACK_RELAYS.filter((url) => fallbacks.includes(url) === false);

  return (
    <>
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

      {fallbacks.map((url) => (
        <RelayControl
          key={url}
          url={url}
          onRemove={() => {
            localSettings.fallbackRelays.next(fallbacks.filter((r) => r !== url));
          }}
        />
      ))}
      <AddRelayForm
        onSubmit={(url) => {
          localSettings.fallbackRelays.next(relaySet(fallbacks, url));
        }}
      />

      {recommendations.length > 0 && (
        <Flex gap="2" alignItems="center" wrap="wrap">
          {RECOMMENDED_FALLBACK_RELAYS.filter((url) => fallbacks.includes(url) === false).map((url) => (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RelayFavicon relay={url} size="xs" />}
              onClick={() => {
                localSettings.fallbackRelays.next(relaySet(fallbacks, url));
              }}
            >
              <RelayName relay={url} />
            </Button>
          ))}
        </Flex>
      )}
    </>
  );
}
