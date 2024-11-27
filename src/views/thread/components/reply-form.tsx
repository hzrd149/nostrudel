import { useMemo, useRef } from "react";
import { Box, Button, ButtonGroup, Flex } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useThrottle } from "react-use";
import { kinds } from "nostr-tools";
import { ThreadItem } from "applesauce-core/queries";
import dayjs from "dayjs";

import { NostrEvent } from "../../../types/nostr-event";
import { UserAvatarStack } from "../../../components/compact-user-stack";
import { getThreadMembers } from "../../../helpers/thread";
import {
  addReplyTags,
  createEmojiTags,
  ensureNotifyPubkeys,
  finalizeNote,
  getPubkeysMentionedInContent,
} from "../../../helpers/nostr/post";
import useCurrentAccount from "../../../hooks/use-current-account";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { unique } from "../../../helpers/array";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import useCacheForm from "../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import InsertImageButton from "../../../components/post-modal/insert-image-button";

export type ReplyFormProps = {
  item: ThreadItem;
  replyKind?: number;
  onCancel?: () => void;
  onSubmitted?: (event: NostrEvent) => void;
};

export default function ReplyForm({ item, onCancel, onSubmitted, replyKind = kinds.ShortTextNote }: ReplyFormProps) {
  const publish = usePublishEvent();
  const account = useCurrentAccount();
  const emojis = useContextEmojis();

  const threadMembers = useMemo(() => getThreadMembers(item, account?.pubkey), [item, account?.pubkey]);
  const { setValue, getValues, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });

  const clearCache = useCacheForm<{ content: string }>(`reply-${item.event.id}`, getValues, reset, formState);

  const contentMentions = getPubkeysMentionedInContent(getValues().content);
  const notifyPubkeys = unique([...threadMembers, ...contentMentions]);

  watch("content");

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const draft = useMemo(() => {
    let updated = finalizeNote({ kind: replyKind, content: getValues().content, created_at: dayjs().unix(), tags: [] });
    updated = createEmojiTags(updated, emojis);
    updated = addReplyTags(updated, item.event);
    updated = ensureNotifyPubkeys(updated, notifyPubkeys);
    return updated;
  }, [getValues().content, emojis]);

  const submit = handleSubmit(async (values) => {
    const pub = await publish("Reply", { ...draft, created_at: dayjs().unix() });

    if (pub && onSubmitted) onSubmitted(pub.event);
    clearCache();
  });

  const formRef = useRef<HTMLFormElement | null>(null);
  const previewDraft = useThrottle(draft, 500);

  return (
    <Flex as="form" direction="column" gap="2" pb="4" onSubmit={submit} ref={formRef}>
      <MagicTextArea
        placeholder="Reply"
        autoFocus
        mb="2"
        rows={4}
        isRequired
        value={getValues().content}
        onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
        instanceRef={(inst) => (textAreaRef.current = inst)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && formRef.current) formRef.current.requestSubmit();
        }}
      />
      <Flex gap="2" alignItems="center">
        <InsertImageButton onUploaded={insertText} size="sm" aria-label="Upload image" />
        <InsertGifButton onSelectURL={insertText} aria-label="Add gif" size="sm" />
        <UserAvatarStack label="Notify" pubkeys={notifyPubkeys} />
        <ButtonGroup size="sm" ml="auto">
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
          <Button type="submit" colorScheme="primary" size="sm">
            Submit
          </Button>
        </ButtonGroup>
      </Flex>
      {previewDraft.content.length > 0 && (
        <Box p="2" borderWidth={1} borderRadius="md" mb="2">
          <TrustProvider trust>
            <TextNoteContents event={previewDraft} />
          </TrustProvider>
        </Box>
      )}
    </Flex>
  );
}
