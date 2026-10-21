import { Badge, Box, Button, Code, Flex, IconButton, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { TrashIcon } from "../../../components/icons";
import { getNappletIdentity, parseNappletManifest } from "../../../helpers/nostr/napplets";
import useNappletVersions from "../../../hooks/use-napplet-versions";
import { getAlwaysAllowed } from "../../../services/napplet-shell/permissions";
import {
  nappletStorageEntries$,
  removeNappletStorageEntries,
  type NappletStorageEntry,
} from "../../../services/napplet-shell/storage";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Build hashes of every known version, since storage is scoped to the version that wrote it */
function useNappletBuildHashes(event: NostrEvent) {
  const { versions = [], snapshots = [] } = useNappletVersions(event);

  return useMemo(() => {
    const identity = getNappletIdentity(event);
    const hashes = new Set([identity.aggregateHash]);

    for (const version of [...versions, ...snapshots]) {
      try {
        hashes.add(parseNappletManifest(version).aggregateHash);
      } catch {
        // A version with nothing to load cannot have written any storage
        continue;
      }
    }
    for (const grant of getAlwaysAllowed()) {
      if (grant.pubkey === identity.pubkey && grant.dTag === identity.dTag) hashes.add(grant.aggregateHash);
    }

    return Array.from(hashes).sort();
  }, [event, versions, snapshots]);
}

function StorageEntryRow({ entry, current }: { entry: NappletStorageEntry; current: boolean }) {
  return (
    <Flex gap="3" alignItems="flex-start">
      <Box flex="1" minW="0">
        <Flex gap="2" alignItems="center" wrap="wrap">
          <Code fontWeight="semibold">{entry.key}</Code>
          <Text fontSize="xs" color="GrayText">
            {formatBytes(entry.bytes)}
          </Text>
          {!current && <Badge textTransform="none">older version</Badge>}
          {entry.instance && <Badge textTransform="none">one window</Badge>}
        </Flex>
        <Text fontFamily="mono" fontSize="sm" color="GrayText" noOfLines={2} wordBreak="break-all">
          {entry.value}
        </Text>
      </Box>
      <IconButton
        icon={<TrashIcon />}
        aria-label={`Delete ${entry.key}`}
        size="sm"
        variant="ghost"
        onClick={() => removeNappletStorageEntries([entry])}
      />
    </Flex>
  );
}

/** The NAP-STORAGE values a napplet saved on this device */
export default function NappletDetailStorage({ event }: { event: NostrEvent }) {
  const identity = useMemo(() => getNappletIdentity(event), [event]);
  const hashes = useNappletBuildHashes(event);
  const entries = use$(
    () => nappletStorageEntries$(identity.pubkey, identity.dTag, hashes),
    [identity.pubkey, identity.dTag, hashes.join(",")],
  );

  if (!entries || entries.length === 0)
    return <Text color="GrayText">This app has not saved any data on this device.</Text>;

  const total = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  const clearAll = () => {
    if (window.confirm(`Delete all ${entries.length} values this app saved on this device?`))
      removeNappletStorageEntries(entries);
  };

  return (
    <Flex direction="column" gap="4">
      <Flex gap="3" alignItems="center" wrap="wrap">
        <Text flex="1" color="GrayText" fontSize="sm">
          Saved on this device · {formatBytes(total)}
        </Text>
        <Button size="sm" variant="outline" colorScheme="red" onClick={clearAll}>
          Clear all data
        </Button>
      </Flex>
      {entries.map((entry) => (
        <StorageEntryRow
          key={entry.storageKey}
          entry={entry}
          current={entry.aggregateHash === identity.aggregateHash}
        />
      ))}
    </Flex>
  );
}
