import {
  Card,
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
  ModalProps,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { castUser, Profile, RelayMonitor } from "applesauce-common/casts";
import { isValidRelayMonitorAnnouncement, RELAY_MONITOR_ANNOUNCEMENT_KIND } from "applesauce-common/helpers";
import { castEvent, mapEventsToStore } from "applesauce-core";
import { kinds } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import dayjs from "dayjs";
import { nip19 } from "nostr-tools";
import { useMemo, useState } from "react";
import { ignoreElements, map, switchMap } from "rxjs";

import { SearchIcon } from "../../../../components/icons";
import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import { NIP66_MONITOR_RELAYS } from "../../../../const";
import {
  formatMonitorFrequency,
  getCountryFlag,
  getMonitorCountry,
  getMonitorExtraNetworks,
  getMonitorFriendlyChecks,
} from "../../../../helpers/nostr/relay-stats";
import { eventStore } from "../../../../services/event-store";
import pool from "../../../../services/pool";

/** Loads the monitor announcements from the monitor relays, most recently announced first */
export function useRelayMonitors(): RelayMonitor[] | undefined {
  use$(
    () =>
      pool
        .request(NIP66_MONITOR_RELAYS, [{ kinds: [RELAY_MONITOR_ANNOUNCEMENT_KIND] }])
        .pipe(mapEventsToStore(eventStore), ignoreElements()),
    [],
  );

  return use$(
    () =>
      eventStore
        .timeline({ kinds: [RELAY_MONITOR_ANNOUNCEMENT_KIND] })
        .pipe(
          map((events) =>
            events.filter(isValidRelayMonitorAnnouncement).map((event) => castEvent(event, RelayMonitor, eventStore)),
          ),
        ),
    [],
  );
}

/** Casts a monitor to a {@link User} and loads its profile from the monitor's outbox relays */
export function useMonitorProfile(pubkey: string): Profile | undefined {
  const user = useMemo(() => castUser(pubkey, eventStore), [pubkey]);

  use$(
    () => user.outboxes$.pipe(switchMap((outboxes) => user.replaceable(kinds.Metadata, undefined, outboxes))),
    [user],
  );

  return use$(user.profile$);
}

/** The location and report frequency of a monitor */
export function MonitorSummary({ monitor }: { monitor: RelayMonitor }) {
  const country = getMonitorCountry(monitor.event);
  const frequency = monitor.frequency;

  return (
    <Text fontSize="sm" color="GrayText" isTruncated>
      {[
        country && [country.code && getCountryFlag(country.code), country.name].filter(Boolean).join(" "),
        frequency !== undefined && `Checks ${formatMonitorFrequency(frequency)}`,
      ]
        .filter(Boolean)
        .join(" · ")}
    </Text>
  );
}

function matchesSearch(monitor: RelayMonitor, search: string) {
  const pubkey = monitor.event.pubkey;
  const event = eventStore.getReplaceable(kinds.Metadata, pubkey);
  const profile = event && castEvent(event, Profile, eventStore);
  const text = [
    profile?.displayName,
    profile?.name,
    profile?.about,
    monitor.event.content,
    getMonitorCountry(monitor.event)?.name,
    pubkey,
    nip19.npubEncode(pubkey),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes(search);
}

function MonitorOption({ monitor, inUse, onSelect }: { monitor: RelayMonitor; inUse: boolean; onSelect: () => void }) {
  const pubkey = monitor.event.pubkey;
  const profile = useMonitorProfile(pubkey);
  const description = monitor.event.content || profile?.about;
  const checks = getMonitorFriendlyChecks(monitor.checks);
  const networks = getMonitorExtraNetworks(monitor.event);

  return (
    <Card
      as="button"
      variant="outline"
      p="3"
      gap="2"
      textAlign="start"
      disabled={inUse}
      opacity={inUse ? 0.5 : undefined}
      cursor={inUse ? "not-allowed" : "pointer"}
      onClick={onSelect}
      _hover={inUse ? undefined : { bg: "var(--chakra-colors-chakra-subtle-bg)" }}
    >
      <Flex gap="2" alignItems="center" w="full" overflow="hidden">
        <UserAvatar pubkey={pubkey} size="sm" />
        <Flex direction="column" overflow="hidden">
          <UserName pubkey={pubkey} isTruncated />
          <MonitorSummary monitor={monitor} />
        </Flex>
        {inUse && (
          <Text fontSize="sm" color="GrayText" ms="auto" flexShrink={0}>
            In use
          </Text>
        )}
      </Flex>
      {description && (
        <Text fontSize="sm" noOfLines={2}>
          {description}
        </Text>
      )}
      <Text fontSize="sm" color="GrayText">
        {[
          checks.length > 0 && `Tests ${checks.join(", ")}`,
          networks.length > 0 && `Includes ${networks.join(" & ")} relays`,
          `Active ${dayjs.unix(monitor.event.created_at).fromNow()}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>
    </Card>
  );
}

export default function RelayMonitorSelectModal({
  monitors,
  selected,
  onSelect,
  isOpen,
  onClose,
}: Omit<ModalProps, "children"> & {
  monitors?: RelayMonitor[];
  /** Monitors that are already in use and can not be picked again */
  selected: string[];
  onSelect: (pubkey: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? monitors?.filter((monitor) => matchesSearch(monitor, query)) : monitors;
  }, [monitors, search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Select relay monitor</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" pt="0" pb="4" display="flex" flexDirection="column" gap="2">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon />
            </InputLeftElement>
            <Input
              placeholder="Search by name or country"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </InputGroup>

          {!monitors?.length && <Spinner mx="auto" />}
          {monitors?.length && filtered?.length === 0 ? (
            <Text color="GrayText" textAlign="center">
              No monitors match "{search}"
            </Text>
          ) : null}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="2">
            {filtered?.map((monitor) => {
              const pubkey = monitor.event.pubkey;
              const inUse = selected.includes(pubkey);

              return (
                <MonitorOption
                  key={pubkey}
                  monitor={monitor}
                  inUse={inUse}
                  onSelect={() => {
                    if (inUse) return;
                    onSelect(pubkey);
                    onClose();
                  }}
                />
              );
            })}
          </SimpleGrid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
