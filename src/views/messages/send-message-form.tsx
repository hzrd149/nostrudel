import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { Kind } from "nostr-tools";

import { Button, Flex, FlexProps, Heading, useToast } from "@chakra-ui/react";
import { useSigningContext } from "../../providers/signing-provider";
import MagicTextArea, { RefType } from "../../components/magic-textarea";
import { useTextAreaUploadFileWithForm } from "../../hooks/use-textarea-upload-file";
import clientRelaysService from "../../services/client-relays";
import { unique } from "../../helpers/array";
import { DraftNostrEvent } from "../../types/nostr-event";
import NostrPublishAction from "../../classes/nostr-publish-action";
import { useUserRelays } from "../../hooks/use-user-relays";
import { RelayMode } from "../../classes/relay";
import { useDecryptionContext } from "../../providers/dycryption-provider";

export default function SendMessageForm({ pubkey, ...props }: { pubkey: string } & Omit<FlexProps, "children">) {
  const toast = useToast();
  const { requestEncrypt, requestSignature } = useSigningContext();
  const { getOrCreateContainer } = useDecryptionContext();

  const [loadingMessage, setLoadingMessage] = useState("");
  const { getValues, setValue, watch, register, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  const textAreaRef = useRef<RefType | null>(null);
  const { onPaste } = useTextAreaUploadFileWithForm(textAreaRef, getValues, setValue);

  const usersInbox = useUserRelays(pubkey)
    .filter((r) => r.mode & RelayMode.READ)
    .map((r) => r.url);
  const sendMessage = handleSubmit(async (values) => {
    try {
      if (!values.content) return;
      setLoadingMessage("Encrypting...");
      const encrypted = await requestEncrypt(values.content, pubkey);

      const event: DraftNostrEvent = {
        kind: Kind.EncryptedDirectMessage,
        content: encrypted,
        tags: [["p", pubkey]],
        created_at: dayjs().unix(),
      };

      setLoadingMessage("Signing...");
      const signed = await requestSignature(event);
      const writeRelays = clientRelaysService.getWriteUrls();
      const relays = unique([...writeRelays, ...usersInbox]);
      new NostrPublishAction("Send DM", relays, signed);
      reset();

      // add plaintext to decryption context
      getOrCreateContainer(pubkey, encrypted).plaintext.next(values.content);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
    setLoadingMessage("");
  });

  return (
    <Flex as="form" gap="2" {...props}>
      {loadingMessage ? (
        <Heading size="md" mx="auto" my="4">
          {loadingMessage}
        </Heading>
      ) : (
        <>
          <MagicTextArea
            autoFocus
            mb="2"
            value={getValues().content}
            onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
            rows={2}
            isRequired
            instanceRef={(inst) => (textAreaRef.current = inst)}
            onPaste={onPaste}
          />
          <Button onClick={sendMessage}>Send</Button>
        </>
      )}
    </Flex>
  );
}
