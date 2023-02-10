import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Flex,
  Button,
  Textarea,
  Text,
} from "@chakra-ui/react";
import moment from "moment";
import React, { useState } from "react";
import { useList } from "react-use";
import { nostrPostAction, PostResult } from "../../classes/nostr-post-action";
import { getReferences } from "../../helpers/nostr-event";
import { useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import { NoteLink } from "../note-link";
import { PostResults } from "./post-results";

function emptyDraft(): DraftNostrEvent {
  return {
    content: "",
    kind: 1,
    tags: [],
    created_at: moment().unix(),
  };
}

type PostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDraft?: Partial<DraftNostrEvent>;
};

export const PostModal = ({ isOpen, onClose, initialDraft }: PostModalProps) => {
  const isMobile = useIsMobile();
  const pad = isMobile ? "2" : "4";

  const writeRelays = useWriteRelayUrls();
  const [waiting, setWaiting] = useState(false);
  const [signedEvent, setSignedEvent] = useState<NostrEvent | null>(null);
  const [results, resultsActions] = useList<PostResult>();
  const [draft, setDraft] = useState<DraftNostrEvent>(() => Object.assign(emptyDraft(), initialDraft));

  const handleContentChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    setDraft((d) => ({ ...d, content: event.target.value }));
  };

  const handleSubmit = async () => {
    if (window.nostr) {
      setWaiting(true);
      const updatedDraft: DraftNostrEvent = { ...draft, created_at: moment().unix() };
      const event = await window.nostr.signEvent(updatedDraft);
      setWaiting(false);
      setSignedEvent(event);

      const postResults = nostrPostAction(writeRelays, event);

      postResults.subscribe({
        next(result) {
          resultsActions.push(result);
        },
      });
    }
  };

  const refs = getReferences(draft);

  const canSubmit = draft.content.length > 0;

  const renderContent = () => {
    if (signedEvent) {
      return (
        <ModalBody padding="4">
          <PostResults event={signedEvent} results={results} onClose={onClose} />
        </ModalBody>
      );
    }
    return (
      <>
        <ModalBody pr={pad} pl={pad}>
          {refs.replyId && (
            <Text mb="2">
              Replying to: <NoteLink noteId={refs.replyId} />
            </Text>
          )}
          <Textarea autoFocus mb="2" value={draft.content} onChange={handleContentChange} rows={5} />
        </ModalBody>
        <ModalFooter pr={pad} pl={pad} pb={pad} pt="0">
          <Flex gap="2" alignItems="center">
            <Button onClick={onClose} isDisabled={waiting} ml="auto">
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={waiting} onClick={handleSubmit} isDisabled={!canSubmit}>
              Post
            </Button>
          </Flex>
        </ModalFooter>
      </>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>{renderContent()}</ModalContent>
    </Modal>
  );
};
