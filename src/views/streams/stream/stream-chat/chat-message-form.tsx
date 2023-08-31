import { useMemo } from "react";
import { Box, Button, IconButton, useDisclosure, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { ParsedStream, buildChatMessage } from "../../../../helpers/nostr/stream";
import { useRelaySelectionRelays } from "../../../../providers/relay-selection-provider";
import { useUserRelays } from "../../../../hooks/use-user-relays";
import { RelayMode } from "../../../../classes/relay";
import { unique } from "../../../../helpers/array";
import { LightningIcon } from "../../../../components/icons";
import useUserLNURLMetadata from "../../../../hooks/use-user-lnurl-metadata";
import ZapModal from "../../../../components/zap-modal";
import { useInvoiceModalContext } from "../../../../providers/invoice-modal";
import { useSigningContext } from "../../../../providers/signing-provider";
import NostrPublishAction from "../../../../classes/nostr-publish-action";
import { createEmojiTags, ensureNotifyContentMentions } from "../../../../helpers/nostr/post";
import { useContextEmojis } from "../../../../providers/emoji-provider";
import MagicTextArea from "../../../../components/magic-textarea";

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

  const { requestPay } = useInvoiceModalContext();
  const zapModal = useDisclosure();
  const zapMetadata = useUserLNURLMetadata(stream.host);

  watch("content");

  return (
    <>
      <Box as="form" borderRadius="md" flexShrink={0} display="flex" gap="2" px="2" pb="2" onSubmit={sendMessage}>
        <MagicTextArea
          placeholder="Message"
          autoComplete="off"
          isRequired
          value={getValues().content}
          onChange={(e) => setValue("content", e.target.value)}
          rows={1}
        />
        <Button colorScheme="brand" type="submit" isLoading={formState.isSubmitting}>
          Send
        </Button>
        {zapMetadata.metadata?.allowsNostr && (
          <IconButton
            icon={<LightningIcon color="yellow.400" />}
            aria-label="Zap stream"
            borderColor="yellow.400"
            variant="outline"
            onClick={zapModal.onOpen}
          />
        )}
      </Box>

      {zapModal.isOpen && (
        <ZapModal
          isOpen
          stream={stream}
          pubkey={stream.host}
          onInvoice={async (invoice) => {
            reset();
            zapModal.onClose();
            await requestPay(invoice);
          }}
          onClose={zapModal.onClose}
          initialComment={getValues().content}
          additionalRelays={relays}
        />
      )}
    </>
  );
}
