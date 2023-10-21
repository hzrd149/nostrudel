import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, Flex } from "@chakra-ui/react";
import { ModalProps } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { NostrEvent } from "../../types/nostr-event";
import RawJson from "./raw-json";
import RawValue from "./raw-value";
import RawPre from "./raw-pre";
import userMetadataService from "../../services/user-metadata";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { getEventCoordinate } from "../../helpers/nostr/events";

export default function CommunityPostDebugModal({
  event,
  community,
  approvals,
  ...props
}: { event: NostrEvent; community: NostrEvent; approvals: NostrEvent[] } & Omit<ModalProps, "children">) {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody p="4">
          <Flex gap="2" direction="column">
            <RawValue heading="Event Id" value={event.id} />
            <RawValue heading="Encoded id (NIP-19)" value={nip19.noteEncode(event.id)} />
            <RawValue heading="Community Coordinate" value={getEventCoordinate(community)} />
            <RawPre heading="Content" value={event.content} />
            <RawJson heading="JSON" json={event} />
            {approvals.map((approval) => (
              <RawJson
                key={approval.id}
                heading={`Approval by ${getUserDisplayName(
                  userMetadataService.getSubject(approval.pubkey).value,
                  approval.pubkey,
                )}`}
                json={approval}
              />
            ))}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
