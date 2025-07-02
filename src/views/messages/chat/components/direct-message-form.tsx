import {
  Alert,
  AlertIcon,
  Button,
  ButtonGroup,
  Flex,
  FlexProps,
  Heading,
  IconButton,
  IconButtonProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { SendLegacyMessage, SendWrappedMessage } from "applesauce-actions/actions";
import { createConversationIdentifier, mergeRelaySets, unixNow } from "applesauce-core/helpers";
import { useActionHub, useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import InsertGifButton from "../../../../components/gif/insert-gif-button";
import EyeOff from "../../../../components/icons/eye-off";
import Lock01 from "../../../../components/icons/lock-01";
import MagicTextArea, { RefType } from "../../../../components/magic-textarea";
import InsertReactionButton from "../../../../components/reactions/insert-reaction-button";
import useCacheForm from "../../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { GroupMessageInboxes } from "../../../../models/messages";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import localSettings from "../../../../services/local-settings";
import ExpirationToggleButton from "../../components/expiration-toggle-button";

function MessageTypeToggleButton({
  value,
  onChange,
  ...props
}: { value: MessageType; onChange: (value: MessageType) => void } & Omit<
  IconButtonProps,
  "children" | "onClick" | "onChange" | "value" | "aria-label"
>) {
  const [isOpen, setIsOpen] = useState(false);

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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p="4">Message Type</ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" py="2">
            {value === "nip04" ? (
              <>
                <Alert status="warning" mb={4}>
                  <Text>
                    If the other user does not have a compatible app, they won't see the messages when you switch to
                    private messaging.
                  </Text>
                </Alert>
                <Text>
                  Private messaging (NIP-17) provides better privacy by hiding message metadata from third parties.
                </Text>
              </>
            ) : (
              <>
                <Alert status="warning" mb={4}>
                  <Text>
                    If you switch to legacy messaging, third parties will be able to see who you are messaging and how
                    many messages you send, even though the content of the messages is encrypted.
                  </Text>
                </Alert>
                <Text>Legacy messaging (NIP-04) is less private but more widely supported across different apps.</Text>
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
  ...props
}: { pubkey: string; rootId?: string; initialType?: MessageType } & Omit<FlexProps, "children">) {
  const account = useActiveAccount()!;
  const publish = usePublishEvent();
  const actions = useActionHub();
  const defaultMessageExpiration = useObservableEagerState(localSettings.defaultMessageExpiration);

  // These values are managed outside of the form because they are options the user toggles
  const [expiration, setExpiration] = useState<number | null>(defaultMessageExpiration);
  const [type, setType] = useState<MessageType>(initialType);

  // Reset the type when initial type changes
  useEffect(() => {
    setType(initialType);
  }, [initialType]);

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

  const otherInboxes = useUserInbox(pubkey);
  const selfInboxes = useUserInbox(account.pubkey);
  const inboxes = useEventModel(GroupMessageInboxes, [createConversationIdentifier(account.pubkey, pubkey)]);
  const sendMessage = handleSubmit(async (values) => {
    if (!values.content) return;

    const expirationTimestamp = expiration ? unixNow() + expiration : undefined;

    if (type === "nip04") {
      // Send legacy direct message to both users NIP-65 inboxes
      await actions
        .exec(SendLegacyMessage, pubkey, values.content, { expiration: expirationTimestamp })
        .forEach((e) => publish("Send message", e, mergeRelaySets(otherInboxes, selfInboxes), false, true));
    } else {
      if (!inboxes) throw new Error("Missing both users inboxes");

      // Send private direct message to both users NIP-17 inboxes
      await actions
        .exec(SendWrappedMessage, [account.pubkey, pubkey], values.content, { expiration: expirationTimestamp })
        .forEach((e) => publish("Send message", e, mergeRelaySets(...Object.values(inboxes ?? {})), false, true));
    }

    // Reset form
    clearCache();
    reset({ content: "" });

    // refocus input
    setTimeout(() => textAreaRef.current?.focus(), 50);
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
          <Flex gap="2" direction="column">
            <ExpirationToggleButton value={expiration} onChange={setExpiration} variant="ghost" />
            <MessageTypeToggleButton value={type} onChange={setType} variant="ghost" />
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
