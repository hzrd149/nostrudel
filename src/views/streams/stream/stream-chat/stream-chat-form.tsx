import { useMemo, useRef } from "react";
import { Box, Button, Flex, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { ParsedStream, buildChatMessage } from "../../../../helpers/nostr/stream";
import { unique } from "../../../../helpers/array";
import { createEmojiTags, ensureNotifyContentMentions } from "../../../../helpers/nostr/post";
import { useContextEmojis } from "../../../../providers/global/emoji-provider";
import { MagicInput, RefType } from "../../../../components/magic-textarea";
import StreamZapButton from "../../components/stream-zap-button";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import { useAdditionalRelayContext } from "../../../../providers/local/additional-relay-context";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import InsertGifButton from "../../../../components/gif/insert-gif-button";

export default function ChatMessageForm({ stream, hideZapButton }: { stream: ParsedStream; hideZapButton?: boolean }) {
  const toast = useToast();
  const publish = usePublishEvent();
  const emojis = useContextEmojis();
  const streamRelays = useReadRelays(useAdditionalRelayContext());
  const hostReadRelays = useUserInbox(stream.host);

  const relays = useMemo(() => unique([...streamRelays, ...(hostReadRelays ?? [])]), [hostReadRelays, streamRelays]);

  const { setValue, handleSubmit, formState, reset, getValues, watch } = useForm({
    defaultValues: { content: "" },
  });
  const sendMessage = handleSubmit(async (values) => {
    let draft = buildChatMessage(stream, values.content);
    draft = ensureNotifyContentMentions(draft);
    draft = createEmojiTags(draft, emojis);
    const pub = await publish("Send Chat", draft, relays);
    if (pub) reset();
  });

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  watch("content");

  return (
    <>
      <Box borderRadius="md" flexShrink={0} display="flex" gap="2" px="2" pb="2">
        <Flex as="form" onSubmit={sendMessage} gap="2" flex={1}>
          <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
          <MagicInput
            instanceRef={(inst) => (textAreaRef.current = inst)}
            placeholder="Message"
            autoComplete="off"
            isRequired
            value={getValues().content}
            onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
            // @ts-expect-error
            onPaste={onPaste}
          />
          <Button colorScheme="primary" type="submit" isLoading={formState.isSubmitting}>
            Send
          </Button>
        </Flex>
        {!hideZapButton && <StreamZapButton stream={stream} onZap={reset} initComment={getValues().content} />}
      </Box>
    </>
  );
}
