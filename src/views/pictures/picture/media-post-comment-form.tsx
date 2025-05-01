import { useRef } from "react";
import { Flex, FlexProps, IconButton, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { NostrEvent } from "nostr-tools";
import { useEventFactory } from "applesauce-react/hooks";
import { Emoji } from "applesauce-core/helpers/emoji";

import { usePublishEvent } from "../../../providers/global/publish-provider";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import { MagicInput, RefType } from "../../../components/magic-textarea";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import { useWriteRelays } from "../../../hooks/use-client-relays";
import MessageSquare01 from "../../../components/icons/message-square-01";

export default function PicturePostCommentForm({
  post,
  ...props
}: { post: NostrEvent } & Omit<FlexProps, "children" | "as" | "onSubmit">) {
  const toast = useToast();
  const publish = usePublishEvent();
  const emojis = useContextEmojis();
  const factory = useEventFactory();

  const relays = useWriteRelays();
  const { setValue, handleSubmit, formState, reset, getValues, watch } = useForm({
    defaultValues: { content: "" },
  });
  const sendMessage = handleSubmit(async (values) => {
    try {
      if (!factory) throw new Error("Missing factory");

      let draft = await factory.comment(post, values.content, { emojis: emojis.filter((e) => !!e.url) as Emoji[] });
      const pub = await publish("Comment", draft, relays);
      if (pub) reset();
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    }
  });

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  watch("content");

  return (
    <Flex as="form" onSubmit={sendMessage} gap="2" {...props}>
      <MagicInput
        instanceRef={(inst) => (textAreaRef.current = inst)}
        placeholder="Comment"
        autoComplete="off"
        isRequired
        value={getValues().content}
        onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
        // @ts-expect-error
        onPaste={onPaste}
      />
      <IconButton
        colorScheme="primary"
        type="submit"
        isLoading={formState.isSubmitting}
        icon={<MessageSquare01 />}
        aria-label="Comment"
      />
    </Flex>
  );
}
