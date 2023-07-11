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
import React, { useRef, useState } from "react";
import { useList } from "react-use";
import { nostrPostAction, PostResult } from "../../classes/nostr-post-action";
import { normalizeToHex } from "../../helpers/nip19";
import { getReferences } from "../../helpers/nostr-event";
import { matchHashtag, mentionNpubOrNote } from "../../helpers/regexp";
import { useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { useSigningContext } from "../../providers/signing-provider";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import { ImageIcon } from "../icons";
import { NoteLink } from "../note-link";
import { NoteContents } from "../note/note-contents";
import { PostResults } from "./post-results";
import { TrustProvider } from "../../providers/trust";

function emptyDraft(): DraftNostrEvent {
  return {
    content: "",
    kind: 1,
    tags: [],
    created_at: dayjs().unix(),
  };
}

function finalizeNote(draft: DraftNostrEvent) {
  const updatedDraft: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags), created_at: dayjs().unix() };

  // replace all occurrences of @npub and @note
  while (true) {
    const match = mentionNpubOrNote.exec(updatedDraft.content);
    if (!match || match.index === undefined) break;

    const hex = normalizeToHex(match[1]);
    if (!hex) continue;
    const mentionType = match[2] === "npub1" ? "p" : "e";
    // TODO: find the best relay for this user or note
    const existingMention = updatedDraft.tags.find((t) => t[0] === mentionType && t[1] === hex);
    const index = existingMention
      ? updatedDraft.tags.indexOf(existingMention)
      : updatedDraft.tags.push([mentionType, hex, "", "mention"]) - 1;

    // replace the npub1 or note1 with a mention tag #[0]
    const c = updatedDraft.content;
    updatedDraft.content = c.slice(0, match.index) + `#[${index}]` + c.slice(match.index + match[0].length);
  }

  // replace all uses of #hashtag
  const matches = updatedDraft.content.matchAll(new RegExp(matchHashtag, "gi"));
  for (const [_, space, hashtag] of matches) {
    const lower = hashtag.toLocaleLowerCase();
    if (!updatedDraft.tags.find((t) => t[0] === "t" && t[1] === lower)) {
      updatedDraft.tags.push(["t", lower]);
    }
  }

  return updatedDraft;
}

type PostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDraft?: Partial<DraftNostrEvent>;
};

export const PostModal = ({ isOpen, onClose, initialDraft }: PostModalProps) => {
  const isMobile = useIsMobile();
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const writeRelays = useWriteRelayUrls();
  const [waiting, setWaiting] = useState(false);
  const [signedEvent, setSignedEvent] = useState<NostrEvent | null>(null);
  const [results, resultsActions] = useList<PostResult>();
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
        res.text()
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
    const updatedDraft = finalizeNote(draft);
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
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody padding={isMobile ? "2" : "4"}>{renderContent()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
