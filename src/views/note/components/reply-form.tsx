import { useMemo } from "react";
import { Box, Button, ButtonGroup, Flex, Textarea, useDisclosure, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";

import { NostrEvent } from "../../../types/nostr-event";
import { UserAvatarStack } from "../../../components/user-avatar-stack";
import { ThreadItem, getThreadMembers } from "../../../helpers/thread";
import { NoteContents } from "../../../components/note/note-contents";
import { addReplyTags, ensureNotifyPubkeys, finalizeNote, getContentMentions } from "../../../helpers/nostr/post";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { useSigningContext } from "../../../providers/signing-provider";
import { useWriteRelayUrls } from "../../../hooks/use-client-relays";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { unique } from "../../../helpers/array";

function NoteContentPreview({ content }: { content: string }) {
  const draft = useMemo(
    () => finalizeNote({ kind: Kind.Text, content, created_at: dayjs().unix(), tags: [] }),
    [content],
  );

  return <NoteContents event={draft} />;
}

export type ReplyFormProps = {
  item: ThreadItem;
  onCancel: () => void;
  onSubmitted?: (event: NostrEvent) => void;
};

export default function ReplyForm({ item, onCancel, onSubmitted }: ReplyFormProps) {
  const toast = useToast();
  const account = useCurrentAccount();
  const showPreview = useDisclosure();
  const { requestSignature } = useSigningContext();
  const writeRelays = useWriteRelayUrls();

  const threadMembers = useMemo(() => getThreadMembers(item, account?.pubkey), [item, account?.pubkey]);
  const { register, getValues, watch, handleSubmit } = useForm({
    defaultValues: {
      content: "",
    },
  });
  const contentMentions = getContentMentions(getValues().content);
  const notifyPubkeys = unique([...threadMembers, ...contentMentions]);

  watch("content");

  const submit = handleSubmit(async (values) => {
    try {
      let draft = finalizeNote({ kind: Kind.Text, content: values.content, created_at: dayjs().unix(), tags: [] });
      draft = addReplyTags(draft, item.event);
      draft = ensureNotifyPubkeys(draft, notifyPubkeys);

      const signed = await requestSignature(draft);
      if (!signed) return;
      // TODO: write to other users inbox relays
      const pub = new NostrPublishAction("Reply", writeRelays, signed);

      if (onSubmitted) onSubmitted(signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  return (
    <form onSubmit={submit}>
      {showPreview.isOpen ? (
        <Box p="2" borderWidth={1} borderRadius="md" mb="2">
          <NoteContentPreview content={getValues().content} />
        </Box>
      ) : (
        <Textarea placeholder="Reply" {...register("content")} autoFocus mb="2" rows={5} required />
      )}
      <Flex gap="2" alignItems="center">
        <ButtonGroup size="sm">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit">Submit</Button>
        </ButtonGroup>
        <UserAvatarStack label="Notify" users={notifyPubkeys} />
        {getValues().content.length > 0 && (
          <Button size="sm" ml="auto" onClick={showPreview.onToggle}>
            Preview
          </Button>
        )}
      </Flex>
    </form>
  );
}
