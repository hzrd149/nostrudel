import { Flex, LinkBox, Spacer } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { AbstractRelay } from "nostr-tools";

import relayPoolService from "../../../services/relay-pool";
import { RelayFavicon } from "../../../components/relay-favicon";
import { RelayStatus } from "../../../components/relay-status";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { localRelay } from "../../../services/local-relay";

function RelayRow({ relay }: { relay: AbstractRelay }) {
  return (
    <LinkBox display="flex" gap="2" p="2" alignItems="center">
      <RelayFavicon relay={relay.url} size="sm" mr="2" />
      <HoverLinkOverlay as={RouterLink} to={`/r/${encodeURIComponent(relay.url)}`} isTruncated fontWeight="bold">
        {relay.url}
      </HoverLinkOverlay>
      <Spacer />
      <RelayStatus relay={relay} />
    </LinkBox>
  );
}

export default function TaskManagerRelays() {
  return (
    <Flex direction="column">
      {localRelay instanceof AbstractRelay && <RelayRow relay={localRelay} />}
      {Array.from(relayPoolService.relays.values())
        .filter((r) => r !== localRelay)
        .map((relay) => (
          <RelayRow key={relay.url} relay={relay} />
        ))}
    </Flex>
  );
}
