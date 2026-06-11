import { Badge, Box, Checkbox, Flex, Input, ModalHeader, Spinner, Text } from "@chakra-ui/react";
import { memo, useMemo, useState } from "react";
import { useThrottle } from "react-use";

import useRelayDiscovery, { RelayDiscoveryEntry } from "../../../hooks/use-relay-discovery";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import RelayFavicon from "../../relay/relay-favicon";
import RelayName from "../../relay/relay-name";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";

/** Shared modal header for the relay discovery modals */
export function RelayDiscoveryModalHeader({ attributes }: { attributes: string[] }) {
  return (
    <ModalHeader display="flex" gap="2" alignItems="center" flexWrap="wrap" pe="10">
      Discover relays
      {attributes.map((attribute) => (
        <Badge key={attribute}>{attribute}</Badge>
      ))}
    </ModalHeader>
  );
}

function RelayRow({
  entry,
  checked,
  onSelect,
}: {
  entry: RelayDiscoveryEntry;
  /** When set the row is rendered with a checkbox (multi-select) */
  checked?: boolean;
  onSelect: (relay: string) => void;
}) {
  const multiple = checked !== undefined;
  const { info } = useRelayInfo(entry.url);

  return (
    <Flex
      as={multiple ? "label" : undefined}
      gap="2"
      alignItems="center"
      p="2"
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
      onClick={multiple ? undefined : () => onSelect(entry.url)}
    >
      {multiple && <Checkbox isChecked={checked} onChange={() => onSelect(entry.url)} />}
      <RelayFavicon relay={entry.url} size="sm" />
      <Box overflow="hidden">
        <Flex gap="2" alignItems="center">
          {info?.name ? <Text isTruncated>{info.name}</Text> : <RelayName relay={entry.url} isTruncated />}
          {info?.pubkey && (
            <>
              <UserAvatar pubkey={info.pubkey} size="xs" noProxy />
              <UserLink pubkey={info.pubkey} isTruncated onClick={(e) => e.stopPropagation()} />
            </>
          )}
        </Flex>
        <Text color="GrayText" isTruncated>
          {entry.url}
        </Text>
      </Box>
    </Flex>
  );
}

const MemoRelayRow = memo(RelayRow);

export default function RelayDiscoveryList({
  attributes,
  hidden,
  selected,
  onSelect,
}: {
  /** OR list of NIP-66 W attributes to filter relays by */
  attributes: string[];
  /** Relay URLs to exclude from the list (already added) */
  hidden?: string[];
  /** Set of selected relay URLs, when set rows are rendered with checkboxes (multi-select) */
  selected?: Set<string>;
  /** Called when a relay is clicked (single-select) or toggled (multi-select) */
  onSelect: (relay: string) => void;
}) {
  const relays = useRelayDiscovery(attributes);

  const [search, setSearch] = useState("");
  const searchThrottle = useThrottle(search.toLocaleLowerCase().trim(), 100);

  const filtered = useMemo(() => {
    if (!relays) return undefined;

    let entries = relays;
    if (hidden && hidden.length > 0) entries = entries.filter((entry) => !hidden.includes(entry.url));
    if (searchThrottle.length > 0)
      entries = entries.filter(
        (entry) =>
          entry.url.toLocaleLowerCase().includes(searchThrottle) ||
          entry.attributes.some((attribute) => attribute.toLocaleLowerCase().includes(searchThrottle)),
      );
    return entries;
  }, [relays, hidden?.join(","), searchThrottle]);

  return (
    <Flex direction="column" gap="2" overflow="hidden" flex={1}>
      <Input
        type="search"
        placeholder="Filter relays"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        flexShrink={0}
      />
      {filtered === undefined ? (
        <Flex justifyContent="center" py="8">
          <Spinner />
        </Flex>
      ) : filtered.length === 0 ? (
        <Text color="GrayText" textAlign="center" py="8">
          No relays found
        </Text>
      ) : (
        <>
          <Text color="GrayText" flexShrink={0}>
            {filtered.length} relays
          </Text>
          <Flex direction="column" overflowY="auto" flex={1}>
            {filtered.map((entry) => (
              <MemoRelayRow
                key={entry.url}
                entry={entry}
                checked={selected ? selected.has(entry.url) : undefined}
                onSelect={onSelect}
              />
            ))}
          </Flex>
        </>
      )}
    </Flex>
  );
}
