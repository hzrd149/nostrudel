import React, { useMemo, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Flex,
  Button,
  Text,
  VisuallyHiddenInput,
  IconButton,
  useToast,
  Box,
  Heading,
} from "@chakra-ui/react";
import dayjs from "dayjs";

import NostrPublishAction from "../../classes/nostr-publish-action";
import { getReferences } from "../../helpers/nostr/events";
import { useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useSigningContext } from "../../providers/signing-provider";
import { DraftNostrEvent } from "../../types/nostr-event";
import { ImageIcon } from "../icons";
import { NoteLink } from "../note-link";
import { NoteContents } from "../note/note-contents";
import { PublishDetails } from "../publish-details";
import { TrustProvider } from "../../providers/trust";
import { createEmojiTags, ensureNotifyPubkeys, finalizeNote, getContentMentions } from "../../helpers/nostr/post";
import { UserAvatarStack } from "../compact-user-stack";
import MagicTextArea from "../magic-textarea";
import { useContextEmojis } from "../../providers/emoji-provider";

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
  const [signing, setSigning] = useState(false);
  const [publishAction, setPublishAction] = useState<NostrPublishAction>();
  const [draft, setDraft] = useState<DraftNostrEvent>(() => Object.assign(emptyDraft(), initialDraft));
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const emojis = useContextEmojis();

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

  const finalDraft = useMemo(() => {
    let updatedDraft = finalizeNote(draft);
    const contentMentions = getContentMentions(draft.content);
    updatedDraft = createEmojiTags(updatedDraft, emojis);
    updatedDraft = ensureNotifyPubkeys(updatedDraft, contentMentions);
    return updatedDraft;
  }, [draft, emojis]);

  const handleSubmit = async () => {
    try {
      setSigning(true);
      const signed = await requestSignature(finalDraft);
      setSigning(false);

      const pub = new NostrPublishAction("Post", writeRelays, signed);
      setPublishAction(pub);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
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
        <MagicTextArea
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
        {draft.content.length > 0 && (
          <Box>
            <Heading size="sm">Preview:</Heading>
            <Box borderWidth={1} borderRadius="md" p="2">
              <TrustProvider trust>
                <NoteContents event={finalDraft} />
              </TrustProvider>
            </Box>
          </Box>
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
          <UserAvatarStack label="Mentions" pubkeys={getContentMentions(draft.content)} />
          <Button onClick={onClose}>Cancel</Button>
          <Button colorScheme="blue" type="submit" isLoading={signing} onClick={handleSubmit} isDisabled={!canSubmit}>
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
        <ModalBody display="flex" flexDirection="column" padding={["2", "2", "4"]} gap="2">
          {renderContent()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
