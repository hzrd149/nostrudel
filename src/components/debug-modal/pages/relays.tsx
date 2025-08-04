import { useCallback, useState } from "react";
import { NostrEvent } from "nostr-tools";
import { Button, Text } from "@chakra-ui/react";
import { getSeenRelays } from "applesauce-core/helpers";

import { usePublishEvent } from "../../../providers/global/publish-provider";
import RelayFavicon from "../../relay/relay-favicon";

export default function DebugEventRelaysPage({ event }: { event: NostrEvent }) {
  const publish = usePublishEvent();
  const [loading, setLoading] = useState(false);
  const broadcast = useCallback(async () => {
    setLoading(true);
    await publish("Broadcast", event);
    setLoading(false);
  }, []);

  return (
    <>
      <Text>Seen on:</Text>
      {Array.from(getSeenRelays(event) ?? []).map((url) => (
        <Text gap="1" key={url}>
          <RelayFavicon relay={url} size="xs" /> {url}
        </Text>
      ))}
      <Button onClick={broadcast} mr="auto" colorScheme="primary" isLoading={loading}>
        Broadcast
      </Button>
    </>
  );
}
