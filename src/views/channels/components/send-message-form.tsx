import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { Kind } from "nostr-tools";

import { Button, Flex, FlexProps, Heading, useToast } from "@chakra-ui/react";
import { useSigningContext } from "../../../providers/global/signing-provider";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import { useTextAreaUploadFileWithForm } from "../../../hooks/use-textarea-upload-file";
import clientRelaysService from "../../../services/client-relays";
import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { createEmojiTags, ensureNotifyPubkeys, getPubkeysMentionedInContent } from "../../../helpers/nostr/post";
import { useContextEmojis } from "../../../providers/global/emoji-provider";

export default function ChannelMessageForm({
  channel,
  rootId,
  ...props
}: { channel: NostrEvent; rootId?: string } & Omit<FlexProps, "children">) {
  const toast = useToast();
  const emojis = useContextEmojis();
  const { requestSignature } = useSigningContext();

  const [loadingMessage, setLoadingMessage] = useState("");
  const { getValues, setValue, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  const componentRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const { onPaste } = useTextAreaUploadFileWithForm(componentRef, getValues, setValue);

  const sendMessage = handleSubmit(async (values) => {
    try {
      if (!values.content) return;

      let draft: DraftNostrEvent = {
        kind: Kind.ChannelMessage,
        content: values.content,
        tags: [["e", channel.id]],
        created_at: dayjs().unix(),
      };

      const contentMentions = getPubkeysMentionedInContent(draft.content);
      draft = createEmojiTags(draft, emojis);
      draft = ensureNotifyPubkeys(draft, contentMentions);

      if (rootId) {
        draft.tags.push(["e", rootId, "", "root"]);
      }

      setLoadingMessage("Signing...");
      const signed = await requestSignature(draft);
      const writeRelays = clientRelaysService.getWriteUrls();
      new NostrPublishAction("Send DM", writeRelays, signed);
      reset();

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
            instanceRef={(inst) => (componentRef.current = inst)}
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
