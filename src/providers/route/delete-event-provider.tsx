import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
} from "@chakra-ui/react";
import {
  getReplaceableAddress,
  isReplaceable,
  mergeRelaySets,
  normalizeRelayUrl,
  unixNow,
} from "applesauce-core/helpers";
import { createDefer, Deferred } from "applesauce-core/promise";
import { useActiveAccount } from "applesauce-react/hooks";
import { Event, kinds } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useRef, useState } from "react";

import { EmbedEventCard } from "../../components/embed-event/card";
import { RelayUrlInput } from "../../components/relay-url-input";
import useAsyncAction from "../../hooks/use-async-action";
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
  const reasonInputRef = useRef<HTMLInputElement>(null);
  const [event, setEvent] = useState<Event>();
  const [defer, setDefer] = useState<Deferred<void>>();
  const [reason, setReason] = useState("");
  const [deleteFromOutbox, setDeleteFromOutbox] = useState(true);
  const [extraRelays, setExtraRelays] = useState<string[]>([]);
  const [relayUrl, setRelayUrl] = useState("");

  const outbox = useUserOutbox(account?.pubkey);
  const relays = mergeRelaySets(deleteFromOutbox ? outbox : [], extraRelays);

  const { run: addRelay } = useAsyncAction(async () => {
    const url = normalizeRelayUrl(relayUrl.trim());
    if (!["ws:", "wss:"].includes(new URL(url).protocol)) throw new Error("Use a ws:// or wss:// relay URL");
    setExtraRelays((current) => mergeRelaySets(current, [url]));
    setRelayUrl("");
  }, [relayUrl]);

  const deleteEvent = useCallback((event: Event) => {
    setReason("");
    setDeleteFromOutbox(true);
    setExtraRelays([]);
    setRelayUrl("");
    setEvent(event);
    const defer = createDefer<void>();
    setDefer(defer);
    return defer;
  }, []);
  const onClose = useCallback(() => setEvent(undefined), []);

  const { run: confirm, loading: isLoading } = useAsyncAction(async () => {
    await Promise.resolve()
      .then(async () => {
        if (!event) throw new Error("no event");
        if (relays.length === 0) throw new Error("Select at least one relay");
        const tags: string[][] = [["e", event.id]];
        if (isReplaceable(event.kind)) {
          const address = getReplaceableAddress(event);
          if (address) tags.push(["a", address]); // v5: can return null
        }

        const draft = {
          kind: kinds.EventDeletion,
          tags,
          content: reason,
          created_at: unixNow(),
        };
        const pub = await publish("Delete", draft, relays, false, true);
        eventStore.add(pub.event);
        defer?.resolve();
      })
      .catch((error) => {
        defer?.reject(error);
        throw error;
      })
      .finally(() => {
        setReason("");
        setEvent(undefined);
        setDefer(undefined);
      });
  }, [defer, event, publish, reason, relays]);

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
        <Modal isOpen={true} onClose={onClose} size="xl" initialFocusRef={reasonInputRef}>
          <ModalOverlay />
          <ModalContent onClick={(e) => e.stopPropagation()} onSubmit={(e) => e.preventDefault()}>
            <ModalHeader px="4" py="2">
              Delete Event?
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" py="0">
              <EmbedEventCard event={event} />
              <Input
                ref={reasonInputRef}
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                mt="2"
              />

              <FormControl display="flex" alignItems="center" my="3">
                <Switch
                  id="delete-from-outbox"
                  colorScheme="primary"
                  isChecked={deleteFromOutbox}
                  onChange={(e) => setDeleteFromOutbox(e.target.checked)}
                  isDisabled={isLoading}
                />
                <FormLabel htmlFor="delete-from-outbox" mb="0" ml="2">
                  Delete from Outbox Relays
                </FormLabel>
              </FormControl>
              <Flex gap="2" mb="2">
                <RelayUrlInput
                  placeholder="Add an extra relay (optional)"
                  value={relayUrl}
                  onChange={(e) => setRelayUrl(e.target.value)}
                  isDisabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (relayUrl.trim()) addRelay();
                    }
                  }}
                />
                <Button type="button" onClick={addRelay} isDisabled={isLoading || !relayUrl.trim()}>
                  Add
                </Button>
              </Flex>
              <Flex wrap="wrap" gap="2" mb="3">
                {extraRelays.map((url) => (
                  <Tag key={url} maxW="full">
                    <TagLabel isTruncated>{url}</TagLabel>
                    <TagCloseButton
                      aria-label={`Remove ${url}`}
                      isDisabled={isLoading}
                      onClick={() => setExtraRelays((current) => current.filter((relay) => relay !== url))}
                    />
                  </Tag>
                ))}
              </Flex>
              <Text fontSize="sm" color="GrayText" mb="4">
                This sends a deletion request to your relays. Not all relays honor deletion requests, and copies may
                remain elsewhere.
              </Text>
            </ModalBody>

            <ModalFooter px="4" pb="4" pt="0">
              <Button type="button" variant="ghost" mr={2} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                colorScheme="red"
                variant="solid"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  confirm();
                }}
                isLoading={isLoading}
                isDisabled={relays.length === 0}
              >
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </DeleteEventContext.Provider>
  );
}
