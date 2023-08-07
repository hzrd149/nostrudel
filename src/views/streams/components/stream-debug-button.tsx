import {
  Flex,
  IconButton,
  IconButtonProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { CodeIcon } from "../../../components/icons";
import RawValue from "../../../components/debug-modals/raw-value";
import RawJson from "../../../components/debug-modals/raw-json";
import { ParsedStream } from "../../../helpers/nostr/stream";
import useEventNaddr from "../../../hooks/use-event-naddr";

export default function StreamDebugButton({
  stream,
  ...props
}: { stream: ParsedStream } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const debugModal = useDisclosure();
  const naddr = useEventNaddr(stream.event);

  return (
    <>
      <IconButton icon={<CodeIcon />} aria-label="Show raw event" onClick={debugModal.onOpen} {...props} />

      <Modal isOpen={debugModal.isOpen} onClose={debugModal.onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Raw event</ModalHeader>
          <ModalCloseButton />
          <ModalBody p="4">
            <Flex gap="2" direction="column">
              <RawValue heading="Event Id" value={stream.event.id} />
              <RawValue heading="naddr" value={naddr} />
              <RawJson heading="Parsed" json={{ ...stream, event: "Omitted, see JSON below" }} />
              <RawJson heading="JSON" json={stream.event} />
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
