import { useCallback, useMemo, useRef } from "react";
import { Box, Button, Flex, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { ParsedStream, buildChatMessage } from "../../../../helpers/nostr/stream";
import { useRelaySelectionRelays } from "../../../../providers/local/relay-selection-provider";
import { useUserRelays } from "../../../../hooks/use-user-relays";
import { RelayMode } from "../../../../classes/relay";
import { unique } from "../../../../helpers/array";
import { useSigningContext } from "../../../../providers/global/signing-provider";
import NostrPublishAction from "../../../../classes/nostr-publish-action";
import { createEmojiTags, ensureNotifyContentMentions } from "../../../../helpers/nostr/post";
import { useContextEmojis } from "../../../../providers/global/emoji-provider";
import { MagicInput, RefType } from "../../../../components/magic-textarea";
import StreamZapButton from "../../components/stream-zap-button";
import { nostrBuildUploadImage } from "../../../../helpers/nostr-build";

export default function ChatMessageForm({ stream, hideZapButton }: { stream: ParsedStream; hideZapButton?: boolean }) {
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

  const textAreaRef = useRef<RefType | null>(null);
  const uploadImage = useCallback(
    async (imageFile: File) => {
      try {
        if (!imageFile.type.includes("image")) throw new Error("Only images are supported");

        const response = await nostrBuildUploadImage(imageFile, requestSignature);
        const imageUrl = response.url;

        const content = getValues().content;
        const position = textAreaRef.current?.getCaretPosition();
        if (position !== undefined) {
          setValue("content", content.slice(0, position) + imageUrl + content.slice(position), { shouldDirty: true });
        } else setValue("content", content + imageUrl, { shouldDirty: true });
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
    },
    [setValue, getValues],
  );

  watch("content");

  return (
    <>
      <Box borderRadius="md" flexShrink={0} display="flex" gap="2" px="2" pb="2">
        <Flex as="form" onSubmit={sendMessage} gap="2" flex={1}>
          <MagicInput
            instanceRef={(inst) => (textAreaRef.current = inst)}
            placeholder="Message"
            autoComplete="off"
            isRequired
            value={getValues().content}
            onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
            onPaste={(e) => {
              const file = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
              if (file) uploadImage(file);
            }}
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
