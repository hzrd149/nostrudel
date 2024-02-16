import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from "react";
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
import { Event, kinds } from "nostr-tools";
import dayjs from "dayjs";

import createDefer, { Deferred } from "../../classes/deferred";
import useEventRelays from "../../hooks/use-event-relays";
import { RelayFavicon } from "../../components/relay-favicon";
import { ExternalLinkIcon } from "../../components/icons";
import { getEventCoordinate, getEventUID, isReplaceable } from "../../helpers/nostr/event";
import { Tag } from "../../types/nostr-event";
import { EmbedEvent } from "../../components/embed-event";
import { useWriteRelays } from "../../hooks/use-client-relays";
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
  const publish = usePublishEvent();
  const [isLoading, setLoading] = useState(false);
  const [event, setEvent] = useState<Event>();
  const [defer, setDefer] = useState<Deferred<void>>();
  const [reason, setReason] = useState("");

  const eventRelays = useEventRelays(event && getEventUID(event));
  const writeRelays = useWriteRelays(eventRelays);

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
      const tags: Tag[] = [["e", event.id]];
      if (isReplaceable(event.kind)) {
        tags.push(["a", getEventCoordinate(event)]);
      }

      const draft = {
        kind: kinds.EventDeletion,
        tags,
        content: reason,
        created_at: dayjs().unix(),
      };
      await publish("Delete", draft, undefined, false);
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
              <EmbedEvent event={event} />
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
                      {writeRelays.urls.map((url) => (
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
