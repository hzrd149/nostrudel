import { useRef, useState } from "react";
import {
  Flex,
  Button,
  Box,
  Heading,
  useDisclosure,
  Input,
  Switch,
  FormLabel,
  FormControl,
  FormHelperText,
  Link,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Alert,
  AlertIcon,
  ButtonGroup,
  Text,
  FlexProps,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { UnsignedEvent } from "nostr-tools";
import { useAsync, useThrottle } from "react-use";
import { useEventFactory, useObservable } from "applesauce-react/hooks";
import { Emoji } from "applesauce-core/helpers";

import { useFinalizeDraft, usePublishEvent } from "../../../providers/global/publish-provider";
import useCurrentAccount from "../../../hooks/use-current-account";
import useAppSettings from "../../../hooks/use-app-settings";
import localSettings from "../../../services/local-settings";
import useLocalStorageDisclosure from "../../../hooks/use-localstorage-disclosure";
import PublishAction from "../../../classes/nostr-publish-action";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import useCacheForm from "../../../hooks/use-cache-form";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import { ErrorBoundary } from "../../../components/error-boundary";
import { TrustProvider } from "../../../providers/local/trust-provider";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";
import InsertImageButton from "./insert-image-button";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import ZapSplitCreator, { Split } from "./zap-split-creator";
import MinePOW from "../../../components/pow/mine-pow";
import { PublishDetails } from "../../task-manager/publish-log/publish-details";
import CommunitySelect from "../../../components/post-modal/community-select";

type FormValues = {
  content: string;
  nsfw: boolean;
  nsfwReason: string;
  community: string;
  split: Split[];
  difficulty: number;
};

export type ShortTextNoteFormProps = {
  cacheFormKey?: string | null;
  initContent?: string;
  initCommunity?: string;
};

export default function ShortTextNoteForm({
  cacheFormKey = "new-note",
  initContent = "",
  initCommunity = "",
}: Omit<FlexProps, "children"> & ShortTextNoteFormProps) {
  const publish = usePublishEvent();
  const finalizeDraft = useFinalizeDraft();
  const account = useCurrentAccount()!;
  const { noteDifficulty } = useAppSettings();
  const addClientTag = useObservable(localSettings.addClientTag);
  const promptAddClientTag = useLocalStorageDisclosure("prompt-add-client-tag", true);
  const [miningTarget, setMiningTarget] = useState(0);
  const [publishAction, setPublishAction] = useState<PublishAction>();
  const emojis = useContextEmojis();
  const advanced = useDisclosure();

  const factory = useEventFactory();
  const [draft, setDraft] = useState<UnsignedEvent>();
  const { getValues, setValue, watch, register, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: {
      content: initContent,
      nsfw: false,
      nsfwReason: "",
      community: initCommunity,
      split: [] as Split[],
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

  const getDraft = async (values = getValues()) => {
    // build draft using factory
    let draft = await factory.note(values.content, {
      emojis: emojis.filter((e) => !!e.url) as Emoji[],
      contentWarning: values.nsfw ? values.nsfwReason || values.nsfw : false,
      splits: values.split,
    });

    // TODO: remove when NIP-72 communities are removed
    if (values.community) draft.tags.push(["a", values.community]);

    const unsigned = await finalizeDraft(draft);

    setDraft(unsigned);
    return unsigned;
  };

  // throttle update the draft every 500ms
  const throttleValues = useThrottle(getValues(), 500);
  const { value: preview } = useAsync(() => getDraft(), [throttleValues]);

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const publishPost = async (unsigned?: UnsignedEvent) => {
    unsigned = unsigned || draft || (await getDraft());

    const pub = await publish("Post", unsigned);
    if (pub) setPublishAction(pub);
  };
  const submit = handleSubmit(async (values) => {
    if (values.difficulty > 0) {
      setMiningTarget(values.difficulty);
    } else {
      const unsigned = await getDraft(values);
      publishPost(unsigned);
    }
  });

  const canSubmit = getValues().content.length > 0;

  if (publishAction) {
    return (
      <Flex direction="column" gap="2">
        <PublishDetails pub={publishAction} />
      </Flex>
    );
  }

  if (miningTarget && draft) {
    return (
      <Flex direction="column" gap="2">
        <MinePOW
          draft={draft}
          targetPOW={miningTarget}
          onCancel={() => setMiningTarget(0)}
          onSkip={publishPost}
          onComplete={publishPost}
        />
      </Flex>
    );
  }

  const showAdvanced =
    advanced.isOpen || formState.dirtyFields.difficulty || formState.dirtyFields.nsfw || formState.dirtyFields.split;

  // TODO: wrap this in a form
  return (
    <>
      <Flex direction="column" gap="2">
        <MagicTextArea
          autoFocus
          mb="2"
          value={getValues().content}
          onChange={(e) => setValue("content", e.target.value, { shouldDirty: true, shouldTouch: true })}
          rows={8}
          isRequired
          instanceRef={(inst) => (textAreaRef.current = inst)}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
          }}
        />
        {preview && preview.content.length > 0 && (
          <Box>
            <Heading size="sm">Preview:</Heading>
            <Box borderWidth={1} borderRadius="md" p="2">
              <ErrorBoundary>
                <TrustProvider trust>
                  <TextNoteContents event={preview} />
                </TrustProvider>
              </ErrorBoundary>
            </Box>
          </Box>
        )}
        <Flex gap="2" alignItems="center" justifyContent="flex-end">
          <Flex mr="auto" gap="2">
            <InsertImageButton onUploaded={insertText} aria-label="Upload image" />
            <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
          </Flex>
        </Flex>
        <Flex gap="2" alignItems="center" justifyContent="space-between">
          <Button
            variant="link"
            rightIcon={advanced.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={advanced.onToggle}
          >
            More Options
          </Button>
          {formState.isDirty && (
            <Button variant="ghost" onClick={() => confirm("Clear draft?") && reset()} ms="auto">
              Clear
            </Button>
          )}
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
        {showAdvanced && (
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
                <FormLabel>POW Difficulty ({getValues("difficulty")})</FormLabel>
                <Slider
                  aria-label="difficulty"
                  value={getValues("difficulty")}
                  onChange={(v) => setValue("difficulty", v, { shouldDirty: true, shouldTouch: true })}
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
                splits={getValues().split}
                onChange={(splits) => setValue("split", splits, { shouldDirty: true, shouldTouch: true })}
                authorPubkey={account?.pubkey}
              />
            </Flex>
          </Flex>
        )}
      </Flex>

      {!addClientTag && promptAddClientTag.isOpen && (
        <Alert status="info" whiteSpace="pre-wrap" flexDirection={{ base: "column", lg: "row" }}>
          <AlertIcon hideBelow="lg" />
          <Text>
            Enable{" "}
            <Link isExternal href="https://github.com/nostr-protocol/nips/blob/master/89.md#client-tag">
              NIP-89
            </Link>{" "}
            client tags and let other users know what app you're using to write notes
          </Text>
          <ButtonGroup ml="auto" size="sm" variant="ghost">
            <Button onClick={promptAddClientTag.onClose}>Close</Button>
            <Button colorScheme="primary" onClick={() => localSettings.addClientTag.next(true)}>
              Enable
            </Button>
          </ButtonGroup>
        </Alert>
      )}
    </>
  );
}
