import { Button, ButtonGroup, Flex, FlexProps, Heading } from "@chakra-ui/react";
import { SendWrappedMessage } from "applesauce-actions/actions";
import { getConversationParticipants, getDisplayName, getTagValue } from "applesauce-core/helpers";
import { useActionHub, useEventModel } from "applesauce-react/hooks";
import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";

import InsertGifButton from "../../../../components/gif/insert-gif-button";
import MagicTextArea, { RefType } from "../../../../components/magic-textarea";
import InsertReactionButton from "../../../../components/reactions/insert-reaction-button";
import useCacheForm from "../../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import { GroupMessageInboxes } from "../../../../models/messages";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import { eventStore } from "../../../../services/event-store";
import { kinds } from "nostr-tools";

export default function GroupMessageForm({ group, ...props }: { group: string } & Omit<FlexProps, "children">) {
  const publish = usePublishEvent();
  const actions = useActionHub();
  const pubkeys = useMemo(() => getConversationParticipants(group), [group]);

  const { getValues, setValue, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  const clearCache = useCacheForm<{ content: string }>(`${group}-message`, getValues, reset, formState, {
    clearOnKeyChange: true,
  });

  const autocompleteRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertText = useTextAreaInsertTextWithForm(autocompleteRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const inboxes = useEventModel(GroupMessageInboxes, [group]);
  const sendMessage = handleSubmit(async (values) => {
    if (!values.content) return;

    try {
      // Send direct message to users inbox
      await actions.exec(SendWrappedMessage, pubkeys, values.content).forEach((e) => {
        const pubkey = getTagValue(e, "p");
        if (!pubkey) return;
        const relays = inboxes?.[pubkey];
        const profile = eventStore.getReplaceable(kinds.Metadata, pubkey);

        const label = `Send message to ${getDisplayName(profile)}`;
        if (!relays) return publish(label, e, [], false);
        else return publish(label, e, relays, false, true);
      });

      // Reset form
      clearCache();
      reset({ content: "" });

      // refocus input
      setTimeout(() => textAreaRef.current?.focus(), 50);
    } catch (error) {}
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
