import { Box, Button, ButtonGroup, Flex, FlexProps, Input, useDisclosure, useToast } from "@chakra-ui/react";
import { unixNow } from "applesauce-core/helpers";
import { EventTemplate, kinds } from "nostr-tools";
import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";

import { getPayRequestForPubkey, PayRequest } from "../../../components/event-zap-modal";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import { LightningIcon } from "../../../components/icons";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";
import { SUPPORT_PUBKEY } from "../../../const";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../hooks/use-textarea-upload-file";
import useUserLNURLMetadata from "../../../hooks/use-user-lnurl-metadata";
import { useUserInbox } from "../../../hooks/use-user-mailboxes";
import useUserProfile from "../../../hooks/use-user-profile";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import InsertImageButton from "../../new/note/insert-image-button";

export default function SupportForm({
  onSubmit,
  ...props
}: Omit<FlexProps, "children" | "onSubmit"> & { onSubmit: (request: PayRequest) => void }) {
  const preview = useDisclosure();
  const toast = useToast();
  const { getValues, setValue, register, handleSubmit, watch, formState } = useForm({
    defaultValues: { content: "", amount: 1000 },
    mode: "all",
  });
  watch("content");

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  // load required data
  useUserInbox(SUPPORT_PUBKEY);
  useUserProfile(SUPPORT_PUBKEY);

  const { metadata } = useUserLNURLMetadata(SUPPORT_PUBKEY);
  const min = metadata?.minSendable ? metadata.minSendable / 1000 : 10;
  const max = metadata?.maxSendable ? metadata.maxSendable / 1000 : undefined;

  const submit = handleSubmit(async (values) => {
    try {
      const request = await getPayRequestForPubkey(SUPPORT_PUBKEY, undefined, values.amount * 1000, values.content);
      if (request.error) throw request.error;

      onSubmit(request);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  });

  const previewEvent = useMemo<EventTemplate>(
    () => ({
      content: getValues("content"),
      kind: kinds.ZapRequest,
      tags: [],
      created_at: unixNow(),
    }),
    [getValues("content")],
  );

  return (
    <Flex as="form" direction="column" gap="2" onSubmit={submit} flexShrink={0} {...props}>
      {preview.isOpen ? (
        <ContentSettingsProvider blurMedia={false}>
          <Box py="2" px="4" borderWidth={1} rounded="md">
            <TextNoteContents event={previewEvent} minH="16" />
          </Box>
        </ContentSettingsProvider>
      ) : (
        <MagicTextArea
          value={getValues().content}
          onChange={(e) => setValue("content", e.target.value, { shouldDirty: true, shouldTouch: true })}
          rows={3}
          instanceRef={(inst) => (textAreaRef.current = inst)}
          onPaste={onPaste}
        />
      )}
      <Input
        type="number"
        {...register("amount", { required: true, min, max })}
        isRequired
        min={min}
        max={max}
        flexShrink={0}
      />
      <Flex>
        <ButtonGroup>
          <InsertImageButton onUploaded={insertText} aria-label="Upload image" />
          <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
        </ButtonGroup>
        <ButtonGroup ml="auto">
          <Button variant="link" px="2" onClick={preview.onToggle}>
            Preview
          </Button>
          <Button colorScheme="primary" leftIcon={<LightningIcon />} type="submit" isLoading={formState.isSubmitting}>
            Zap
          </Button>
        </ButtonGroup>
      </Flex>
    </Flex>
  );
}
