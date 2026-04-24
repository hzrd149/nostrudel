import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { EventTemplate, kinds } from "nostr-tools";
import { Button, ButtonGroup, Flex, FlexProps, Heading } from "@chakra-ui/react";
import { Emoji } from "applesauce-common/helpers";

import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import { NostrEvent } from "nostr-tools";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import InsertImageButton from "../../new/note/insert-image-button";
import InsertReactionButton from "../../../components/reactions/insert-reaction-button";

export default function ChannelMessageForm({
  channel,
  root,
  ...props
}: { channel: NostrEvent; root?: NostrEvent } & Omit<FlexProps, "children">) {
  const publish = usePublishEvent();
  const emojis = useContextEmojis();

  const [loadingMessage, setLoadingMessage] = useState("");
  const { getValues, setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  const componentRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertText = useTextAreaInsertTextWithForm(componentRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const sendMessage = handleSubmit(async (values) => {
    if (!values.content) return;

    const customEmojis = emojis.filter((e) => !!e.url) as Emoji[];

    const draft: EventTemplate = {
      kind: kinds.ChannelMessage,
      created_at: Math.floor(Date.now() / 1000),
      content: values.content,
      tags: [
        ["e", channel.id, "", "root"],
        ...(root ? [["e", root.id, "", "reply"]] : []),
        ...customEmojis.map((emoji) => ["emoji", emoji.shortcode, emoji.url]),
      ],
    };

    setLoadingMessage("Signing...");
    await publish("Send DM", draft, undefined, false);
    reset({ content: "" });

    // refocus input
    setTimeout(() => textAreaRef.current?.focus(), 50);
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
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && formRef.current) formRef.current.requestSubmit();
            }}
          />
          <Flex gap="2" direction="column">
            <ButtonGroup size="sm">
              <InsertImageButton onUploaded={insertText} aria-label="Upload image" />
              <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
              <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
            </ButtonGroup>
            <Button type="submit">Send</Button>
          </Flex>
        </>
      )}
    </Flex>
  );
}
