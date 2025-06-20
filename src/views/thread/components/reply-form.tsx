import { Box, Button, ButtonGroup, Flex, Input, Switch, useDisclosure } from "@chakra-ui/react";
import { Emoji } from "applesauce-core/helpers";
import { ThreadItem } from "applesauce-core/models";
import { useEventFactory } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useAsync, useThrottle } from "react-use";

import InsertGifButton from "../../../components/gif/insert-gif-button";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import InsertReactionButton from "../../../components/reactions/insert-reaction-button";
import useCacheForm from "../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import InsertImageButton from "../../new/note/insert-image-button";

export type ReplyFormProps = {
  item: ThreadItem;
  replyKind?: number;
  onCancel?: () => void;
  onSubmitted?: (event: NostrEvent) => void;
};

export default function ReplyForm({ item, onCancel, onSubmitted, replyKind = kinds.ShortTextNote }: ReplyFormProps) {
  const publish = usePublishEvent();
  const factory = useEventFactory();
  const emojis = useContextEmojis();
  const advanced = useDisclosure();
  const customEmojis = useMemo(() => emojis.filter((e) => !!e.url) as Emoji[], [emojis]);

  const { setValue, getValues, watch, handleSubmit, formState, reset, register } = useForm({
    defaultValues: {
      content: "",
      nsfw: false,
      nsfwReason: "",
    },
    mode: "all",
  });

  const clearCache = useCacheForm<{ content: string; nsfw: boolean; nsfwReason: string }>(
    `reply-${item.event.id}`,
    getValues,
    reset,
    formState,
  );

  watch("content");

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const submit = handleSubmit(async (values) => {
    const draft = await factory.noteReply(item.event, values.content, {
      emojis: customEmojis,
      contentWarning: values.nsfw ? values.nsfwReason || values.nsfw : false,
    });

    const pub = await publish("Reply", draft);

    if (pub && onSubmitted) onSubmitted(pub.event);
    clearCache();
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  // throttle preview
  const throttleValues = useThrottle(getValues(), 500);
  const { value: preview } = useAsync(
    () => factory.noteReply(item.event, throttleValues.content, { emojis: customEmojis }),
    [throttleValues, customEmojis],
  );

  const showAdvanced = advanced.isOpen || formState.dirtyFields.nsfw;

  return (
    <Flex as="form" direction="column" gap="2" pb="4" onSubmit={submit} ref={formRef}>
      <MagicTextArea
        placeholder="Reply"
        autoFocus
        mb="2"
        rows={4}
        isRequired
        value={getValues().content}
        onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
        instanceRef={(inst) => (textAreaRef.current = inst)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && formRef.current) formRef.current.requestSubmit();
        }}
      />
      <Flex gap="2" alignItems="center">
        <ButtonGroup size="sm">
          <InsertImageButton onUploaded={insertText} aria-label="Upload image" />
          <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
          <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
          <Button
            variant="link"
            rightIcon={advanced.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={advanced.onToggle}
          >
            More
          </Button>
        </ButtonGroup>
        <ButtonGroup size="sm" ml="auto">
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
          <Button type="submit" colorScheme="primary" size="sm">
            Submit
          </Button>
        </ButtonGroup>
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
          </Flex>
        </Flex>
      )}
      {preview && preview.content.length > 0 && (
        <Box p="2" borderWidth={1} borderRadius="md" mb="2">
          <ContentSettingsProvider blurMedia={false}>
            <TextNoteContents event={preview} />
          </ContentSettingsProvider>
        </Box>
      )}
    </Flex>
  );
}
