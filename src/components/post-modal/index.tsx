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
import moment from "moment";
import React, { useRef, useState } from "react";
import { useList } from "react-use";
import { nostrPostAction, PostResult } from "../../classes/nostr-post-action";
import { getReferences } from "../../helpers/nostr-event";
import { useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { useSigningContext } from "../../providers/signing-provider";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import { CameraIcon, ImageIcon } from "../icons";
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
  const imageCaptureRef = useRef<HTMLInputElement | null>(null);
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
      if (e instanceof Error) {
        toast({
          status: "error",
          description: e.message,
        });
      }
    }
    setUploading(false);
  };

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
            <VisuallyHiddenInput
              type="file"
              accept="image/*"
              ref={imageCaptureRef}
              capture="environment"
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
            {isMobile && (
              <IconButton
                icon={<CameraIcon />}
                aria-label="Capture Image"
                title="Capture Image"
                onClick={() => imageUploadRef.current?.click()}
                isLoading={uploading}
              />
            )}
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
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalBody padding={isMobile ? "2" : "4"}>{renderContent()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
