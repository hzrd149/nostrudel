import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, Flex } from "@chakra-ui/react";
import { ModalProps } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { getReferences } from "../../helpers/nostr/events";
import { NostrEvent } from "../../types/nostr-event";
import RawJson from "./raw-json";
import RawValue from "./raw-value";
import RawPre from "./raw-pre";
import { getSharableEventAddress } from "../../helpers/nip19";

export default function NoteDebugModal({ event, ...props }: { event: NostrEvent } & Omit<ModalProps, "children">) {
  return (
    <Modal size="6xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody p="4">
          <Flex gap="2" direction="column">
            <RawValue heading="Event Id" value={event.id} />
            <RawValue heading="NIP-19 Encoded Id" value={nip19.noteEncode(event.id)} />
            <RawValue heading="NIP-19 Pointer" value={getSharableEventAddress(event)} />
            <RawPre heading="Content" value={event.content} />
            <RawJson heading="JSON" json={event} />
            <RawJson heading="References" json={getReferences(event)} />
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
