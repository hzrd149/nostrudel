import { useMemo } from "react";
import { Box, Button, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { ParsedStream, buildChatMessage } from "../../../../helpers/nostr/stream";
import { useRelaySelectionRelays } from "../../../../providers/relay-selection-provider";
import { useUserRelays } from "../../../../hooks/use-user-relays";
import { RelayMode } from "../../../../classes/relay";
import { unique } from "../../../../helpers/array";
import { useSigningContext } from "../../../../providers/signing-provider";
import NostrPublishAction from "../../../../classes/nostr-publish-action";
import { createEmojiTags, ensureNotifyContentMentions } from "../../../../helpers/nostr/post";
import { useContextEmojis } from "../../../../providers/emoji-provider";
import { MagicInput } from "../../../../components/magic-textarea";
import StreamZapButton from "../../components/stream-zap-button";

export default function ChatMessageForm({ stream }: { stream: ParsedStream }) {
  const toast = useToast();
  const emojis = useContextEmojis();
  const streamRelays = useRelaySelectionRelays();
  const hostReadRelays = useUserRelays(stream.host)
    .filter((r) => r.mode & RelayMode.READ)
    .map((r) => r.url);

  const relays = useMemo(() => unique([...streamRelays, ...hostReadRelays]), [hostReadRelays, streamRelays]);

  const { requestSignature } = useSigningContext();
  const { setValue, handleSubmit, formState, reset, getValues, watch } = useForm({
    defaultValues: { content: "" },
  });
  const sendMessage = handleSubmit(async (values) => {
    try {
      let draft = buildChatMessage(stream, values.content);
      draft = ensureNotifyContentMentions(draft);
      draft = createEmojiTags(draft, emojis);
      const signed = await requestSignature(draft);
      new NostrPublishAction("Send Chat", relays, signed);
      reset();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  watch("content");

  return (
    <>
      <Box as="form" borderRadius="md" flexShrink={0} display="flex" gap="2" px="2" pb="2" onSubmit={sendMessage}>
        <MagicInput
          placeholder="Message"
          autoComplete="off"
          isRequired
          value={getValues().content}
          onChange={(e) => setValue("content", e.target.value)}
        />
        <Button colorScheme="brand" type="submit" isLoading={formState.isSubmitting}>
          Send
        </Button>
        <StreamZapButton stream={stream} onZap={reset} initComment={getValues().content} />
      </Box>
    </>
  );
}
