import { Card, CardProps, Heading, IconButton, LinkBox, LinkOverlayProps, Text, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink, To } from "react-router-dom";
import { useMemo, useRef } from "react";

import { NostrEvent } from "../../../types/nostr-event";
import { CodeIcon } from "../../../components/icons";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { DVMAvatarLink } from "./dvm-avatar";
import { getEventAddressPointer, getEventUID } from "../../../helpers/nostr/events";
import { DVMName } from "./dvm-name";
import { AddressPointer } from "nostr-tools/lib/types/nip19";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";

export default function DVMCard({
  appData,
  to,
  onClick,
  ...props
}: Omit<CardProps, "children"> & { appData: NostrEvent; to: To; onClick?: LinkOverlayProps["onClick"] }) {
  const metadata = JSON.parse(appData.content);
  const debugModal = useDisclosure();
  const pointer: AddressPointer = useMemo(() => getEventAddressPointer(appData), [appData]);

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(appData));

  return (
    <>
      <Card as={LinkBox} display="block" p="4" ref={ref} {...props}>
        <IconButton
          onClick={debugModal.onOpen}
          icon={<CodeIcon />}
          aria-label="View Raw"
          title="View Raw"
          size="sm"
          float="right"
          zIndex={1}
        />
        <DVMAvatarLink pointer={pointer} w="24" float="left" mr="4" mb="2" />
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={to} onClick={onClick}>
            <DVMName pointer={pointer} />
          </HoverLinkOverlay>
        </Heading>
        <Text>{metadata.about}</Text>
      </Card>
      {debugModal.isOpen && <NoteDebugModal event={appData} isOpen onClose={debugModal.onClose} />}
    </>
  );
}
