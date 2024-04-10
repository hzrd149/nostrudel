import { useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Code,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import BackButton from "../../../components/router/back-button";
import Play from "../../../components/icons/play";
import EventEditor from "./event-editor";
import { EventTemplate, NostrEvent, UnsignedEvent, getEventHash, verifyEvent } from "nostr-tools";
import dayjs from "dayjs";
import { processEvent } from "./process";
import { WritingIcon } from "../../../components/icons";
import { useSigningContext } from "../../../providers/global/signing-provider";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import useCurrentAccount from "../../../hooks/use-current-account";
import UserAvatar from "../../../components/user/user-avatar";
import { RelayUrlInput } from "../../../components/relay-url-input";

export default function EventPublisherView() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const { requestSignature } = useSigningContext();
  const publish = usePublishEvent();
  const account = useCurrentAccount();
  const customRelay = useDisclosure();
  const [customRelayURL, setCustomRelayURL] = useState("");

  const defaultEvent = useMemo(
    () =>
      JSON.stringify(
        { kind: 1234, content: "", tags: [], created_at: dayjs().unix() } satisfies EventTemplate,
        null,
        2,
      ),
    [],
  );
  const [value, setValue] = useState(defaultEvent);
  const [draft, setDraft] = useState<NostrEvent | EventTemplate>();

  const submitEvent = () => {
    try {
      const draft = processEvent(JSON.parse(value) as UnsignedEvent);
      if (account) draft.pubkey = account.pubkey;
      (draft as NostrEvent).id = getEventHash(draft);
      setDraft(draft);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  const sign = async () => {
    if (!draft) return;
    try {
      setDraft(await requestSignature(draft));
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  const publishDraft = async () => {
    if (!draft || !(draft as NostrEvent).sig) return;
    try {
      setLoading(true);
      const valid = verifyEvent(draft as NostrEvent);
      if (!valid) throw new Error("Invalid event");
      if (customRelayURL) {
        await publish("Custom Event", draft, [customRelayURL], true, true);
      } else {
        await publish("Custom Event", draft);
      }
      setDraft(undefined);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  };

  const yolo = async () => {
    try {
      setLoading(true);
      const draft = processEvent(JSON.parse(value) as UnsignedEvent);
      if (account) draft.pubkey = account.pubkey;
      (draft as NostrEvent).id = getEventHash(draft);
      const event = await requestSignature(draft);
      const valid = verifyEvent(event);
      if (!valid) throw new Error("Invalid event");
      if (customRelayURL) {
        await publish("Custom Event", draft, [customRelayURL], true, true);
      } else {
        await publish("Custom Event", draft);
      }
      setDraft(undefined);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  };

  return (
    <>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <BackButton size="sm" />
          <Heading size="md">Event Publisher</Heading>
          <Switch size="sm" checked={customRelay.isOpen} onChange={customRelay.onToggle}>
            Publish to Relay
          </Switch>
          {customRelay.isOpen && (
            <RelayUrlInput
              size="sm"
              borderRadius="md"
              w="xs"
              value={customRelayURL}
              onChange={(e) => setCustomRelayURL(e.target.value)}
            />
          )}
          <ButtonGroup ml="auto">
            {/* <IconButton icon={<HelpCircle />} aria-label="Help" title="Help" size="sm" onClick={helpModal.onOpen} /> */}
            <Button colorScheme="primary" onClick={submitEvent} leftIcon={<Play />} size="sm">
              Publish
            </Button>
          </ButtonGroup>
        </Flex>

        <EventEditor value={value} onChange={(v) => setValue(v)} onRun={submitEvent} />
      </VerticalPageLayout>
      {draft && (
        <Modal isOpen onClose={() => setDraft(undefined)} size="2xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader p="4">Publish Event</ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" pb="2" pt="0">
              <Heading size="md" mt="2">
                1. Event ID
              </Heading>
              <Code w="full" p="2" overflow="auto">
                {(draft as NostrEvent).id}
              </Code>
              <Heading size="md" mt="2">
                2. Pubkey
              </Heading>
              <Flex gap="2" alignItems="center">
                <Code w="full" p="2" overflow="auto">
                  {(draft as NostrEvent).pubkey}
                </Code>
                <UserAvatar pubkey={(draft as NostrEvent).pubkey} />
              </Flex>
              <Heading size="md" whiteSpace="pre" mt="2">
                3. Signature
              </Heading>
              <Flex gap="2" alignItems="center">
                <Code overflow="auto" whiteSpace="pre" w="full" p="2">
                  {(draft as NostrEvent).sig}
                </Code>
                <Button leftIcon={<WritingIcon boxSize={5} />} flexShrink={0} onClick={sign} ml="auto">
                  Sign
                </Button>
              </Flex>

              {(draft as NostrEvent).sig && (
                <Button w="full" colorScheme="primary" mt="2" isLoading={loading} onClick={publishDraft}>
                  Publish
                </Button>
              )}
            </ModalBody>

            <ModalFooter>
              <Button mr={2} onClick={() => setDraft(undefined)}>
                Cancel
              </Button>
              <Button colorScheme="primary" onClick={yolo} isLoading={loading}>
                Yolo
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
