import { Flex, LinkBox, Spacer } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import relayPoolService from "../../../services/relay-pool";
import { RelayFavicon } from "../../../components/relay-favicon";
import { RelayStatus } from "../../../components/relay-status";
import HoverLinkOverlay from "../../../components/hover-link-overlay";

export default function TaskManagerRelays() {
  return (
    <Flex direction="column">
      {Array.from(relayPoolService.relays.values()).map((relay) => (
        <LinkBox key={relay.url} display="flex" gap="2" p="2" alignItems="center">
          <RelayFavicon relay={relay.url} size="sm" mr="2" />
          <HoverLinkOverlay as={RouterLink} to={`/r/${encodeURIComponent(relay.url)}`} isTruncated fontWeight="bold">
            {relay.url}
          </HoverLinkOverlay>
          <Spacer />
          <RelayStatus url={relay.url} />
        </LinkBox>
      ))}
    </Flex>
  );
}
