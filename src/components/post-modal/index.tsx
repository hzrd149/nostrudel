import React, { useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Flex,
  Button,
  Textarea,
  Text,
  useDisclosure,
  VisuallyHiddenInput,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import dayjs from "dayjs";

import NostrPublishAction from "../../classes/nostr-publish-action";
import { getReferences } from "../../helpers/nostr/event";
import { useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useSigningContext } from "../../providers/signing-provider";
import { DraftNostrEvent } from "../../types/nostr-event";
import { ImageIcon } from "../icons";
import { NoteLink } from "../note-link";
import { NoteContents } from "../note/note-contents";
import { PublishDetails } from "../publish-details";
import { TrustProvider } from "../../providers/trust";
import { ensureNotifyPubkeys, finalizeNote, getContentMentions } from "../../helpers/nostr/post";
import { UserAvatarStack } from "../user-avatar-stack";

function emptyDraft(): DraftNostrEvent {
  return {
    content: "",
    kind: 1,
    tags: [],
    created_at: dayjs().unix(),
  };
}

type PostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDraft?: Partial<DraftNostrEvent>;
};

export const PostModal = ({ isOpen, onClose, initialDraft }: PostModalProps) => {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const writeRelays = useWriteRelayUrls();
  const [waiting, setWaiting] = useState(false);
  const [publishAction, setPublishAction] = useState<NostrPublishAction>();
  const { isOpen: showPreview, onToggle: togglePreview } = useDisclosure();
  const [draft, setDraft] = useState<DraftNostrEvent>(() => Object.assign(emptyDraft(), initialDraft));
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (imageFile: File) => {
    try {
      if (!imageFile.type.includes("image")) throw new Error("Only images are supported");
      setUploading(true);
      const payload = new FormData();
      payload.append("fileToUpload", imageFile);
      const response = await fetch("https://nostr.build/upload.php", { body: payload, method: "POST" }).then((res) =>
        res.text(),
      );
      const imageUrl = response.match(/https:\/\/nostr\.build\/i\/[\w.]+/)?.[0];
      if (imageUrl) {
        setDraft((d) => ({ ...d, content: (d.content += imageUrl) }));
      }
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setUploading(false);
  };

  const handleContentChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    setDraft((d) => ({ ...d, content: event.target.value }));
  };

  const handleSubmit = async () => {
    setWaiting(true);
    let updatedDraft = finalizeNote(draft);
    const contentMentions = getContentMentions(draft.content);
    updatedDraft = ensureNotifyPubkeys(updatedDraft, contentMentions);
    const signed = await requestSignature(updatedDraft);
    setWaiting(false);
    if (!signed) return;

    const pub = new NostrPublishAction("Post", writeRelays, signed);
    setPublishAction(pub);
  };

  const refs = getReferences(draft);

  const canSubmit = draft.content.length > 0;

  const renderContent = () => {
    if (publishAction) {
      return (
        <>
          <PublishDetails pub={publishAction} />
          <Button onClick={onClose} mt="2" ml="auto">
            Close
          </Button>
        </>
      );
    }
    return (
      <>
        {refs.replyId && (
          <Text mb="2">
            Replying to: <NoteLink noteId={refs.replyId} />
          </Text>
        )}
        {showPreview ? (
          <TrustProvider trust>
            <NoteContents event={finalizeNote(draft)} />
          </TrustProvider>
        ) : (
          <Textarea
            autoFocus
            mb="2"
            value={draft.content}
            onChange={handleContentChange}
            rows={5}
            onPaste={(e) => {
              const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
              if (imageFile) uploadImage(imageFile);
            }}
          />
        )}
        <Flex gap="2" alignItems="center" justifyContent="flex-end">
          <Flex mr="auto" gap="2">
            <VisuallyHiddenInput
              type="file"
              accept="image/*"
              ref={imageUploadRef}
              onChange={(e) => {
                const img = e.target.files?.[0];
                if (img) uploadImage(img);
              }}
            />
            <IconButton
              icon={<ImageIcon />}
              aria-label="Upload Image"
              title="Upload Image"
              onClick={() => imageUploadRef.current?.click()}
              isLoading={uploading}
            />
          </Flex>
          <UserAvatarStack label="Mentions" users={getContentMentions(draft.content)} />
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
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" closeOnOverlayClick={!!publishAction}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody padding={["2", "2", "4"]}>{renderContent()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
