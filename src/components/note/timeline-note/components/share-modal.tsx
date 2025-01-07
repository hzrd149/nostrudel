import { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useEventFactory } from "applesauce-react/hooks";

import { usePublishEvent } from "../../../../providers/global/publish-provider";
import { EmbedEvent } from "../../../embed-event";

export default function ShareModal({
  event,
  isOpen,
  onClose,
  ...props
}: Omit<ModalProps, "children"> & { event: NostrEvent }) {
  const publish = usePublishEvent();
  const factory = useEventFactory();

  const [loading, setLoading] = useState(false);
  const share = async () => {
    setLoading(true);
    const draft = await factory.share(event);

    await publish("Share", draft);
    onClose();
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px="4" py="2">
          Share Note
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" py="0">
          <EmbedEvent event={event} />
        </ModalBody>

        <ModalFooter px="4" py="4">
          <Button variant="ghost" size="md" mr="auto" onClick={onClose} flexShrink={0}>
            Cancel
          </Button>
          <Button
            colorScheme="primary"
            variant="solid"
            onClick={() => share()}
            size="md"
            isLoading={loading}
            flexShrink={0}
          >
            Share
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
