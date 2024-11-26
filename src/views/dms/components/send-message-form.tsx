import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { kinds } from "nostr-tools";

import { Button, Flex, FlexProps, Heading } from "@chakra-ui/react";
import { useSigningContext } from "../../../providers/global/signing-provider";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import { useTextAreaUploadFileWithForm } from "../../../hooks/use-textarea-upload-file";
import { DraftNostrEvent } from "../../../types/nostr-event";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import useCacheForm from "../../../hooks/use-cache-form";
import decryptionCacheService from "../../../services/decryption-cache";

export default function SendMessageForm({
  pubkey,
  rootId,
  ...props
}: { pubkey: string; rootId?: string } & Omit<FlexProps, "children">) {
  const publish = usePublishEvent();
  const { requestEncrypt } = useSigningContext();

  const [loadingMessage, setLoadingMessage] = useState("");
  const { getValues, setValue, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  const clearCache = useCacheForm<{ content: string }>(`dm-${pubkey}`, getValues, reset, formState, {
    clearOnKeyChange: true,
  });

  const autocompleteRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const { onPaste } = useTextAreaUploadFileWithForm(autocompleteRef, getValues, setValue);

  const userMailboxes = useUserMailboxes(pubkey);
  const sendMessage = handleSubmit(async (values) => {
    if (!values.content) return;
    setLoadingMessage("Encrypting...");
    const encrypted = await requestEncrypt(values.content, pubkey);

    const draft: DraftNostrEvent = {
      kind: kinds.EncryptedDirectMessage,
      content: encrypted,
      tags: [["p", pubkey]],
      created_at: dayjs().unix(),
    };

    if (rootId) {
      draft.tags.push(["e", rootId, "", "root"]);
    }

    setLoadingMessage("Signing...");
    const pub = await publish("Send DM", draft, userMailboxes?.inboxes);

    if (pub) {
      clearCache();
      reset({ content: "" });

      // add plaintext to decryption context
      decryptionCacheService
        .getOrCreateContainer(pub.event.id, "nip04", pubkey, encrypted)
        .plaintext.next(values.content);

      // refocus input
      setTimeout(() => textAreaRef.current?.focus(), 50);
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
            onChange={(e) => setValue("content", e.target.value, { shouldDirty: true, shouldTouch: true })}
            rows={2}
            isRequired
            instanceRef={(inst) => (autocompleteRef.current = inst)}
            ref={textAreaRef}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && formRef.current) formRef.current.requestSubmit();
            }}
          />
          <Button type="submit">Send</Button>
        </>
      )}
    </Flex>
  );
}
