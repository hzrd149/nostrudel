import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Flex } from "@chakra-ui/react";
import { ModalProps } from "@chakra-ui/react";
import { Bech32Prefix, hexToBech32 } from "../../helpers/nip19";
import { getReferences } from "../../helpers/nostr-event";
import { NostrEvent } from "../../types/nostr-event";
import RawJson from "./raw-block";
import RawValue from "./raw-value";

export default function NoteDebugModal({ event, ...props }: { event: NostrEvent } & Omit<ModalProps, "children">) {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody overflow="auto" p="4">
          <Flex gap="2" direction="column">
            <RawValue heading="Event Id" value={event.id} />
            <RawValue heading="Encoded id (NIP-19)" value={hexToBech32(event.id, Bech32Prefix.Note) ?? "failed"} />
            <RawJson heading="Raw" json={event} />
            <RawJson heading="References" json={getReferences(event)} />
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
