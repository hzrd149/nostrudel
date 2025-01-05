import { useMemo, useRef } from "react";
import { Box, Button, ButtonGroup, Flex } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useAsync, useThrottle } from "react-use";
import { kinds } from "nostr-tools";
import { ThreadItem } from "applesauce-core/queries";
import { useEventFactory } from "applesauce-react/hooks";
import { Emoji } from "applesauce-core/helpers";

import { NostrEvent } from "../../../types/nostr-event";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import useCacheForm from "../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import InsertGifButton from "../../../components/gif/insert-gif-button";
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
  const customEmojis = useMemo(() => emojis.filter((e) => !!e.url) as Emoji[], [emojis]);

  const { setValue, getValues, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });

  const clearCache = useCacheForm<{ content: string }>(`reply-${item.event.id}`, getValues, reset, formState);

  watch("content");

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const submit = handleSubmit(async (values) => {
    const draft = await factory.noteReply(item.event, values.content, {
      emojis: customEmojis,
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
        <InsertImageButton onUploaded={insertText} size="sm" aria-label="Upload image" />
        <InsertGifButton onSelectURL={insertText} aria-label="Add gif" size="sm" />
        <ButtonGroup size="sm" ml="auto">
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
          <Button type="submit" colorScheme="primary" size="sm">
            Submit
          </Button>
        </ButtonGroup>
      </Flex>
      {preview && preview.content.length > 0 && (
        <Box p="2" borderWidth={1} borderRadius="md" mb="2">
          <TrustProvider trust>
            <TextNoteContents event={preview} />
          </TrustProvider>
        </Box>
      )}
    </Flex>
  );
}
