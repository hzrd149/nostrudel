import { Flex, FlexProps, Heading, LinkBox, LinkOverlayProps, Text } from "@chakra-ui/react";
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

export default function DVMFeedRow({
  dvm,
  to,
  onClick,
  ...props
}: Omit<FlexProps, "children"> & { dvm: NostrEvent; to?: To; onClick?: LinkOverlayProps["onClick"] }) {
  const metadata = JSON.parse(dvm.content);
  const pointer: AddressPointer = useMemo(() => getAddressPointerForEvent(dvm), [dvm]);

  const ref = useEventIntersectionRef(dvm);

  return (
    <Flex as={LinkBox} gap="4" p="4" borderBottomWidth={1} ref={ref} {...props}>
      <DVMAvatar pointer={pointer} w="16" />
      <Flex direction="column" gap="2" flex={1}>
        <Flex gap="2" align="center">
          <HoverLinkOverlay as={RouterLink} to={to || `/feeds/dvm/${getReplaceableAddress(dvm)}`} onClick={onClick}>
            <DVMName pointer={pointer} fontWeight="bold" fontSize="md" />
          </HoverLinkOverlay>
          <Text fontSize="sm" color="gray.500" ms="auto">
            Updated <Timestamp timestamp={dvm.created_at} />
          </Text>
        </Flex>
        <Text>{metadata.about}</Text>
      </Flex>
    </Flex>
  );
}
