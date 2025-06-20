import { useRef } from "react";
import { NostrEvent } from "nostr-tools";
import { useEventFactory } from "applesauce-react/hooks";
import { getEventUID } from "applesauce-core/helpers";
import { useForm } from "react-hook-form";
import { useAsync, useThrottle } from "react-use";

import { usePublishEvent } from "../../providers/global/publish-provider";
import { useContextEmojis } from "../../providers/global/emoji-provider";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../hooks/use-textarea-upload-file";
import MagicTextArea, { RefType } from "../magic-textarea";
import useCacheForm from "../../hooks/use-cache-form";
import { Box, Button, ButtonGroup, Flex } from "@chakra-ui/react";
import InsertImageButton from "../../views/new/note/insert-image-button";
import InsertGifButton from "../gif/insert-gif-button";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import TextNoteContents from "../note/timeline-note/text-note-contents";
import InsertReactionButton from "../reactions/insert-reaction-button";

export default function GenericCommentForm({
  event,
  onSubmitted,
  onCancel,
}: {
  event: NostrEvent;
  onSubmitted?: (comment: NostrEvent) => void;
  onCancel?: () => void;
}) {
  const publish = usePublishEvent();
  const factory = useEventFactory();
  const emojis = useContextEmojis();

  const { setValue, getValues, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });

  const clearCache = useCacheForm<{ content: string }>(`comment-${getEventUID(event)}`, getValues, reset, formState);

  watch("content");

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const submit = handleSubmit(async (values) => {
    const draft = await factory.comment(event, values.content, { emojis });

    const pub = await publish("Comment", draft);

    if (pub && onSubmitted) onSubmitted(pub.event);
    clearCache();
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  // throttle preview
  const throttleValues = useThrottle(getValues(), 500);
  const { value: preview } = useAsync(
    () => factory.comment(event, throttleValues.content, { emojis }),
    [throttleValues, emojis],
  );

  return (
    <Flex as="form" direction="column" gap="2" pb="4" onSubmit={submit} ref={formRef}>
      <MagicTextArea
        placeholder="Comment"
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
          <InsertReactionButton onSelect={insertText} aria-label="Add Emoji" />
        </ButtonGroup>
        <ButtonGroup size="sm" ml="auto">
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
          <Button type="submit" colorScheme="primary" size="sm">
            Comment
          </Button>
        </ButtonGroup>
      </Flex>
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
