import {
  AvatarGroup,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Spacer,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { LOOKUP_RELAY_LIST_KIND } from "applesauce-common/helpers";
import { kinds } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { LoadableAddressPointer } from "applesauce-loaders/loaders";
import { useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { memo, useCallback, useMemo, useState } from "react";
import { useMount, useThrottle } from "react-use";

import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayName from "../../../../components/relay/relay-name";
import UserAvatar from "../../../../components/user/user-avatar";
import { RECOMMENDED_LOOKUP_RELAYS } from "../../../../const";
import { getRelaysFromList } from "../../../../helpers/nostr/lists";
import useAsyncAction from "../../../../hooks/use-async-action";
import { useOutboxTimelineLoader } from "../../../../hooks/use-outbox-timeline-loader";
import useRelayDiscovery from "../../../../hooks/use-relay-discovery";
import useUserContacts from "../../../../hooks/use-user-contacts";

type LookupRelayEntry = {
  url: string;
  /** Contacts that have this relay in their lookup relay list */
  pubkeys: string[];
  recommended: boolean;
};

const INDEXER_ATTRIBUTES = ["Indexer"];

/** Loads the contacts' lookup relay lists and returns a map of relay URL to the contacts using it */
function useContactsLookupRelays(pubkey: string) {
  const pointer = useMemo(() => ({ kind: kinds.Contacts, pubkey }) satisfies LoadableAddressPointer, [pubkey]);
  const filter = useMemo(() => ({ kinds: [LOOKUP_RELAY_LIST_KIND] }), []);
  const loader = useOutboxTimelineLoader(pointer, filter);
  useMount(() => loader?.({ since: 0, until: Math.floor(Date.now() / 1000) }).subscribe());

  const contacts = useUserContacts(pubkey);
  const lists = useEventModel(
    TimelineModel<NostrEvent>,
    contacts && [{ authors: contacts.map((c) => c.pubkey), kinds: [LOOKUP_RELAY_LIST_KIND] }],
  );

  return useMemo(() => {
    const usage = new Map<string, Set<string>>();
    for (const list of lists ?? []) {
      for (const relay of getRelaysFromList(list)) {
        let set = usage.get(relay);
        if (!set) usage.set(relay, (set = new Set()));
        set.add(list.pubkey);
      }
    }
    return usage;
  }, [lists]);
}

function LookupRelayRow({
  entry,
  checked,
  onToggle,
}: {
  entry: LookupRelayEntry;
  checked: boolean;
  onToggle: (relay: string) => void;
}) {
  return (
    <Flex
      as="label"
      gap="2"
      alignItems="center"
      p="2"
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
    >
      <Checkbox isChecked={checked} onChange={() => onToggle(entry.url)} />
      <RelayFavicon relay={entry.url} size="sm" />
      <Box overflow="hidden" flex={1}>
        <Flex gap="2" alignItems="center">
          <RelayName relay={entry.url} isTruncated />
          {entry.recommended && <Badge colorScheme="primary">Recommended</Badge>}
        </Flex>
        <Text color="GrayText" isTruncated>
          {entry.url}
        </Text>
      </Box>
      {entry.pubkeys.length > 0 && (
        <Flex gap="2" alignItems="center" flexShrink={0}>
          <AvatarGroup size="xs" max={3}>
            {entry.pubkeys.map((pubkey) => (
              <UserAvatar key={pubkey} pubkey={pubkey} size="xs" />
            ))}
          </AvatarGroup>
          <Text color="GrayText" fontSize="sm">
            {entry.pubkeys.length}
          </Text>
        </Flex>
      )}
    </Flex>
  );
}

const MemoLookupRelayRow = memo(LookupRelayRow);

export type DiscoverLookupRelaysModalProps = Omit<ModalProps, "children"> & {
  pubkey: string;
  /** Relay URLs to hide (already added) */
  hidden: string[];
  onSelect: (relays: string[]) => void | Promise<void>;
};

/** A modal for picking lookup relays, ranked by how many contacts use them */
export default function DiscoverLookupRelaysModal({
  pubkey,
  hidden,
  onSelect,
  onClose,
  ...props
}: DiscoverLookupRelaysModalProps) {
  const usage = useContactsLookupRelays(pubkey);
  const indexers = useRelayDiscovery(INDEXER_ATTRIBUTES);

  const [search, setSearch] = useState("");
  const searchThrottle = useThrottle(search.toLocaleLowerCase().trim(), 100);

  const entries = useMemo(() => {
    const urls = new Set<string>([
      ...usage.keys(),
      ...RECOMMENDED_LOOKUP_RELAYS,
      ...(indexers ?? []).map((entry) => entry.url),
    ]);

    return Array.from(urls)
      .filter((url) => !hidden.includes(url))
      .filter((url) => searchThrottle.length === 0 || url.toLocaleLowerCase().includes(searchThrottle))
      .map((url): LookupRelayEntry => ({
        url,
        pubkeys: Array.from(usage.get(url) ?? []),
        recommended: RECOMMENDED_LOOKUP_RELAYS.includes(url),
      }))
      .sort((a, b) => b.pubkeys.length - a.pubkeys.length || Number(b.recommended) - Number(a.recommended));
  }, [usage, indexers, hidden.join(","), searchThrottle]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = useCallback((relay: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(relay)) next.delete(relay);
      else next.add(relay);
      return next;
    });
  }, []);

  const { run: confirm, loading } = useAsyncAction(async () => {
    await onSelect(Array.from(selected));
    onClose();
  }, [onSelect, selected, onClose]);

  return (
    <Modal onClose={onClose} size="2xl" scrollBehavior="inside" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader pe="10">Discover lookup relays</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap="2" overflow="hidden" pt="0" pb="0">
          <Text color="GrayText">Lookup relays used by the people you follow, ranked by popularity.</Text>
          <Input
            type="search"
            placeholder="Filter relays"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            flexShrink={0}
          />
          <Flex direction="column" overflowY="auto" flex={1}>
            {entries.map((entry) => (
              <MemoLookupRelayRow key={entry.url} entry={entry} checked={selected.has(entry.url)} onToggle={toggle} />
            ))}
            {indexers === undefined && (
              <Flex justifyContent="center" py="4">
                <Spinner />
              </Flex>
            )}
          </Flex>
        </ModalBody>
        <ModalFooter gap="2">
          {selected.size > 0 && <Text color="GrayText">{selected.size} selected</Text>}
          <Spacer />
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="primary" isDisabled={selected.size === 0} isLoading={loading} onClick={confirm}>
            Add {selected.size > 0 ? selected.size : ""} relay{selected.size === 1 ? "" : "s"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
