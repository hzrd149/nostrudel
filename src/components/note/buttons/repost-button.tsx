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
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import { RepostIcon } from "../../icons";
import { buildRepost } from "../../../helpers/nostr-event";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { nostrPostAction } from "../../../classes/nostr-post-action";
import clientRelaysService from "../../../services/client-relays";
import signingService from "../../../services/signing";
import QuoteNote from "../quote-note";

export function RepostButton({ event }: { event: NostrEvent }) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const account = useCurrentAccount();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleClick = async () => {
    try {
      if (!account) throw new Error("not logged in");
      setLoading(true);
      const draftRepost = buildRepost(event);
      const repost = await signingService.requestSignature(draftRepost, account);
      await nostrPostAction(clientRelaysService.getWriteUrls(), repost);
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
        isDisabled={account?.readonly ?? true}
        isLoading={loading}
      />
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader px="4" py="2">
              Repost Note?
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" py="0">
              <QuoteNote noteId={event.id} />
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
