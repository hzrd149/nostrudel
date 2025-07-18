import {
  Alert,
  AlertIcon,
  Box,
  Button,
  ButtonGroup,
  Flex,
  FlexProps,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Link,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Emoji, getEventPointerFromQTag, processTags } from "applesauce-core/helpers";
import { useEventFactory, useObservableEagerState } from "applesauce-react/hooks";
import { UnsignedEvent } from "nostr-tools";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useThrottle } from "react-use";

import { useActiveAccount } from "applesauce-react/hooks";
import { ErrorBoundary } from "../../../components/error-boundary";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";
import MinePOW from "../../../components/pow/mine-pow";
import InsertReactionButton from "../../../components/reactions/insert-reaction-button";
import useCacheForm from "../../../hooks/use-cache-form";
import useLocalStorageDisclosure from "../../../hooks/use-localstorage-disclosure";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import { PublishLogEntry, usePublishEvent } from "../../../providers/global/publish-provider";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import { eventStore } from "../../../services/event-store";
import localSettings from "../../../services/preferences";
import { PublishLogEntryDetails } from "../../task-manager/publish-log/entry-details";
import InsertImageButton from "./insert-image-button";
import ZapSplitCreator, { Split } from "./zap-split-creator";

type FormValues = {
  content: string;
  nsfw: boolean;
  nsfwReason: string;
  split: Split[];
  difficulty: number;
};

export type ShortTextNoteFormProps = {
  cacheFormKey?: string | null;
  initContent?: string;
};

export default function ShortTextNoteForm({
  cacheFormKey = "new-note",
  initContent = "",
}: Omit<FlexProps, "children"> & ShortTextNoteFormProps) {
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const { noteDifficulty } = useAppSettings();
  const addClientTag = useObservableEagerState(localSettings.addClientTag);
  const promptAddClientTag = useLocalStorageDisclosure("prompt-add-client-tag", true);
  const [miningTarget, setMiningTarget] = useState(0);
  const [published, setPublished] = useState<PublishLogEntry>();
  const emojis = useContextEmojis();
  const advanced = useDisclosure();

  const factory = useEventFactory();
  const [draft, setDraft] = useState<UnsignedEvent>();
  const { getValues, setValue, watch, register, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: {
      content: initContent,
      nsfw: false,
      nsfwReason: "",
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

  const createDraft = async (values = getValues()) => {
    // build draft using factory
    let draft = await factory.note(values.content, {
      emojis: emojis.filter((e) => !!e.url) as Emoji[],
      contentWarning: values.nsfw ? values.nsfwReason || values.nsfw : false,
      splits: values.split,
    });

    const unsigned = await factory.stamp(draft);
    setDraft(unsigned);
    return unsigned;
  };

  const preview = useThrottle(getValues("content"), 500);

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const publishPost = async (unsigned: UnsignedEvent) => {
    // Broadcast quoted events
    const pointers = processTags(unsigned.tags, (t) => (t[0] === "q" ? getEventPointerFromQTag(t) : undefined));
    const events = pointers.map((p) => eventStore.getEvent(p.id)).filter((t) => !!t);
    for (const event of events) publish("Broadcast event", event);

    const pub = await publish("Post", unsigned);
    if (pub) setPublished(pub);
  };

  const submit = handleSubmit(async (values) => {
    if (values.difficulty > 0) setMiningTarget(values.difficulty);
    else publishPost(await createDraft(values));
  });

  const canSubmit = getValues().content.length > 0;

  if (published) {
    return (
      <Flex direction="column" gap="2">
        <PublishLogEntryDetails entry={published} />
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
          onSkip={() => publishPost(draft)}
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
          value={getValues("content")}
          onChange={(e) => setValue("content", e.target.value, { shouldDirty: true, shouldTouch: true })}
          rows={8}
          isRequired
          instanceRef={(inst) => (textAreaRef.current = inst)}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
          }}
        />
        {preview && preview.length > 0 && (
          <Box>
            <Heading size="sm">Preview:</Heading>
            <Box borderWidth={1} borderRadius="md" p="2">
              <ErrorBoundary>
                <ContentSettingsProvider blurMedia={false}>
                  <TextNoteContents event={getValues("content")} />
                </ContentSettingsProvider>
              </ErrorBoundary>
            </Box>
          </Box>
        )}
        <Flex gap="2" alignItems="center" justifyContent="flex-end">
          <Flex mr="auto" gap="2">
            <InsertImageButton onUploaded={insertText} aria-label="Upload image" />
            <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
            <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
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
