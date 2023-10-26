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

import { ChevronDownIcon, ChevronUpIcon, UploadImageIcon } from "../icons";
import NostrPublishAction from "../../classes/nostr-publish-action";
import { useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useSigningContext } from "../../providers/signing-provider";
import { NoteContents } from "../note/note-contents";
import { PublishDetails } from "../publish-details";
import { TrustProvider } from "../../providers/trust";
import {
  correctContentMentions,
  createEmojiTags,
  ensureNotifyPubkeys,
  finalizeNote,
  getContentMentions,
  setZapSplit,
} from "../../helpers/nostr/post";
import { UserAvatarStack } from "../compact-user-stack";
import MagicTextArea, { RefType } from "../magic-textarea";
import { useContextEmojis } from "../../providers/emoji-provider";
import { nostrBuildUploadImage as nostrBuildUpload } from "../../helpers/nostr-build";
import CommunitySelect from "./community-select";
import ZapSplitCreator, { fillRemainingPercent } from "./zap-split-creator";
import { EventSplit } from "../../helpers/nostr/zaps";
import { useCurrentAccount } from "../../hooks/use-current-account";
import useCacheForm from "../../hooks/use-cache-form";

type FormValues = {
  subject: string;
  content: string;
  nsfw: boolean;
  nsfwReason: string;
  community: string;
  split: EventSplit;
};

export type PostModalProps = {
  cacheFormKey?: string | null;
  initContent?: string;
  initCommunity?: string;
  requireSubject?: boolean;
};

export default function PostModal({
  isOpen,
  onClose,
  cacheFormKey = "new-note",
  initContent = "",
  initCommunity = "",
  requireSubject,
}: Omit<ModalProps, "children"> & PostModalProps) {
  const toast = useToast();
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const writeRelays = useWriteRelayUrls();
  const [publishAction, setPublishAction] = useState<NostrPublishAction>();
  const emojis = useContextEmojis();
  const moreOptions = useDisclosure();

  const { getValues, setValue, watch, register, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: {
      subject: "",
      content: initContent,
      nsfw: false,
      nsfwReason: "",
      community: initCommunity,
      split: [] as EventSplit,
    },
    mode: "all",
  });
  watch("content");
  watch("nsfw");
  watch("nsfwReason");
  watch("split");

  // cache form to localStorage
  useCacheForm<FormValues>(cacheFormKey, getValues, setValue, formState);

  const textAreaRef = useRef<RefType | null>(null);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFile = useCallback(
    async (file: File) => {
      try {
        if (!(file.type.includes("image") || file.type.includes("video") || file.type.includes("audio")))
          throw new Error("Unsupported file type");

        setUploading(true);

        const response = await nostrBuildUpload(file, requestSignature);
        const imageUrl = response.url;

        const content = getValues().content;
        const position = textAreaRef.current?.getCaretPosition();
        if (position !== undefined) {
          setValue("content", content.slice(0, position) + imageUrl + " " + content.slice(position), {
            shouldDirty: true,
          });
        } else setValue("content", content + imageUrl + " ", { shouldDirty: true });
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setUploading(false);
    },
    [setValue, getValues],
  );

  const getDraft = useCallback(() => {
    const { content, nsfw, nsfwReason, community, split, subject } = getValues();

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
    if (subject) {
      updatedDraft.tags.push(["subject", subject]);
    }

    const contentMentions = getContentMentions(updatedDraft.content);
    updatedDraft = createEmojiTags(updatedDraft, emojis);
    updatedDraft = ensureNotifyPubkeys(updatedDraft, contentMentions);
    if (split.length > 0) {
      updatedDraft = setZapSplit(updatedDraft, fillRemainingPercent(split, account.pubkey));
    }
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
        {requireSubject && <Input {...register("subject", { required: true })} isRequired placeholder="Subject" />}
        <MagicTextArea
          autoFocus
          mb="2"
          value={getValues().content}
          onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
          rows={5}
          isRequired
          instanceRef={(inst) => (textAreaRef.current = inst)}
          onPaste={(e) => {
            const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
            if (imageFile) uploadFile(imageFile);
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
              accept="image/*,audio/*,video/*"
              ref={imageUploadRef}
              onChange={(e) => {
                const img = e.target.files?.[0];
                if (img) uploadFile(img);
              }}
            />
            <IconButton
              icon={<UploadImageIcon />}
              aria-label="Upload Image"
              title="Upload Image"
              onClick={() => imageUploadRef.current?.click()}
              isLoading={uploading}
            />
            <Button
              variant="link"
              rightIcon={moreOptions.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={moreOptions.onToggle}
            >
              More Options
            </Button>
          </Flex>
          {mentions.length > 0 && <UserAvatarStack label="Mentions" pubkeys={mentions} />}
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={() => reset()} isDisabled={!formState.isDirty}>
            Reset
          </Button>
          <Button
            colorScheme="primary"
            type="submit"
            isLoading={formState.isSubmitting}
            onClick={submit}
            isDisabled={!canSubmit}
          >
            Post
          </Button>
        </Flex>
        {moreOptions.isOpen && (
          <Flex direction={{ base: "column", lg: "row" }} gap="4">
            <Flex direction="column" gap="2" flex={1}>
              <FormControl>
                <FormLabel>Post to community</FormLabel>
                <CommunitySelect {...register("community")} />
              </FormControl>
              <Flex gap="2" direction="column">
                <Switch {...register("nsfw")}>NSFW</Switch>
                {getValues().nsfw && (
                  <Input {...register("nsfwReason", { required: true })} placeholder="Reason" isRequired />
                )}
              </Flex>
            </Flex>
            <Flex direction="column" gap="2" flex={1}>
              <ZapSplitCreator
                split={getValues().split}
                onChange={(s) => setValue("split", s, { shouldDirty: true })}
                authorPubkey={account?.pubkey}
              />
            </Flex>
          </Flex>
        )}
      </>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalBody display="flex" flexDirection="column" padding={["2", "2", "4"]} gap="2">
          {renderContent()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
