import { useCallback, useMemo, useRef, useState } from "react";
import { Box, Button, ButtonGroup, Flex, IconButton, VisuallyHiddenInput, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";

import { NostrEvent } from "../../../types/nostr-event";
import { UserAvatarStack } from "../../../components/compact-user-stack";
import { ThreadItem, getThreadMembers } from "../../../helpers/thread";
import { NoteContents } from "../../../components/note/note-contents";
import {
  addReplyTags,
  createEmojiTags,
  ensureNotifyPubkeys,
  finalizeNote,
  getContentMentions,
} from "../../../helpers/nostr/post";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { useSigningContext } from "../../../providers/signing-provider";
import { useWriteRelayUrls } from "../../../hooks/use-client-relays";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { unique } from "../../../helpers/array";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import { useContextEmojis } from "../../../providers/emoji-provider";
import { TrustProvider } from "../../../providers/trust";
import { nostrBuildUploadImage } from "../../../helpers/nostr-build";
import { UploadImageIcon } from "../../../components/icons";

export type ReplyFormProps = {
  item: ThreadItem;
  onCancel: () => void;
  onSubmitted?: (event: NostrEvent) => void;
};

export default function ReplyForm({ item, onCancel, onSubmitted }: ReplyFormProps) {
  const toast = useToast();
  const account = useCurrentAccount();
  const emojis = useContextEmojis();
  const { requestSignature } = useSigningContext();
  const writeRelays = useWriteRelayUrls();

  const threadMembers = useMemo(() => getThreadMembers(item, account?.pubkey), [item, account?.pubkey]);
  const { setValue, getValues, watch, handleSubmit } = useForm({
    defaultValues: {
      content: "",
    },
  });
  const contentMentions = getContentMentions(getValues().content);
  const notifyPubkeys = unique([...threadMembers, ...contentMentions]);

  watch("content");

  const textAreaRef = useRef<RefType | null>(null);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadImage = useCallback(
    async (imageFile: File) => {
      try {
        if (!imageFile.type.includes("image")) throw new Error("Only images are supported");

        setUploading(true);
        const response = await nostrBuildUploadImage(imageFile, requestSignature);
        const imageUrl = response.url;

        const content = getValues().content;
        const position = textAreaRef.current?.getCaretPosition();
        if (position !== undefined) {
          setValue("content", content.slice(0, position) + imageUrl + content.slice(position), { shouldDirty: true });
        } else setValue("content", content + imageUrl, { shouldDirty: true });
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setUploading(false);
    },
    [setValue, getValues],
  );

  const draft = useMemo(() => {
    let updated = finalizeNote({ kind: Kind.Text, content: getValues().content, created_at: dayjs().unix(), tags: [] });
    updated = createEmojiTags(updated, emojis);
    updated = addReplyTags(updated, item.event);
    updated = ensureNotifyPubkeys(updated, notifyPubkeys);
    return updated;
  }, [getValues().content, emojis]);

  const submit = handleSubmit(async (values) => {
    try {
      const signed = await requestSignature(draft);
      const pub = new NostrPublishAction("Reply", writeRelays, signed);

      if (onSubmitted) onSubmitted(signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  return (
    <Flex as="form" direction="column" gap="2" pb="4" onSubmit={submit}>
      <MagicTextArea
        placeholder="Reply"
        autoFocus
        mb="2"
        rows={4}
        isRequired
        value={getValues().content}
        onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
        instanceRef={(inst) => (textAreaRef.current = inst)}
        onPaste={(e) => {
          const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
          if (imageFile) uploadImage(imageFile);
        }}
      />
      <Flex gap="2" alignItems="center">
        <VisuallyHiddenInput
          type="file"
          accept="image/*"
          ref={imageUploadRef}
          onChange={(e) => {
            const img = e.target.files?.[0];
            if (img) uploadImage(img);
          }}
        />
        <IconButton
          icon={<UploadImageIcon />}
          aria-label="Upload Image"
          title="Upload Image"
          onClick={() => imageUploadRef.current?.click()}
          isLoading={uploading}
          size="sm"
        />
        <UserAvatarStack label="Notify" pubkeys={notifyPubkeys} />
        <ButtonGroup size="sm" ml="auto">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" colorScheme="primary" size="sm">
            Submit
          </Button>
        </ButtonGroup>
      </Flex>
      {getValues().content.length > 0 && (
        <Box p="2" borderWidth={1} borderRadius="md" mb="2">
          <TrustProvider trust>
            <NoteContents event={draft} />
          </TrustProvider>
        </Box>
      )}
    </Flex>
  );
}
