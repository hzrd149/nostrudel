import {
  Button,
  ButtonGroup,
  Flex,
  FlexProps,
  IconButton,
  IconButtonProps,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { unixNow } from "applesauce-core/helpers";
import { getConversationParticipants } from "applesauce-common/helpers";
import { use$ } from "applesauce-react/hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import InsertGifButton from "../../../../components/gif/insert-gif-button";
import Lock01 from "../../../../components/icons/lock-01";
import MagicTextArea, { RefType } from "../../../../components/magic-textarea";
import InsertReactionButton from "../../../../components/reactions/insert-reaction-button";
import useMessageDraft from "../../../../hooks/use-message-draft";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import useMessagePublication from "../../../../hooks/use-message-publication";
import localSettings from "../../../../services/preferences";
import ExpirationToggleButton from "../../components/expiration-toggle-button";
import MessagePublicationStatus from "../../components/message-publication-status";

function GroupMessageTypeButton({ ...props }: Omit<IconButtonProps, "children" | "aria-label" | "colorScheme">) {
  const modal = useDisclosure();

  return (
    <>
      <IconButton
        icon={<Lock01 boxSize={6} />}
        onClick={modal.onOpen}
        aria-label="Message type"
        variant="ghost"
        colorScheme="green"
        {...props}
      />
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p="4">Private messages</ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" pb="2" pt="0">
            <Text>
              Group messages only use{" "}
              <Link href="https://github.com/nostr-protocol/nips/blob/master/17.md" isExternal color="blue.500">
                NIP-17
              </Link>{" "}
              private direct messages. which are encrypted and hide the sender and receiver from third parties.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function GroupMessageForm({
  group,
  initialExpiration,
  ...props
}: { group: string; initialExpiration?: number } & Omit<FlexProps, "children">) {
  const pubkeys = useMemo(() => getConversationParticipants(group), [group]);
  const defaultMessageExpiration = use$(localSettings.defaultMessageExpiration);
  const [expiration, setExpiration] = useState<number | null>(initialExpiration ?? defaultMessageExpiration);

  // Reset the expiration when initial values change
  useEffect(() => {
    setExpiration(initialExpiration ?? defaultMessageExpiration);
  }, [initialExpiration]);

  const { getValues, setValue, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  const content = watch("content");
  const draft = useMessageDraft("nip17", pubkeys, content, formState.isDirty, reset);

  const autocompleteRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertText = useTextAreaInsertTextWithForm(autocompleteRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const publication = useMessagePublication("nip17", pubkeys);
  const sendMessage = handleSubmit(async (values) => {
    if (!values.content && !publication.pending) return;
    const expirationTimestamp = expiration ? unixNow() + expiration : undefined;
    const sent = await publication.send({
      content: values.content,
      expiration: expirationTimestamp,
      envelopeExpiration: expirationTimestamp,
    });
    if (!sent) return;
    await draft.clear();
    reset({ content: "" });
    setTimeout(() => textAreaRef.current?.focus(), 50);
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <Flex as="form" onSubmit={sendMessage} ref={formRef} gap="2" direction="column" {...props}>
      {publication.pending && (
        <Flex w="full">
          <MessagePublicationStatus pending={publication.pending} />
        </Flex>
      )}
      {publication.busy ? (
        <Text mx="auto" my="4">
          Sending message…
        </Text>
      ) : (
        <Flex gap="2" w="full">
          <Flex direction="column" gap="2">
            <ExpirationToggleButton value={expiration} onChange={setExpiration} variant="ghost" />
            <GroupMessageTypeButton />
          </Flex>
          <MagicTextArea
            value={getValues().content}
            onChange={(e) => setValue("content", e.target.value, { shouldDirty: true, shouldTouch: true })}
            rows={2}
            isRequired={!publication.pending}
            isReadOnly={!!publication.pending}
            isDisabled={!draft.ready}
            instanceRef={(inst) => (autocompleteRef.current = inst)}
            ref={textAreaRef}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && formRef.current) formRef.current.requestSubmit();
            }}
          />
          <Flex direction="column" gap="2">
            <ButtonGroup variant="ghost" isDisabled={!!publication.pending}>
              <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
              <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
            </ButtonGroup>
            <Button type="submit" colorScheme="primary" isDisabled={!publication.ready || !draft.ready}>
              {publication.pending ? "Retry send" : "Send"}
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
