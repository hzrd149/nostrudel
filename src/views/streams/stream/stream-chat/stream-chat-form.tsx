import { Box, Button, Flex, useToast } from "@chakra-ui/react";
import { Emoji } from "applesauce-core/helpers";
import { LiveChatMessageBlueprint } from "applesauce-factory/blueprints";
import { useEventFactory } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";

import InsertGifButton from "../../../../components/gif/insert-gif-button";
import { MagicInput, RefType } from "../../../../components/magic-textarea";
import { unique } from "../../../../helpers/array";
import { getStreamHost } from "../../../../helpers/nostr/stream";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { useContextEmojis } from "../../../../providers/global/emoji-provider";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import StreamZapButton from "../../components/stream-zap-button";

export default function ChatMessageForm({ stream, hideZapButton }: { stream: NostrEvent; hideZapButton?: boolean }) {
  const toast = useToast();
  const publish = usePublishEvent();
  const factory = useEventFactory();
  const emojis = useContextEmojis();
  const streamRelays = useReadRelays();
  const host = getStreamHost(stream);
  const hostReadRelays = useUserInbox(host);

  const writeRelays = useMemo(
    () => unique([...streamRelays, ...(hostReadRelays ?? [])]),
    [hostReadRelays, streamRelays],
  );

  const { setValue, handleSubmit, formState, reset, getValues, watch } = useForm({
    defaultValues: { content: "" },
  });
  const sendMessage = handleSubmit(async (values) => {
    try {
      const draft = await factory.create(LiveChatMessageBlueprint, stream, values.content, {
        emojis: emojis.filter((e) => !!e.url) as Emoji[],
      });

      const pub = await publish("Send Chat", draft, writeRelays);
      if (pub) reset();
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    }
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
