import { Heading, Text } from "@chakra-ui/react";
import { relaySet } from "applesauce-core/helpers";
import { useObservableEagerState } from "applesauce-react/hooks";
import localSettings from "../../../../services/preferences";
import AddRelayForm from "./add-relay-form";
import RelayControl from "./relay-control";

export default function ExtraPublishRelaySettings() {
  const extra = useObservableEagerState(localSettings.extraPublishRelays);

  return (
    <>
      <Heading size="md" mt="4">
        Additional publishing relays
      </Heading>
      <Text color="GrayText">Extra relays you always want to publish events to.</Text>

      {extra.map((url) => (
        <RelayControl
          key={url}
          url={url}
          onRemove={() => {
            localSettings.extraPublishRelays.next(extra.filter((r) => r !== url));
          }}
        />
      ))}
      <AddRelayForm
        onSubmit={(url) => {
          localSettings.extraPublishRelays.next(relaySet(extra, url));
        }}
      />
    </>
  );
}
