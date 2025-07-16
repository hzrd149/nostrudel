import { Card, CardProps, Heading, LinkBox, LinkOverlayProps, Text } from "@chakra-ui/react";
import { getAddressPointerForEvent, getReplaceableAddress } from "applesauce-core/helpers";
import { AddressPointer } from "nostr-tools/nip19";
import { useMemo } from "react";
import { Link as RouterLink, To } from "react-router-dom";

import { NostrEvent } from "nostr-tools";
import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import Timestamp from "../../../../components/timestamp";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { DVMAvatar } from "./dvm-avatar";
import { DVMName } from "./dvm-name";

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
    <Card as={LinkBox} display="block" p="4" ref={ref} {...props}>
      <Text fontSize="sm" color="gray.500" float="right">
        Updated <Timestamp timestamp={dvm.created_at} />
      </Text>
      <DVMAvatar pointer={pointer} w="16" float="left" mr="4" mb="2" />
      <Heading size="md">
        <HoverLinkOverlay as={RouterLink} to={to || `/discovery/dvm/${getReplaceableAddress(dvm)}`} onClick={onClick}>
          <DVMName pointer={pointer} />
        </HoverLinkOverlay>
      </Heading>
      <Text>{metadata.about}</Text>
    </Card>
  );
}
