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
import { SendLegacyMessage, SendWrappedMessage } from "applesauce-actions/actions";
import {
  createConversationIdentifier,
  getDisplayName,
  getTagValue,
  mergeRelaySets,
  unixNow,
} from "applesauce-core/helpers";
import { useActionHub, useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { lastValueFrom, toArray } from "rxjs";

import InsertGifButton from "../../../../components/gif/insert-gif-button";
import EyeOff from "../../../../components/icons/eye-off";
import Lock01 from "../../../../components/icons/lock-01";
import MagicTextArea, { RefType } from "../../../../components/magic-textarea";
import InsertReactionButton from "../../../../components/reactions/insert-reaction-button";
import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayLink from "../../../../components/relay/relay-link";
import RouterLink from "../../../../components/router-link";
import UserName from "../../../../components/user/user-name";
import useCacheForm from "../../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { DirectMessageRelaysModel, GroupMessageInboxesModel } from "../../../../models/messages";
import { PublishLogEntry, usePublishEvent } from "../../../../providers/global/publish-provider";
import { eventStore } from "../../../../services/event-store";
import localSettings from "../../../../services/preferences";
import ExpirationToggleButton from "../../components/expiration-toggle-button";
import SendingStatus from "../../components/sending-status";

function RelayItem({ relay }: { relay: string }) {
  return (
    <Flex gap="2" alignItems="center" w="full" overflow="hidden">
      <RelayFavicon relay={relay} size="xs" />
      <RelayLink relay={relay} isTruncated />
    </Flex>
  );
}

function MessageTypeToggleButton({
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
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                          Your inboxes:
                        </Text>
                        {nip17RelaysToShow.self.length > 0 ? (
                          <VStack spacing={1} align="stretch" pl={2}>
                            {nip17RelaysToShow.self.map((relay) => (
                              <RelayItem key={relay} relay={relay} />
                            ))}
                          </VStack>
                        ) : (
                          <Alert status="warning" size="sm">
                            <AlertIcon />
                            <Box>
                              <Text fontSize="sm">No NIP-17 inboxes configured.</Text>
                              <Link as={RouterLink} to="/settings/messages" color="blue.500" fontSize="sm">
                                Set up your message inboxes →
                              </Link>
                            </Box>
                          </Alert>
                        )}
                      </Box>

                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                          <UserName pubkey={pubkey} />
                          's inboxes:
                        </Text>
                        {nip17RelaysToShow.other.length > 0 ? (
                          <VStack spacing={1} align="stretch" pl={2}>
                            {nip17RelaysToShow.other.map((relay) => (
                              <RelayItem key={relay} relay={relay} />
                            ))}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="GrayText" pl={2}>
                            No NIP-17 inboxes configured.
                          </Text>
                        )}
                      </Box>
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
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                          Your inboxes:
                        </Text>
                        {nip04RelaysToShow.self.length > 0 ? (
                          <VStack spacing={1} align="stretch" pl={2}>
                            {nip04RelaysToShow.self.map((relay) => (
                              <RelayItem key={relay} relay={relay} />
                            ))}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="GrayText" pl={2}>
                            No NIP-65 inboxes configured.
                          </Text>
                        )}
                      </Box>

                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                          <UserName pubkey={pubkey} />
                          's inboxes:
                        </Text>
                        {nip04RelaysToShow.other.length > 0 ? (
                          <VStack spacing={1} align="stretch" pl={2}>
                            {nip04RelaysToShow.other.map((relay) => (
                              <RelayItem key={relay} relay={relay} />
                            ))}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="GrayText" pl={2}>
                            No NIP-65 inboxes configured.
                          </Text>
                        )}
                      </Box>
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
  rootId,
  initialType = "nip04",
  initialExpiration,
  ...props
}: { pubkey: string; rootId?: string; initialType?: MessageType; initialExpiration?: number } & Omit<
  FlexProps,
  "children"
>) {
  const account = useActiveAccount()!;
  const publish = usePublishEvent();
  const actions = useActionHub();
  const defaultMessageExpiration = useObservableEagerState(localSettings.defaultMessageExpiration);

  // These values are managed outside of the form because they are options the user toggles
  const [expiration, setExpiration] = useState<number | null>(initialExpiration ?? defaultMessageExpiration);
  const [type, setType] = useState<MessageType>(initialType);

  // Reset the type when initial values change
  useEffect(() => {
    setType(initialType);
  }, [initialType]);
  useEffect(() => {
    if (initialExpiration) setExpiration(initialExpiration);
  }, [initialExpiration]);

  const { getValues, setValue, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  const clearCache = useCacheForm<{ content: string }>(`dm-${pubkey}`, getValues, reset, formState, {
    clearOnKeyChange: true,
  });

  const autocompleteRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertText = useTextAreaInsertTextWithForm(autocompleteRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const [sending, setSending] = useState<PublishLogEntry[] | null>(null);
  const otherInboxes = useUserInbox(pubkey);
  const selfInboxes = useUserInbox(account.pubkey);
  const inboxes = useEventModel(GroupMessageInboxesModel, [
    createConversationIdentifier(account.pubkey, pubkey),
    false,
  ]);
  const sendMessage = handleSubmit(async (values) => {
    if (!values.content) return;

    const expirationTimestamp = expiration ? unixNow() + expiration : undefined;

    // Publish all wrapped message events
    const publishes: PublishLogEntry[] = [];
    if (type === "nip04") {
      // Create legacy direct message events
      const events = await lastValueFrom(
        actions.exec(SendLegacyMessage, pubkey, values.content, { expiration: expirationTimestamp }).pipe(toArray()),
      );

      // Send legacy direct messages to both users NIP-65 inboxes
      for (let event of events) {
        publishes.push(await publish("Send message", event, mergeRelaySets(otherInboxes, selfInboxes), false, true));
      }
    } else {
      if (!inboxes) throw new Error("Missing both users inboxes");

      // Create all wrapped message events
      const events = await lastValueFrom(
        actions
          .exec(SendWrappedMessage, [account.pubkey, pubkey], values.content, { expiration: expirationTimestamp })
          .pipe(toArray()),
      );
      for (let e of events) {
        const pubkey = getTagValue(e, "p");
        if (!pubkey) return;
        const relays = inboxes?.[pubkey];
        const profile = eventStore.getReplaceable(kinds.Metadata, pubkey);

        const label = `Send message to ${getDisplayName(profile)}`;
        if (!relays) publishes.push(await publish(label, e, [], false));
        else publishes.push(await publish(label, e, relays, false, true));
      }
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
    <Flex as="form" gap="2" onSubmit={sendMessage} ref={formRef} {...props}>
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
          <Flex gap="2" direction="column">
            <ExpirationToggleButton value={expiration} onChange={setExpiration} variant="ghost" />
            <MessageTypeToggleButton value={type} onChange={setType} pubkey={pubkey} variant="ghost" />
          </Flex>
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
