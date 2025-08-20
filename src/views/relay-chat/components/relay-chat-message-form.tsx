import { ButtonGroup, Flex, FlexProps, useToast } from "@chakra-ui/react";
import { addSeenRelay } from "applesauce-core/helpers";
import { setContent } from "applesauce-factory/operations/content";
import { includeSingletonTag } from "applesauce-factory/operations/tags";
import { useActiveAccount, useEventFactory } from "applesauce-react/hooks";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

import InsertGifButton from "../../../components/gif/insert-gif-button";
import { MagicInput, RefType } from "../../../components/magic-textarea";
import InsertReactionButton from "../../../components/reactions/insert-reaction-button";
import { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import { eventStore } from "../../../services/event-store";
import pool from "../../../services/pool";
import { RELAY_CHAT_MESSAGE_KIND } from "../../../services/relay-chats";
import InsertImageButton from "../../new/note/insert-image-button";

export default function RelayChatMessageForm({
  relay,
  channel,
  ...props
}: { relay: string; channel?: string } & Omit<FlexProps, "children">) {
  const toast = useToast();
  const account = useActiveAccount();
  const factory = useEventFactory();

  const [loadingMessage, setLoadingMessage] = useState("");
  const { getValues, setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  const componentRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLInputElement | null>(null);
  const insertText = useTextAreaInsertTextWithForm(componentRef, getValues, setValue);

  const sendMessage = handleSubmit(async (values) => {
    if (!values.content || !factory) return;
    if (!account) throw new Error("No account");

    const draft = await factory.build(
      { kind: RELAY_CHAT_MESSAGE_KIND },
      includeSingletonTag(["d", channel ?? "_"]),
      setContent(values.content),
    );
    const signed = await account?.signEvent(draft);
    addSeenRelay(signed, relay);

    setLoadingMessage("Signing...");
    const result = await pool.relay(relay).publish(signed);

    if (result.ok) eventStore.add(signed);
    toast({ status: result.ok ? "success" : "error", title: result.message || "Message sent", position: "top" });

    reset({ content: "" });

    // refocus input
    setTimeout(() => textAreaRef.current?.focus(), 50);
    setLoadingMessage("");
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <Flex as="form" gap="2" onSubmit={sendMessage} ref={formRef} {...props}>
      <ButtonGroup>
        <InsertImageButton onUploaded={insertText} aria-label="Upload image" />
        <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
        <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
      </ButtonGroup>
      <MagicInput
        mb="2"
        value={getValues().content}
        onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
        isRequired
        instanceRef={(inst) => (componentRef.current = inst)}
        ref={textAreaRef}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && formRef.current) formRef.current.requestSubmit();
        }}
        isDisabled={!!loadingMessage}
        placeholder={loadingMessage ? loadingMessage : "Ephemeral message"}
      />
    </Flex>
  );
}
