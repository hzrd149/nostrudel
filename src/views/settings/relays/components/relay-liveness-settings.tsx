import {
  Button,
  Checkbox,
  Code,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Switch,
  Text,
} from "@chakra-ui/react";
import { RelayMonitor } from "applesauce-common/casts";
import { isValidRelayMonitorAnnouncement, RELAY_MONITOR_ANNOUNCEMENT_KIND } from "applesauce-common/helpers";
import { castEvent, mapEventsToStore } from "applesauce-core";
import { use$ } from "applesauce-react/hooks";
import { useMemo } from "react";
import { map, of, switchMap } from "rxjs";

import NipLink from "../../../../components/nip-link";
import RelayName from "../../../../components/relay/relay-name";
import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import { MAX_LIVENESS_MONITORS, NIP66_MONITOR_RELAYS } from "../../../../const";
import { eventStore } from "../../../../services/event-store";
import pool from "../../../../services/pool";
import localSettings from "../../../../services/preferences";
import liveness from "../../../../services/relay-liveness";

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
      {localEnabled && <LocalUnhealthyRelays />}

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
      <RemoteUnhealthyRelays />
    </Flex>
  );
}

function LocalUnhealthyRelays() {
  const unhealthy = use$(liveness.local.unhealthy$) ?? [];

  return unhealthy.map((url) => <LocalRelayState key={url} url={url} />);
}

function LocalRelayState({ url }: { url: string }) {
  const state = use$(() => liveness.local.state(url), [url]);

  return (
    <Flex gap="2" pl="2" alignItems="center">
      <Text isTruncated>
        <RelayName relay={url} />
      </Text>
      <Code>{state?.state === "dead" ? "dead" : "backoff"}</Code>
      {state?.state === "dead" && (
        <Button size="sm" colorScheme="orange" variant="link" onClick={() => liveness.local.revive(url)} ms="auto">
          Revive
        </Button>
      )}
    </Flex>
  );
}

function RemoteUnhealthyRelays() {
  const unhealthy = use$(() => liveness.remote$.pipe(switchMap((remote) => remote?.unhealthy$ ?? of([]))), []) ?? [];

  return unhealthy.map((url) => (
    <Flex key={url} gap="2" pl="2" alignItems="center">
      <Text isTruncated>
        <RelayName relay={url} />
      </Text>
      <Code>offline</Code>
    </Flex>
  ));
}

function RelayMonitorPicker() {
  const selected = use$(localSettings.relayLivenessMonitors);
  const errors =
    use$(() => liveness.remote$.pipe(switchMap((remote) => remote?.errors$ ?? of<Record<string, string>>({}))), []) ??
    {};

  use$(
    () =>
      pool
        .request(NIP66_MONITOR_RELAYS, [{ kinds: [RELAY_MONITOR_ANNOUNCEMENT_KIND] }])
        .pipe(mapEventsToStore(eventStore)),
    [],
  );
  const monitors = use$(
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

  // Keep selected monitors visible even before their announcements load
  const pubkeys = useMemo(
    () => Array.from(new Set([...selected, ...(monitors ?? []).map((monitor) => monitor.event.pubkey)])),
    [selected, monitors],
  );

  const toggle = (pubkey: string) => {
    if (selected.includes(pubkey)) localSettings.relayLivenessMonitors.next(selected.filter((p) => p !== pubkey));
    else localSettings.relayLivenessMonitors.next([...selected, pubkey]);
  };

  return pubkeys.map((pubkey) => {
    const monitor = monitors?.find((m) => m.event.pubkey === pubkey);
    const isSelected = selected.includes(pubkey);

    return (
      <Flex key={pubkey} gap="2" pl="2" alignItems="center">
        <Checkbox
          isChecked={isSelected}
          isDisabled={!isSelected && selected.length >= MAX_LIVENESS_MONITORS}
          onChange={() => toggle(pubkey)}
        />
        <UserAvatar pubkey={pubkey} size="sm" />
        <Flex direction="column" overflow="hidden">
          <UserName pubkey={pubkey} isTruncated />
          {monitor && <MonitorDetails monitor={monitor} />}
          {errors[pubkey] && (
            <Text fontSize="sm" color="red.500" isTruncated>
              {errors[pubkey]}
            </Text>
          )}
        </Flex>
      </Flex>
    );
  });
}

function MonitorDetails({ monitor }: { monitor: RelayMonitor }) {
  const frequency = monitor.frequency;
  const parts = [
    frequency
      ? `every ${frequency >= 3600 ? `${Math.round(frequency / 3600)}h` : `${Math.round(frequency / 60)}m`}`
      : undefined,
    monitor.checks.length > 0 ? `checks ${monitor.checks.join(", ")}` : undefined,
  ].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <Text fontSize="sm" color="GrayText" isTruncated>
      {parts.join(" · ")}
    </Text>
  );
}
