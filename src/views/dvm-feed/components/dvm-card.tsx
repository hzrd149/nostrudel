import { Card, CardProps, Heading, LinkBox, LinkOverlayProps, Text } from "@chakra-ui/react";
import { Link as RouterLink, To } from "react-router-dom";
import { useMemo, useRef } from "react";

import { NostrEvent } from "../../../types/nostr-event";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { DVMAvatarLink } from "./dvm-avatar";
import { getEventAddressPointer, getEventUID } from "../../../helpers/nostr/events";
import { DVMName } from "./dvm-name";
import { AddressPointer } from "nostr-tools/lib/types/nip19";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";

export default function DVMCard({
  appData,
  to,
  onClick,
  ...props
}: Omit<CardProps, "children"> & { appData: NostrEvent; to: To; onClick?: LinkOverlayProps["onClick"] }) {
  const metadata = JSON.parse(appData.content);
  const pointer: AddressPointer = useMemo(() => getEventAddressPointer(appData), [appData]);

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(appData));

  return (
    <>
      <Card as={LinkBox} display="block" p="4" ref={ref} {...props}>
        <DebugEventButton size="sm" float="right" zIndex={1} event={appData} />
        <DVMAvatarLink pointer={pointer} w="24" float="left" mr="4" mb="2" />
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={to} onClick={onClick}>
            <DVMName pointer={pointer} />
          </HoverLinkOverlay>
        </Heading>
        <Text>{metadata.about}</Text>
      </Card>
    </>
  );
}
