import { Button, ButtonGroup, Flex, FlexProps, Heading } from "@chakra-ui/react";
import { encodeGroupPointer, GroupPointer } from "applesauce-core/helpers";
import { useEventFactory } from "applesauce-react/hooks";
import { useRef } from "react";
import { useForm } from "react-hook-form";

import { GroupMessageBlueprint } from "applesauce-factory/blueprints";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import InsertReactionButton from "../../../components/reactions/insert-reaction-button";
import useCacheForm from "../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import InsertImageButton from "../../../views/new/note/insert-image-button";

export default function GroupMessageForm({ group, ...props }: { group: GroupPointer } & Omit<FlexProps, "children">) {
  const publish = usePublishEvent();
  const factory = useEventFactory();

  const { getValues, setValue, watch, reset, handleSubmit, formState } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  useCacheForm(
    `${encodeGroupPointer(group)}-send-message`,
    // @ts-expect-error
    getValues,
    reset,
    formState,
  );

  const componentRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertText = useTextAreaInsertTextWithForm(componentRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const sendMessage = handleSubmit(async (values) => {
    if (!values.content || !factory) return;

    // Create a NIP-29 group message (kind 1 with h tag)
    const draft = await factory.create(GroupMessageBlueprint, group, values.content);
    const signed = await factory.sign(draft);
    await publish("Send group message", signed, [group.relay], false, true);

    reset();

    // refocus input
    setTimeout(() => textAreaRef.current?.focus(), 50);
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <Flex as="form" gap="2" onSubmit={sendMessage} ref={formRef} {...props}>
      {formState.isSubmitting ? (
        <Heading size="md" mx="auto" my="4">
          Sending...
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
            placeholder="Type your message..."
          />
          <Flex gap="2" direction="column">
            <ButtonGroup size="sm">
              <InsertImageButton onUploaded={insertText} aria-label="Upload image" />
              <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
              <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
            </ButtonGroup>
            <Button type="submit" isLoading={formState.isSubmitting}>
              Send
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  );
}
