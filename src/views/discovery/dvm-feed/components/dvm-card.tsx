import { useMemo } from "react";
import { Card, CardProps, Flex, Heading, LinkBox, LinkOverlayProps, Text } from "@chakra-ui/react";
import { Link as RouterLink, To } from "react-router-dom";
import { getAddressPointerForEvent } from "applesauce-core/helpers";
import { AddressPointer } from "nostr-tools/nip19";

import { NostrEvent } from "nostr-tools";
import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import { DVMAvatar } from "./dvm-avatar";
import { getEventCoordinate } from "../../../../helpers/nostr/event";
import { DVMName } from "./dvm-name";
import DebugEventButton from "../../../../components/debug-modal/debug-event-button";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import DVMFeedFavoriteButton from "../../../../components/dvm/dvm-feed-favorite-button";

export default function DVMCard({
  dvm,
  to,
  onClick,
  ...props
}: Omit<CardProps, "children"> & { dvm: NostrEvent; to?: To; onClick?: LinkOverlayProps["onClick"] }) {
  const metadata = JSON.parse(dvm.content);
  const pointer: AddressPointer = useMemo(() => getAddressPointerForEvent(dvm), [dvm]);

  const ref = useEventIntersectionRef(dvm);

  return (
    <>
      <Card as={LinkBox} display="block" p="4" minH="32" ref={ref} {...props}>
        <Flex gap="2" float="right" zIndex={1}>
          <DVMFeedFavoriteButton zIndex={1} size="sm" pointer={pointer} />
          <DebugEventButton zIndex={1} size="sm" event={dvm} />
        </Flex>
        <DVMAvatar pointer={pointer} w="24" float="left" mr="4" mb="2" />
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={to || `/discovery/dvm/${getEventCoordinate(dvm)}`} onClick={onClick}>
            <DVMName pointer={pointer} />
          </HoverLinkOverlay>
        </Heading>
        <Text>{metadata.about}</Text>
      </Card>
    </>
  );
}
