import {
  Button,
  ButtonGroup,
  Flex,
  FlexProps,
  Heading,
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
import { SendWrappedMessage } from "applesauce-actions/actions";
import { getConversationParticipants, getDisplayName, getTagValue, unixNow } from "applesauce-core/helpers";
import { useActionHub, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import InsertGifButton from "../../../../components/gif/insert-gif-button";
import Lock01 from "../../../../components/icons/lock-01";
import MagicTextArea, { RefType } from "../../../../components/magic-textarea";
import InsertReactionButton from "../../../../components/reactions/insert-reaction-button";
import useCacheForm from "../../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import { GroupMessageInboxes } from "../../../../models/messages";
import { PublishLogEntry, usePublishEvent } from "../../../../providers/global/publish-provider";
import { eventStore } from "../../../../services/event-store";
import localSettings from "../../../../services/preferences";
import ExpirationToggleButton from "../../components/expiration-toggle-button";
import { lastValueFrom, toArray } from "rxjs";
import SendingStatus from "../../components/sending-status";

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
  const publish = usePublishEvent();
  const actions = useActionHub();
  const pubkeys = useMemo(() => getConversationParticipants(group), [group]);
  const defaultMessageExpiration = useObservableEagerState(localSettings.defaultMessageExpiration);
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
  watch("content");

  const clearCache = useCacheForm<{ content: string }>(`${group}-message`, getValues, reset, formState, {
    clearOnKeyChange: true,
  });

  const autocompleteRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertText = useTextAreaInsertTextWithForm(autocompleteRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const [sending, setSending] = useState<PublishLogEntry[] | null>(null);
  const inboxes = useEventModel(GroupMessageInboxes, [group, false]);
  const sendMessage = handleSubmit(async (values) => {
    if (!values.content) return;

    const expirationTimestamp = expiration ? unixNow() + expiration : undefined;

    // Create all wrapped message events
    const events = await lastValueFrom(
      actions.exec(SendWrappedMessage, pubkeys, values.content, { expiration: expirationTimestamp }).pipe(toArray()),
    );

    // Publish all wrapped message events
    const publishes: PublishLogEntry[] = [];
    for (let e of events) {
      const pubkey = getTagValue(e, "p");
      if (!pubkey) return;
      const relays = inboxes?.[pubkey];
      const profile = eventStore.getReplaceable(kinds.Metadata, pubkey);

      const label = `Send message to ${getDisplayName(profile)}`;
      if (!relays) publishes.push(await publish(label, e, [], false));
      else publishes.push(await publish(label, e, relays, false, true));
    }
    setSending(publishes);

    // Wait for all messages to be published
    await Promise.all(publishes.map((e) => lastValueFrom(e.publish$)));
    setSending(null);

    // Reset form
    clearCache();
    reset({ content: "" });

    // refocus input
    setTimeout(() => textAreaRef.current?.focus(), 50);
  });

  const skipPublishing = useCallback(() => {
    setSending(null);

    // Reset form
    clearCache();
    reset({ content: "" });

    // refocus input
    setTimeout(() => textAreaRef.current?.focus(), 50);
  }, [reset]);

  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <Flex as="form" onSubmit={sendMessage} ref={formRef} gap="2" {...props}>
      {formState.isSubmitting ? (
        sending ? (
          <SendingStatus entries={sending} onSkip={skipPublishing} />
        ) : (
          <Heading size="md" mx="auto" my="4">
            Signing message...
          </Heading>
        )
      ) : (
        <>
          <Flex direction="column" gap="2">
            <ExpirationToggleButton value={expiration} onChange={setExpiration} variant="ghost" />
            <GroupMessageTypeButton />
          </Flex>
          <MagicTextArea
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
          <Flex direction="column" gap="2">
            <ButtonGroup variant="ghost">
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
