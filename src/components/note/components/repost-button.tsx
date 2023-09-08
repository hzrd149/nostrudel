import { useState } from "react";
import {
  Button,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { RepostIcon } from "../../icons";
import { buildRepost } from "../../../helpers/nostr/events";
import clientRelaysService from "../../../services/client-relays";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { useSigningContext } from "../../../providers/signing-provider";
import { EmbedEvent } from "../../embed-event";

export function RepostButton({ event }: { event: NostrEvent }) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  const handleClick = async () => {
    try {
      setLoading(true);
      const draftRepost = buildRepost(event);
      const signed = await requestSignature(draftRepost);
      const pub = new NostrPublishAction("Repost", clientRelaysService.getWriteUrls(), signed);
      await pub.onComplete;
      onClose();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  };

  return (
    <>
      <IconButton
        icon={<RepostIcon />}
        onClick={onOpen}
        aria-label="Repost Note"
        title="Repost Note"
        isLoading={loading}
      />
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader px="4" py="2">
              Repost Note?
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" py="0">
              <EmbedEvent event={event} />
            </ModalBody>

            <ModalFooter px="4" py="4">
              <Button variant="ghost" size="sm" mr={2} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="brand" variant="solid" onClick={handleClick} size="sm" isLoading={loading}>
                Repost
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
