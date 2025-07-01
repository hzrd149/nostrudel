import { Button, ButtonGroup, Flex, FlexProps, Heading } from "@chakra-ui/react";
import { SendLegacyMessage } from "applesauce-actions/actions";
import { useActionHub } from "applesauce-react/hooks";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

import InsertGifButton from "../../../../components/gif/insert-gif-button";
import MagicTextArea, { RefType } from "../../../../components/magic-textarea";
import InsertReactionButton from "../../../../components/reactions/insert-reaction-button";
import useCacheForm from "../../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import useUserMailboxes from "../../../../hooks/use-user-mailboxes";
import { usePublishEvent } from "../../../../providers/global/publish-provider";

export default function SendMessageForm({
  pubkey,
  rootId,
  ...props
}: { pubkey: string; rootId?: string } & Omit<FlexProps, "children">) {
  const publish = usePublishEvent();
  const actions = useActionHub();

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
  const insertText = useTextAreaInsertTextWithForm(autocompleteRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const userMailboxes = useUserMailboxes(pubkey);
  const sendMessage = handleSubmit(async (values) => {
    if (!values.content) return;
    setLoadingMessage("Sending...");

    try {
      // Send direct message to users inbox
      await actions
        .exec(SendLegacyMessage, pubkey, values.content)
        .forEach((e) => publish("Send message", e, userMailboxes?.inboxes));

      // Reset form
      clearCache();
      reset({ content: "" });

      // refocus input
      setTimeout(() => textAreaRef.current?.focus(), 50);
    } catch (error) {}

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
          <Flex gap="2" direction="column">
            <ButtonGroup size="sm">
              <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
              <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
            </ButtonGroup>
            <Button type="submit" colorScheme="primary">
              Send
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  );
}
