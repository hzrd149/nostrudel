import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, Flex } from "@chakra-ui/react";
import { ModalProps } from "@chakra-ui/react";

import { NostrEvent, isATag } from "../../types/nostr-event";
import RawJson from "./raw-json";
import RawValue from "./raw-value";
import RawPre from "./raw-pre";
import userMetadataService from "../../services/user-metadata";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { COMMUNITY_DEFINITION_KIND } from "../../helpers/nostr/communities";
import { getSharableEventAddress } from "../../helpers/nip19";

export default function CommunityPostDebugModal({
  event,
  approvals,
  ...props
}: { event: NostrEvent; approvals: NostrEvent[] } & Omit<ModalProps, "children">) {
  const communityCoordinate = event.tags
    .filter(isATag)
    .find((t) => t[1].startsWith(COMMUNITY_DEFINITION_KIND + ":"))?.[1];

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody p="4">
          <Flex gap="2" direction="column">
            <RawValue heading="Event Id" value={event.id} />
            <RawValue heading="Pointer (NIP-19)" value={getSharableEventAddress(event)} />
            <RawValue heading="Community Coordinate" value={communityCoordinate} />
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
