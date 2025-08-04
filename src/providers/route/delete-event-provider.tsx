import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
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
} from "@chakra-ui/react";
import { getReplaceableAddress, isReplaceable, unixNow } from "applesauce-core/helpers";
import { createDefer, Deferred } from "applesauce-core/promise";
import { useActiveAccount } from "applesauce-react/hooks";
import { Event, kinds } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";

import { EmbedEventCard } from "../../components/embed-event/card";
import { ExternalLinkIcon } from "../../components/icons";
import RelayFavicon from "../../components/relay/relay-favicon";
import { useWriteRelays } from "../../hooks/use-client-relays";
import { useUserOutbox } from "../../hooks/use-user-mailboxes";
import { eventStore } from "../../services/event-store";
import { usePublishEvent } from "../global/publish-provider";

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

export default function DeleteEventProvider({ children }: PropsWithChildren) {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const [isLoading, setLoading] = useState(false);
  const [event, setEvent] = useState<Event>();
  const [defer, setDefer] = useState<Deferred<void>>();
  const [reason, setReason] = useState("");

  const outbox = useUserOutbox(account?.pubkey);
  const writeRelays = useWriteRelays(outbox);

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
      setLoading(true);
      const tags: string[][] = [["e", event.id]];
      if (isReplaceable(event.kind)) {
        tags.push(["a", getReplaceableAddress(event)]);
      }

      const draft = {
        kind: kinds.EventDeletion,
        tags,
        content: reason,
        created_at: unixNow(),
      };
      const pub = await publish("Delete", draft, undefined, false);
      eventStore.add(pub.event);
      defer?.resolve();
    } catch (e) {
      defer?.reject();
    } finally {
      setLoading(false);
      setReason("");
      setEvent(undefined);
      setDefer(undefined);
    }
  }, [defer, event, publish]);

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
              Delete Event?
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" py="0">
              <EmbedEventCard event={event} />
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
