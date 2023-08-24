import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Code,
  Flex,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Event, Kind, nip19 } from "nostr-tools";
import dayjs from "dayjs";

import { useCurrentAccount } from "../hooks/use-current-account";
import signingService from "../services/signing";
import QuoteNote from "../components/note/quote-note";
import createDefer, { Deferred } from "../classes/deferred";
import useEventRelays from "../hooks/use-event-relays";
import { useWriteRelayUrls } from "../hooks/use-client-relays";
import { RelayFavicon } from "../components/relay-favicon";
import { ExternalLinkIcon } from "../components/icons";
import { getEventCoordinate, isReplaceable } from "../helpers/nostr/events";
import NostrPublishAction from "../classes/nostr-publish-action";
import { Tag } from "../types/nostr-event";

type DeleteEventContextType = {
  isLoading: boolean;
  deleteEvent: (event: Event) => Promise<void>;
};

const DeleteEventContext = createContext<DeleteEventContextType>({
  isLoading: false,
  deleteEvent: () => Promise.reject(),
});

export function useDeleteEventContext() {
  return useContext(DeleteEventContext);
}

function EventPreview({ event }: { event: Event }) {
  if (event.kind === Kind.Text) {
    return <QuoteNote noteId={event.id} />;
  }
  return <Code>{nip19.noteEncode(event.id)}</Code>;
}

export default function DeleteEventProvider({ children }: PropsWithChildren) {
  const toast = useToast();
  const account = useCurrentAccount();
  const [isLoading, setLoading] = useState(false);
  const [event, setEvent] = useState<Event>();
  const [defer, setDefer] = useState<Deferred<void>>();
  const [reason, setReason] = useState("");

  const eventRelays = useEventRelays(event?.id);
  const writeRelays = useWriteRelayUrls(eventRelays);

  const deleteEvent = useCallback((event: Event) => {
    setEvent(event);
    const defer = createDefer<void>();
    setDefer(defer);
    return defer;
  }, []);
  const onClose = useCallback(() => setEvent(undefined), []);

  const confirm = useCallback(async () => {
    try {
      if (!event) throw new Error("no event");
      if (!account) throw new Error("not logged in");
      setLoading(true);
      const tags: Tag[] = [["e", event.id]];
      if (isReplaceable(event.kind)) {
        tags.push(["a", getEventCoordinate(event)]);
      }

      const draft = {
        kind: Kind.EventDeletion,
        tags,
        content: reason,
        created_at: dayjs().unix(),
      };
      const signed = await signingService.requestSignature(draft, account);
      const pub = new NostrPublishAction("Delete", writeRelays, signed);
      await pub.onComplete;
      defer?.resolve();
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
      defer?.reject();
    } finally {
      setLoading(false);
      setReason("");
      setEvent(undefined);
      setDefer(undefined);
    }
  }, [defer, event, account]);

  const context = useMemo(
    () => ({
      isLoading,
      deleteEvent,
    }),
    [isLoading, deleteEvent],
  );

  return (
    <DeleteEventContext.Provider value={context}>
      {children}
      {event && (
        <Modal isOpen={true} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader px="4" py="2">
              Delete Note?
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" py="0">
              <EventPreview event={event} />
              <Input
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                mt="2"
              />

              <Accordion allowToggle my="2">
                <AccordionItem>
                  <AccordionButton>
                    Deleting from relays
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel>
                    <Flex wrap="wrap" gap="2" py="2">
                      {writeRelays.map((url) => (
                        <Box alignItems="center" key={url} px="2" borderRadius="lg" display="flex" borderWidth="1px">
                          <RelayFavicon relay={url} size="2xs" mr="2" />
                          <Text isTruncated>{url}</Text>
                        </Box>
                      ))}
                    </Flex>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </ModalBody>

            <ModalFooter px="4" pb="4" pt="0">
              <Button
                as={Link}
                leftIcon={<ExternalLinkIcon />}
                isExternal
                href="https://nostr-delete.vercel.app/"
                variant="link"
                mr="auto"
                size="sm"
              >
                Nostr Event Deletion
              </Button>
              <Button variant="ghost" size="sm" mr={2} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" variant="solid" onClick={confirm} size="sm" isLoading={isLoading}>
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </DeleteEventContext.Provider>
  );
}
