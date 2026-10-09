import { LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";

import NappletIconImage from "../../../components/napplets/napplet-icon";
import { getNappletNaddr, getNappletTitle } from "../../../helpers/nostr/napplets";

/** A home-screen style launcher tile: the napplet's icon with its name underneath, opening the napplet on click. */
const NappletAppTile = memo(function NappletAppTile({ event }: { event: NostrEvent }) {
  const address = getNappletNaddr(event);
  const title = getNappletTitle(event);

  return (
    <LinkBox display="flex" flexDirection="column" alignItems="center" gap="2" textAlign="center" minW="0">
      <NappletIconImage event={event} boxSize="16" />
      <LinkOverlay as={RouterLink} to={`/app/${address}`} w="full">
        <Text fontSize="sm" noOfLines={2}>
          {title}
        </Text>
      </LinkOverlay>
    </LinkBox>
  );
});

export default NappletAppTile;
