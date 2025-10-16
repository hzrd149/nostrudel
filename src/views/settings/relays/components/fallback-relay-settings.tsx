import { Heading, Text } from "@chakra-ui/react";
import { relaySet } from "applesauce-core/helpers";
import { useObservableEagerState } from "applesauce-react/hooks";
import NipLink from "../../../../components/nip-link";
import localSettings from "../../../../services/preferences";
import AddRelayForm from "./add-relay-form";
import RelayControl from "./relay-control";

export default function FallbackRelaySettings() {
  const fallbacks = useObservableEagerState(localSettings.fallbackRelays);

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
    </>
  );
}
