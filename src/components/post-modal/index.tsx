import { useCallback, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Flex,
  Button,
  useToast,
  Box,
  Heading,
  useDisclosure,
  Input,
  Switch,
  ModalProps,
  VisuallyHiddenInput,
  IconButton,
  FormLabel,
  FormControl,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { Kind } from "nostr-tools";

import NostrPublishAction from "../../classes/nostr-publish-action";
import { useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useSigningContext } from "../../providers/signing-provider";
import { ArrowDownSIcon, ArrowUpSIcon, ImageIcon } from "../icons";
import { NoteContents } from "../note/note-contents";
import { PublishDetails } from "../publish-details";
import { TrustProvider } from "../../providers/trust";
import {
  correctContentMentions,
  createEmojiTags,
  ensureNotifyPubkeys,
  finalizeNote,
  getContentMentions,
} from "../../helpers/nostr/post";
import { UserAvatarStack } from "../compact-user-stack";
import MagicTextArea, { RefType } from "../magic-textarea";
import { useContextEmojis } from "../../providers/emoji-provider";
import { nostrBuildUploadImage } from "../../helpers/nostr-build";
import CommunitySelect from "./community-select";

export default function PostModal({
  isOpen,
  onClose,
  initContent = "",
}: Omit<ModalProps, "children"> & { initContent?: string }) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const writeRelays = useWriteRelayUrls();
  const [publishAction, setPublishAction] = useState<NostrPublishAction>();
  const emojis = useContextEmojis();
  const moreOptions = useDisclosure();

  const { getValues, setValue, watch, register, handleSubmit, formState } = useForm({
    defaultValues: {
      content: initContent,
      nsfw: false,
      nsfwReason: "",
      community: "",
    },
  });
  watch("content");
  watch("nsfw");
  watch("nsfwReason");

  const textAreaRef = useRef<RefType | null>(null);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadImage = useCallback(
    async (imageFile: File) => {
      try {
        if (!imageFile.type.includes("image")) throw new Error("Only images are supported");
        setUploading(true);

        const response = await nostrBuildUploadImage(imageFile, requestSignature);
        const imageUrl = response.url;

        const content = getValues().content;
        const position = textAreaRef.current?.getCaretPosition();
        if (position !== undefined) {
          setValue("content", content.slice(0, position) + imageUrl + " " + content.slice(position));
        } else setValue("content", content + imageUrl + " ");
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setUploading(false);
    },
    [setValue, getValues],
  );

  const getDraft = useCallback(() => {
    const { content, nsfw, nsfwReason, community } = getValues();

    let updatedDraft = finalizeNote({
      content: content,
      kind: Kind.Text,
      tags: [],
      created_at: dayjs().unix(),
    });

    updatedDraft.content = correctContentMentions(updatedDraft.content);

    if (nsfw) {
      updatedDraft.tags.push(nsfwReason ? ["content-warning", nsfwReason] : ["content-warning"]);
    }
    if (community) {
      updatedDraft.tags.push(["a", community]);
    }

    const contentMentions = getContentMentions(updatedDraft.content);
    updatedDraft = createEmojiTags(updatedDraft, emojis);
    updatedDraft = ensureNotifyPubkeys(updatedDraft, contentMentions);
    return updatedDraft;
  }, [getValues, emojis]);

  const submit = handleSubmit(async () => {
    try {
      const signed = await requestSignature(getDraft());
      const pub = new NostrPublishAction("Post", writeRelays, signed);
      setPublishAction(pub);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  const canSubmit = getValues().content.length > 0;
  const mentions = getContentMentions(correctContentMentions(getValues().content));

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
        <MagicTextArea
          autoFocus
          mb="2"
          value={getValues().content}
          onChange={(e) => setValue("content", e.target.value)}
          rows={5}
          isRequired
          instanceRef={(inst) => (textAreaRef.current = inst)}
          onPaste={(e) => {
            const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
            if (imageFile) uploadImage(imageFile);
          }}
        />
        {getValues().content.length > 0 && (
          <Box>
            <Heading size="sm">Preview:</Heading>
            <Box borderWidth={1} borderRadius="md" p="2">
              <TrustProvider trust>
                <NoteContents event={getDraft()} />
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
            <Button
              variant="link"
              rightIcon={moreOptions.isOpen ? <ArrowUpSIcon /> : <ArrowDownSIcon />}
              onClick={moreOptions.onToggle}
            >
              More Options
            </Button>
          </Flex>
          {mentions.length > 0 && <UserAvatarStack label="Mentions" pubkeys={mentions} />}
          <Button onClick={onClose}>Cancel</Button>
          <Button
            colorScheme="blue"
            type="submit"
            isLoading={formState.isSubmitting}
            onClick={submit}
            isDisabled={!canSubmit}
          >
            Post
          </Button>
        </Flex>
        {moreOptions.isOpen && (
          <>
            <FormControl>
              <FormLabel>Post to community</FormLabel>
              <CommunitySelect w="sm" {...register("community")} />
            </FormControl>
            <Flex gap="2" direction="column">
              <Switch {...register("nsfw")}>NSFW</Switch>
              {getValues().nsfw && <Input {...register("nsfwReason")} placeholder="Reason" maxW="50%" />}
            </Flex>
          </>
        )}
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
}
