import {
  Badge,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { combineLatest, map, of, switchMap } from "rxjs";

import { SearchIcon } from "../../../../components/icons";
import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayLink from "../../../../components/relay/relay-link";
import pool from "../../../../services/pool";
import localSettings from "../../../../services/preferences";
import liveness from "../../../../services/relay-liveness";

const remoteOffline$ = liveness.remote$.pipe(switchMap((remote) => remote?.unhealthy$ ?? of([])));

/** Every relay the app has connected to or has a liveness report for */
const knownRelays$ = combineLatest([
  liveness.local.online$,
  liveness.local.offline$,
  liveness.local.dead$,
  remoteOffline$,
  pool.relays$.pipe(map((relays) => Array.from(relays.keys()))),
]).pipe(map((lists) => Array.from(new Set(lists.flat()))));

function StatItem({ label, value }: { label: string; value?: number }) {
  return (
    <Stat flex="0 0 auto">
      <StatLabel color="GrayText">{label}</StatLabel>
      <StatNumber>{value ?? 0}</StatNumber>
    </Stat>
  );
}

export default function RelayLivenessStatus() {
  const localEnabled = use$(localSettings.localRelayLiveness);
  const remote = use$(liveness.remote$);
  const skipped = use$(liveness.unhealthy$);
  const online = use$(liveness.local.online$);
  const offline = use$(liveness.local.offline$);
  const dead = use$(liveness.local.dead$);
  const remoteOffline = use$(remoteOffline$);
  const details = useDisclosure();

  return (
    <>
      <Flex gap="6" wrap="wrap" alignItems="flex-end" mt="2">
        {localEnabled && (
          <>
            <StatItem label="Online" value={online?.length} />
            <StatItem label="Retrying" value={offline?.length} />
            <StatItem label="Dead" value={dead?.length} />
          </>
        )}
        {remote && <StatItem label="Offline by monitors" value={remoteOffline?.length} />}
        <StatItem label="Skipped" value={skipped?.length} />
        <Button variant="outline" size="sm" ms="auto" onClick={details.onOpen}>
          Details
        </Button>
      </Flex>
      {details.isOpen && <RelayLivenessDetailsModal isOpen onClose={details.onClose} />}
    </>
  );
}

function LocalStateBadge({ url }: { url: string }) {
  const state = use$(() => liveness.local.state(url), [url]);

  if (!state) return <Text color="GrayText">-</Text>;
  if (state.state === "dead")
    return (
      <Flex gap="2" alignItems="center">
        <Badge colorScheme="red">Dead</Badge>
        <Button size="xs" variant="link" colorScheme="orange" onClick={() => liveness.local.revive(url)}>
          Revive
        </Button>
      </Flex>
    );
  if (state.state === "offline") return <Badge colorScheme="orange">Retrying</Badge>;
  return <Badge colorScheme="green">Online</Badge>;
}

function LastConnected({ url }: { url: string }) {
  const state = use$(() => liveness.local.state(url), [url]);

  if (!state?.lastSuccessTime) return <Text color="GrayText">Never</Text>;
  return <Text>{dayjs(state.lastSuccessTime).fromNow()}</Text>;
}

function RemoteStateBadge({ url }: { url: string }) {
  const state = use$(() => liveness.remote$.pipe(switchMap((remote) => remote?.state(url) ?? of(undefined))), [url]);

  if (!state || state.state === "unknown") return <Text color="GrayText">-</Text>;
  if (state.state === "offline") return <Badge colorScheme="red">Offline</Badge>;
  return <Badge colorScheme="green">Online</Badge>;
}

function RelayLivenessDetailsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const localEnabled = use$(localSettings.localRelayLiveness);
  const remote = use$(liveness.remote$);
  const relays = use$(knownRelays$);
  const skipped = use$(liveness.unhealthy$);
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const skippedSet = new Set(skipped);

    return (relays ?? [])
      .filter((url) => !query || url.toLowerCase().includes(query))
      .sort((a, b) => Number(skippedSet.has(b)) - Number(skippedSet.has(a)) || a.localeCompare(b));
  }, [relays, skipped, search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Relay status</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" pt="0" pb="4" display="flex" flexDirection="column" gap="2">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon />
            </InputLeftElement>
            <Input placeholder="Search relays" value={search} onChange={(e) => setSearch(e.target.value)} />
          </InputGroup>

          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Relay</Th>
                  {localEnabled && <Th>This device</Th>}
                  {localEnabled && <Th>Last connected</Th>}
                  {remote && <Th>Monitors</Th>}
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sorted.map((url) => (
                  <Tr key={url}>
                    <Td>
                      <Flex gap="2" alignItems="center">
                        <RelayFavicon relay={url} size="xs" />
                        <RelayLink relay={url} isTruncated maxW="md" />
                      </Flex>
                    </Td>
                    {localEnabled && (
                      <Td>
                        <LocalStateBadge url={url} />
                      </Td>
                    )}
                    {localEnabled && (
                      <Td>
                        <LastConnected url={url} />
                      </Td>
                    )}
                    {remote && (
                      <Td>
                        <RemoteStateBadge url={url} />
                      </Td>
                    )}
                    <Td>{skipped?.includes(url) ? <Badge colorScheme="red">Skipped</Badge> : <Text>In use</Text>}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
