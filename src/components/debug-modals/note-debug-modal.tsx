import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, Flex } from "@chakra-ui/react";
import { ModalProps } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { getReferences } from "../../helpers/nostr/events";
import { NostrEvent } from "../../types/nostr-event";
import RawJson from "./raw-json";
import RawValue from "./raw-value";
import RawPre from "./raw-pre";

export default function NoteDebugModal({ event, ...props }: { event: NostrEvent } & Omit<ModalProps, "children">) {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody p="4">
          <Flex gap="2" direction="column">
            <RawValue heading="Event Id" value={event.id} />
            <RawValue heading="Encoded id (NIP-19)" value={nip19.noteEncode(event.id)} />
            <RawPre heading="Content" value={event.content} />
            <RawJson heading="JSON" json={event} />
            <RawJson heading="References" json={getReferences(event)} />
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
