import {
  Alert,
  AlertIcon,
  Box,
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
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { createMessageExpiration } from "../../../../helpers/nostr/message-expiration";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import InsertGifButton from "../../../../components/gif/insert-gif-button";
import EyeOff from "../../../../components/icons/eye-off";
import Lock01 from "../../../../components/icons/lock-01";
import Maximize01 from "../../../../components/icons/maximize-01";
import Minimize01 from "../../../../components/icons/minimize-01";
import MagicTextArea, { RefType } from "../../../../components/magic-textarea";
import InsertReactionButton from "../../../../components/reactions/insert-reaction-button";
import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayLink from "../../../../components/relay/relay-link";
import RouterLink from "../../../../components/router-link";
import InboxDisclosure from "../../components/inbox-disclosure";
import useMessageDraft from "../../../../hooks/use-message-draft";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { DirectMessageRelaysModel } from "../../../../models/messages";
import useMessagePublication from "../../../../hooks/use-message-publication";
import MessagePublicationStatus from "../../components/message-publication-status";
import WrappedComposer from "../../components/wrapped-composer";

function RelayItem({ relay }: { relay: string }) {
  return (
    <Flex gap="2" alignItems="center" w="full" overflow="hidden">
      <RelayFavicon relay={relay} size="xs" />
      <RelayLink relay={relay} isTruncated />
    </Flex>
  );
}

function RelayListSection({ label, relays, emptyState }: { label: string; relays: string[]; emptyState: ReactNode }) {
  return (
    <InboxDisclosure label={label}>
      {relays.length > 0 ? (
        <VStack spacing={1} align="stretch" pl={2}>
          {relays.map((relay) => (
            <RelayItem key={relay} relay={relay} />
          ))}
        </VStack>
      ) : (
        emptyState
      )}
    </InboxDisclosure>
  );
}

export function MessageTypeToggleButton({
  value,
  onChange,
  pubkey,
  ...props
}: {
  value: MessageType;
  onChange: (value: MessageType) => void;
  pubkey: string;
} & Omit<IconButtonProps, "children" | "onClick" | "onChange" | "value" | "aria-label">) {
  const [isOpen, setIsOpen] = useState(false);
  const account = useActiveAccount()!;

  // Get relay information for both message types
  const selfNip17Inboxes = useEventModel(DirectMessageRelaysModel, [account.pubkey]);
  const otherNip17Inboxes = useEventModel(DirectMessageRelaysModel, [pubkey]);
  const selfNip65Inboxes = useUserInbox(account.pubkey);
  const otherNip65Inboxes = useUserInbox(pubkey);

  const nip17RelaysToShow = useMemo(() => {
    const selfRelays = selfNip17Inboxes || [];
    const otherRelays = otherNip17Inboxes || [];
    return { self: selfRelays, other: otherRelays };
  }, [selfNip17Inboxes, otherNip17Inboxes]);

  const nip04RelaysToShow = useMemo(() => {
    const selfRelays = selfNip65Inboxes || [];
    const otherRelays = otherNip65Inboxes || [];
    return { self: selfRelays, other: otherRelays };
  }, [selfNip65Inboxes, otherNip65Inboxes]);

  const handleTypeChange = (newType: MessageType) => {
    onChange(newType);
    setIsOpen(false);
  };

  const nip65EmptyState = (
    <Text fontSize="sm" color="GrayText" pl={2}>
      No NIP-65 inboxes configured.
    </Text>
  );

  return (
    <>
      <IconButton
        variant="ghost"
        onClick={() => setIsOpen(true)}
        aria-label="Toggle message type"
        colorScheme={value === "nip04" ? "red" : "green"}
        {...props}
      >
        {value === "nip04" ? <EyeOff boxSize={6} /> : <Lock01 boxSize={6} />}
      </IconButton>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} isCentered size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p="4">Message Type</ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" py="2">
            {value === "nip04" ? (
              <>
                <Alert status="warning" mb={4}>
                  <AlertIcon />
                  <Text>
                    If the other user does not have a compatible app, they won't see the messages when you switch to
                    private messaging.
                  </Text>
                </Alert>
                <Text mb={4}>
                  Private messaging (NIP-17) provides better privacy by hiding message metadata from third parties.
                </Text>

                <VStack spacing={4} align="stretch">
                  <Box>
                    <Heading size="sm" mb={2}>
                      NIP-17 Message Inboxes
                    </Heading>
                    <Text fontSize="sm" color="GrayText" mb={3}>
                      Messages will be sent to these inbox relays (
                      <Link isExternal href="https://github.com/nostr-protocol/nips/blob/master/17.md" color="blue.500">
                        NIP-17
                      </Link>
                      ).
                    </Text>

                    <VStack spacing={3} align="stretch">
                      <RelayListSection
                        label="Your inboxes"
                        relays={nip17RelaysToShow.self}
                        emptyState={
                          <Alert status="warning" size="sm">
                            <AlertIcon />
                            <Box>
                              <Text fontSize="sm">No NIP-17 inboxes configured.</Text>
                              <Link as={RouterLink} to="/settings/messages" color="blue.500" fontSize="sm">
                                Set up your message inboxes →
                              </Link>
                            </Box>
                          </Alert>
                        }
                      />

                      <RelayListSection
                        label="Their inboxes"
                        relays={nip17RelaysToShow.other}
                        emptyState={
                          <Text fontSize="sm" color="GrayText" pl={2}>
                            No NIP-17 inboxes configured.
                          </Text>
                        }
                      />
                    </VStack>
                  </Box>
                </VStack>
              </>
            ) : (
              <>
                <Alert status="warning" mb={4}>
                  <AlertIcon />
                  <Text>
                    If you switch to legacy messaging, third parties will be able to see who you are messaging and how
                    many messages you send, even though the content of the messages is encrypted.
                  </Text>
                </Alert>
                <Text mb={4}>
                  Legacy messaging (NIP-04) is less private but more widely supported across different apps.
                </Text>

                <VStack spacing={4} align="stretch">
                  <Box>
                    <Heading size="sm" mb={2}>
                      NIP-04 Legacy Inboxes
                    </Heading>
                    <Text fontSize="sm" color="GrayText" mb={3}>
                      Messages will be sent to these NIP-65 inbox relays (
                      <Link isExternal href="https://github.com/nostr-protocol/nips/blob/master/04.md" color="blue.500">
                        NIP-04
                      </Link>
                      ,{" "}
                      <Link isExternal href="https://github.com/nostr-protocol/nips/blob/master/65.md" color="blue.500">
                        NIP-65
                      </Link>
                      ).
                    </Text>

                    <VStack spacing={3} align="stretch">
                      <RelayListSection
                        label="Your inboxes"
                        relays={nip04RelaysToShow.self}
                        emptyState={nip65EmptyState}
                      />

                      <RelayListSection
                        label="Their inboxes"
                        relays={nip04RelaysToShow.other}
                        emptyState={nip65EmptyState}
                      />
                    </VStack>
                  </Box>
                </VStack>
              </>
            )}
          </ModalBody>
          <ModalFooter p="4">
            <Button variant="ghost" mr={3} onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              colorScheme={value === "nip04" ? "green" : "orange"}
              onClick={() => handleTypeChange(value === "nip04" ? "nip17" : "nip04")}
            >
              {value === "nip04" ? "Enable Private Messages" : "Switch to Legacy"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export type MessageType = "nip04" | "nip17";

export default function SendMessageForm({
  pubkey,
  rootId: _rootId,
  type,
  publication,
  expiration,
  ...props
}: {
  pubkey: string;
  rootId?: string;
  type: MessageType;
  publication: ReturnType<typeof useMessagePublication>;
  expiration?: number | null;
} & Omit<FlexProps, "children">) {
  const [expanded, setExpanded] = useState(false);

  const { getValues, setValue, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  const content = watch("content");
  const draft = useMessageDraft("nip04", [pubkey], content, formState.isDirty, reset);

  const autocompleteRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertText = useTextAreaInsertTextWithForm(autocompleteRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const sendMessage = handleSubmit(async (values) => {
    if (!values.content && !publication.pending) return;
    const expirationTimestamp = createMessageExpiration(expiration);
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

  if (type === "nip17") return <WrappedComposer recipients={[pubkey]} expiration={expiration} />;

  return (
    <Flex as="form" gap="2" direction="column" onSubmit={sendMessage} ref={formRef} {...props}>
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
        <Flex gap="2" w="full" align="center" wrap={expanded ? "wrap" : "nowrap"}>
          <Box flex={expanded ? "1 0 100%" : "1 1 0"} minW={0} order={expanded ? -1 : 0}>
            <MagicTextArea
              value={getValues().content}
              onChange={(e) => setValue("content", e.target.value, { shouldDirty: true, shouldTouch: true })}
              rows={expanded ? 5 : 1}
              h={expanded ? "auto" : "10"}
              minH="10"
              resize={expanded ? "vertical" : "none"}
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
          </Box>
          {expanded && (
            <ButtonGroup isDisabled={!!publication.pending}>
              <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
              <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
            </ButtonGroup>
          )}
          <IconButton
            aria-label={expanded ? "Collapse composer" : "Expand composer"}
            title={expanded ? "Collapse composer" : "Expand composer"}
            aria-expanded={expanded}
            icon={expanded ? <Minimize01 boxSize={5} /> : <Maximize01 boxSize={5} />}
            variant="ghost"
            onClick={() => setExpanded((value) => !value)}
            flexShrink={0}
            ml={expanded ? "auto" : undefined}
          />
          <Button type="submit" colorScheme="primary" isDisabled={!publication.ready || !draft.ready}>
            {publication.pending ? "Retry send" : "Send"}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
