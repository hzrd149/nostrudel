import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { kinds } from "nostr-tools";

import { Button, Flex, FlexProps, Heading, useToast } from "@chakra-ui/react";
import { useSigningContext } from "../../../providers/global/signing-provider";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import { useTextAreaUploadFileWithForm } from "../../../hooks/use-textarea-upload-file";
import clientRelaysService from "../../../services/client-relays";
import { DraftNostrEvent } from "../../../types/nostr-event";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { useDecryptionContext } from "../../../providers/global/dycryption-provider";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import useCurrentAccount from "../../../hooks/use-current-account";
import userMailboxesService from "../../../services/user-mailboxes";
import accountService from "../../../services/account";
import RelaySet from "../../../classes/relay-set";

export default function SendMessageForm({
  pubkey,
  rootId,
  ...props
}: { pubkey: string; rootId?: string } & Omit<FlexProps, "children">) {
  const toast = useToast();
  const { requestEncrypt, requestSignature } = useSigningContext();
  const { getOrCreateContainer } = useDecryptionContext();

  const [loadingMessage, setLoadingMessage] = useState("");
  const { getValues, setValue, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  const autocompleteRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const { onPaste } = useTextAreaUploadFileWithForm(autocompleteRef, getValues, setValue);

  const userMailboxes = useUserMailboxes(pubkey);
  const sendMessage = handleSubmit(async (values) => {
    try {
      if (!values.content) return;
      setLoadingMessage("Encrypting...");
      const encrypted = await requestEncrypt(values.content, pubkey);

      const event: DraftNostrEvent = {
        kind: kinds.EncryptedDirectMessage,
        content: encrypted,
        tags: [["p", pubkey]],
        created_at: dayjs().unix(),
      };

      if (rootId) {
        event.tags.push(["e", rootId, "", "root"]);
      }

      setLoadingMessage("Signing...");
      const signed = await requestSignature(event);
      const relays = RelaySet.from(clientRelaysService.outbox);
      if (userMailboxes?.inbox) relays.merge(userMailboxes.inbox);
      new NostrPublishAction("Send DM", relays, signed);
      reset();

      // add plaintext to decryption context
      getOrCreateContainer(pubkey, encrypted).plaintext.next(values.content);

      // refocus input
      setTimeout(() => textAreaRef.current?.focus(), 50);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
    setLoadingMessage("");
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <Flex as="form" gap="2" onSubmit={sendMessage} ref={formRef} {...props}>
      {loadingMessage ? (
        <Heading size="md" mx="auto" my="4">
          {loadingMessage}
        </Heading>
      ) : (
        <>
          <MagicTextArea
            mb="2"
            value={getValues().content}
            onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
            rows={2}
            isRequired
            instanceRef={(inst) => (autocompleteRef.current = inst)}
            ref={textAreaRef}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter" && formRef.current) formRef.current.requestSubmit();
            }}
          />
          <Button type="submit">Send</Button>
        </>
      )}
    </Flex>
  );
}
