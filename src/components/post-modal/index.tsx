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
  useDisclosure,
} from "@chakra-ui/react";
import moment from "moment";
import React, { useState } from "react";
import { useList } from "react-use";
import { nostrPostAction, PostResult } from "../../classes/nostr-post-action";
import { getReferences } from "../../helpers/nostr-event";
import { useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { useSigningContext } from "../../providers/signing-provider";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import { NoteLink } from "../note-link";
import { NoteContents } from "../note/note-contents";
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
  const { requestSignature } = useSigningContext();
  const writeRelays = useWriteRelayUrls();
  const [waiting, setWaiting] = useState(false);
  const [signedEvent, setSignedEvent] = useState<NostrEvent | null>(null);
  const [results, resultsActions] = useList<PostResult>();
  const { isOpen: showPreview, onToggle: togglePreview } = useDisclosure();
  const [draft, setDraft] = useState<DraftNostrEvent>(() => Object.assign(emptyDraft(), initialDraft));

  const handleContentChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    setDraft((d) => ({ ...d, content: event.target.value }));
  };

  const handleSubmit = async () => {
    setWaiting(true);
    const updatedDraft: DraftNostrEvent = { ...draft, created_at: moment().unix() };
    // add client tag, TODO: find a better place for this
    if (!updatedDraft.tags.some((t) => t[0] === "client")) {
      updatedDraft.tags.push(["client", "noStrudel"]);
    }
    const event = await requestSignature(updatedDraft);
    setWaiting(false);
    if (!event) return;
    setSignedEvent(event);

    const { results } = nostrPostAction(writeRelays, event);
    results.subscribe((result) => {
      resultsActions.push(result);
    });
  };

  const refs = getReferences(draft);

  const canSubmit = draft.content.length > 0;

  const renderContent = () => {
    if (signedEvent) {
      return <PostResults event={signedEvent} results={results} onClose={onClose} />;
    }
    return (
      <>
        {refs.replyId && (
          <Text mb="2">
            Replying to: <NoteLink noteId={refs.replyId} />
          </Text>
        )}
        {showPreview ? (
          <NoteContents event={draft} trusted />
        ) : (
          <Textarea autoFocus mb="2" value={draft.content} onChange={handleContentChange} rows={5} />
        )}
        <Flex gap="2" alignItems="center" justifyContent="flex-end">
          {draft.content.length > 0 && <Button onClick={togglePreview}>Preview</Button>}
          <Button onClick={onClose}>Cancel</Button>
          <Button colorScheme="blue" type="submit" isLoading={waiting} onClick={handleSubmit} isDisabled={!canSubmit}>
            Post
          </Button>
        </Flex>
      </>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalBody padding="4">{renderContent()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
