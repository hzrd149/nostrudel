import { useCallback, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Flex,
  Button,
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
  FormHelperText,
  Link,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  ModalCloseButton,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { kinds } from "nostr-tools";

import { ChevronDownIcon, ChevronUpIcon, UploadImageIcon } from "../icons";
import PublishAction from "../../classes/nostr-publish-action";
import { PublishDetails } from "../../views/task-manager/publish-log/publish-details";
import { TrustProvider } from "../../providers/local/trust-provider";
import {
  correctContentMentions,
  createEmojiTags,
  ensureNotifyPubkeys,
  finalizeNote,
  getPubkeysMentionedInContent,
  setZapSplit,
} from "../../helpers/nostr/post";
import { UserAvatarStack } from "../compact-user-stack";
import MagicTextArea, { RefType } from "../magic-textarea";
import { useContextEmojis } from "../../providers/global/emoji-provider";
import CommunitySelect from "./community-select";
import ZapSplitCreator, { fillRemainingPercent } from "./zap-split-creator";
import { EventSplit } from "../../helpers/nostr/zaps";
import useCurrentAccount from "../../hooks/use-current-account";
import useCacheForm from "../../hooks/use-cache-form";
import { useTextAreaUploadFileWithForm } from "../../hooks/use-textarea-upload-file";
import { useThrottle } from "react-use";
import MinePOW from "../pow/mine-pow";
import useAppSettings from "../../hooks/use-app-settings";
import { ErrorBoundary } from "../error-boundary";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { TextNoteContents } from "../note/timeline-note/text-note-contents";

type FormValues = {
  subject: string;
  content: string;
  nsfw: boolean;
  nsfwReason: string;
  community: string;
  split: EventSplit;
  difficulty: number;
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
  const publish = usePublishEvent();
  const account = useCurrentAccount()!;
  const { noteDifficulty } = useAppSettings();
  const [miningTarget, setMiningTarget] = useState(0);
  const [publishAction, setPublishAction] = useState<PublishAction>();
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
      difficulty: noteDifficulty || 0,
    },
    mode: "all",
  });

  // watch form state
  formState.isDirty;
  watch("content");
  watch("nsfw");
  watch("nsfwReason");
  watch("split");
  watch("difficulty");

  // cache form to localStorage
  useCacheForm<FormValues>(cacheFormKey, getValues, reset, formState);

  const imageUploadRef = useRef<HTMLInputElement | null>(null);

  const textAreaRef = useRef<RefType | null>(null);
  const { onPaste, onFileInputChange, uploading } = useTextAreaUploadFileWithForm(textAreaRef, getValues, setValue);

  const getDraft = useCallback(() => {
    const { content, nsfw, nsfwReason, community, split, subject } = getValues();

    let updatedDraft = finalizeNote({
      content: correctContentMentions(content),
      kind: kinds.ShortTextNote,
      tags: [],
      created_at: dayjs().unix(),
    });

    if (nsfw) updatedDraft.tags.push(nsfwReason ? ["content-warning", nsfwReason] : ["content-warning"]);
    if (community) updatedDraft.tags.push(["a", community]);
    if (subject) updatedDraft.tags.push(["subject", subject]);

    const contentMentions = getPubkeysMentionedInContent(updatedDraft.content);
    updatedDraft = createEmojiTags(updatedDraft, emojis);
    updatedDraft = ensureNotifyPubkeys(updatedDraft, contentMentions);
    if (split.length > 0) {
      updatedDraft = setZapSplit(updatedDraft, fillRemainingPercent(split, account.pubkey));
    }
    return updatedDraft;
  }, [getValues, emojis]);

  const publishPost = async (draft = getDraft()) => {
    const pub = await publish("Post", draft);
    if (pub) setPublishAction(pub);
  };
  const submit = handleSubmit(async (values) => {
    if (values.difficulty > 0) {
      setMiningTarget(values.difficulty);
    } else publishPost();
  });

  const canSubmit = getValues().content.length > 0;
  const mentions = getPubkeysMentionedInContent(correctContentMentions(getValues().content));

  const previewDraft = useThrottle(getDraft(), 500);

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

    if (miningTarget) {
      return (
        <MinePOW
          draft={{ ...getDraft(), pubkey: account.pubkey }}
          targetPOW={miningTarget}
          onCancel={() => setMiningTarget(0)}
          onSkip={publishPost}
          onComplete={publishPost}
        />
      );
    }

    // TODO: wrap this in a form
    return (
      <>
        {requireSubject && <Input {...register("subject", { required: true })} isRequired placeholder="Subject" />}
        <MagicTextArea
          autoFocus
          mb="2"
          value={getValues().content}
          onChange={(e) => setValue("content", e.target.value, { shouldDirty: true, shouldTouch: true })}
          rows={5}
          isRequired
          instanceRef={(inst) => (textAreaRef.current = inst)}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter") submit();
          }}
        />
        {previewDraft.content.length > 0 && (
          <Box>
            <Heading size="sm">Preview:</Heading>
            <Box borderWidth={1} borderRadius="md" p="2">
              <ErrorBoundary>
                <TrustProvider trust>
                  <TextNoteContents event={previewDraft} />
                </TrustProvider>
              </ErrorBoundary>
            </Box>
          </Box>
        )}
        <Flex gap="2" alignItems="center" justifyContent="flex-end">
          <Flex mr="auto" gap="2">
            <VisuallyHiddenInput
              type="file"
              accept="image/*,audio/*,video/*"
              ref={imageUploadRef}
              onChange={onFileInputChange}
            />
            <IconButton
              icon={<UploadImageIcon boxSize={6} />}
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
              <FormControl>
                <FormLabel>POW Difficulty ({getValues().difficulty})</FormLabel>
                <Slider
                  aria-label="difficulty"
                  value={getValues("difficulty")}
                  onChange={(v) => setValue("difficulty", v)}
                  min={0}
                  max={40}
                  step={1}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <FormHelperText>
                  The number of leading 0's in the event id. see{" "}
                  <Link href="https://github.com/nostr-protocol/nips/blob/master/13.md" isExternal>
                    NIP-13
                  </Link>
                </FormHelperText>
              </FormControl>
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
        {publishAction && <ModalCloseButton />}
        <ModalBody display="flex" flexDirection="column" padding={["2", "2", "4"]} gap="2">
          {renderContent()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
