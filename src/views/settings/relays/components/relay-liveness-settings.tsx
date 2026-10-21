import {
  Button,
  Card,
  Code,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  IconButton,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { RelayMonitor } from "applesauce-common/casts";
import { use$ } from "applesauce-react/hooks";
import { useState } from "react";
import { of, switchMap } from "rxjs";

import { AddIcon, TrashIcon } from "../../../../components/icons";
import NipLink from "../../../../components/nip-link";
import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import { MAX_LIVENESS_MONITORS } from "../../../../const";
import useAsyncAction from "../../../../hooks/use-async-action";
import localSettings from "../../../../services/preferences";
import liveness from "../../../../services/relay-liveness";
import {
  publishRelayMonitors,
  relayMonitorSyncStatus$,
  setRelayLivenessMonitors,
  unlockRelayMonitors,
} from "../../../../services/relay-monitor-sync";
import RelayLivenessStatus from "./relay-liveness-status";
import RelayMonitorSelectModal, {
  MonitorSummary,
  useMonitorProfile,
  useRelayMonitors,
} from "./relay-monitor-select-modal";

export default function RelayLivenessSettings() {
  const localEnabled = use$(localSettings.localRelayLiveness);

  return (
    <Flex direction="column" gap="2">
      <Heading size="md" mt="4">
        Relay Liveness
      </Heading>
      <Text color="GrayText">Relays that are known to be offline are skipped when loading and publishing events.</Text>

      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="localRelayLiveness" mb="0">
            Track relay connections
          </FormLabel>
          <Switch
            id="localRelayLiveness"
            isChecked={localEnabled}
            onChange={() => localSettings.localRelayLiveness.next(!localEnabled)}
          />
        </Flex>
        <FormHelperText>
          Relays that repeatedly fail to connect from this device are backed off and eventually marked as{" "}
          <Code>dead</Code>.
        </FormHelperText>
      </FormControl>

      <Heading size="sm" mt="2">
        Remote monitors
      </Heading>
      <Text color="GrayText">
        Use the reports of up to {MAX_LIVENESS_MONITORS}{" "}
        <NipLink nip={66} color="blue.500">
          NIP-66
        </NipLink>{" "}
        relay monitors. A relay is only skipped when all selected monitors report it offline.
      </Text>
      <RelayMonitorPicker />
      <RelayMonitorSyncStatus />
      <RelayLivenessStatus />
    </Flex>
  );
}

function RelayMonitorSyncStatus() {
  const status = use$(relayMonitorSyncStatus$);
  const unlock = useAsyncAction(unlockRelayMonitors);
  const sync = useAsyncAction(publishRelayMonitors);

  switch (status) {
    case "locked":
      return (
        <Flex gap="2" alignItems="center">
          <Text color="GrayText">Your synced monitors are encrypted.</Text>
          <Button size="sm" variant="link" colorScheme="primary" onClick={unlock.run} isLoading={unlock.loading}>
            Unlock
          </Button>
        </Flex>
      );
    case "unsynced":
      return (
        <Flex gap="2" alignItems="center">
          <Text color="GrayText">These monitors are only saved on this device.</Text>
          <Button size="sm" variant="link" colorScheme="primary" onClick={sync.run} isLoading={sync.loading}>
            Sync to account
          </Button>
        </Flex>
      );
    case "syncing":
      return (
        <Flex gap="2" alignItems="center">
          <Spinner size="xs" />
          <Text color="GrayText">Syncing monitors...</Text>
        </Flex>
      );
    case "synced":
      return <Text color="GrayText">Synced privately across your devices.</Text>;
    default:
      return null;
  }
}

function RelayMonitorPicker() {
  const selected = use$(localSettings.relayLivenessMonitors);
  const errors =
    use$(() => liveness.remote$.pipe(switchMap((remote) => remote?.errors$ ?? of<Record<string, string>>({}))), []) ??
    {};
  const monitors = useRelayMonitors();
  const modal = useDisclosure();
  const [slot, setSlot] = useState(0);

  const { run: setMonitor } = useAsyncAction(
    async (index: number, pubkey?: string) => {
      const next = [...selected];
      if (pubkey) next[index] = pubkey;
      else next.splice(index, 1);
      await setRelayLivenessMonitors(next.filter(Boolean));
    },
    [selected],
  );

  const slots = Array.from({ length: MAX_LIVENESS_MONITORS }, (_, i) => selected[i] as string | undefined);

  return (
    <>
      <SimpleGrid columns={{ base: 1, md: MAX_LIVENESS_MONITORS }} gap="2">
        {slots.map((pubkey, i) => (
          <RelayMonitorCard
            key={pubkey ?? `empty-${i}`}
            pubkey={pubkey}
            monitor={pubkey ? monitors?.find((m) => m.event.pubkey === pubkey) : undefined}
            error={pubkey ? errors[pubkey] : undefined}
            onSelect={() => {
              setSlot(i);
              modal.onOpen();
            }}
            onRemove={() => setMonitor(i)}
          />
        ))}
      </SimpleGrid>
      {modal.isOpen && (
        <RelayMonitorSelectModal
          isOpen
          onClose={modal.onClose}
          monitors={monitors}
          selected={selected}
          onSelect={(pubkey) => setMonitor(slot, pubkey)}
        />
      )}
    </>
  );
}

function RelayMonitorCard({
  pubkey,
  monitor,
  error,
  onSelect,
  onRemove,
}: {
  pubkey?: string;
  monitor?: RelayMonitor;
  error?: string;
  onSelect: () => void;
  onRemove: () => void;
}) {
  if (!pubkey)
    return (
      <Card
        as="button"
        variant="outline"
        borderStyle="dashed"
        p="4"
        minH="20"
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap="2"
        color="GrayText"
        onClick={onSelect}
        _hover={{ bg: "var(--chakra-colors-chakra-subtle-bg)" }}
      >
        <AddIcon boxSize={5} />
        <Text>Select monitor</Text>
      </Card>
    );

  return (
    <SelectedMonitorCard pubkey={pubkey} monitor={monitor} error={error} onSelect={onSelect} onRemove={onRemove} />
  );
}

function SelectedMonitorCard({
  pubkey,
  monitor,
  error,
  onSelect,
  onRemove,
}: {
  pubkey: string;
  monitor?: RelayMonitor;
  error?: string;
  onSelect: () => void;
  onRemove: () => void;
}) {
  useMonitorProfile(pubkey);

  return (
    <Card
      variant="outline"
      p="4"
      minH="20"
      display="flex"
      flexDirection="row"
      alignItems="center"
      gap="2"
      cursor="pointer"
      onClick={onSelect}
      _hover={{ bg: "var(--chakra-colors-chakra-subtle-bg)" }}
    >
      <UserAvatar pubkey={pubkey} size="md" />
      <Flex direction="column" overflow="hidden" gap="1">
        <UserName pubkey={pubkey} fontWeight="bold" isTruncated />
        {monitor && <MonitorSummary monitor={monitor} />}
        {error && (
          <Text fontSize="sm" color="red.500" isTruncated>
            {error}
          </Text>
        )}
      </Flex>
      <IconButton
        icon={<TrashIcon />}
        aria-label="Remove monitor"
        size="sm"
        variant="ghost"
        colorScheme="red"
        ms="auto"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      />
    </Card>
  );
}
