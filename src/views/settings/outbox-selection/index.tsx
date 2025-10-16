import {
  Accordion,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Link,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from "@chakra-ui/react";
import { includeMailboxes } from "applesauce-core";
import { groupPubkeysByRelay } from "applesauce-core/helpers";
import { selectOptimalRelays } from "applesauce-core/helpers/relay-selection";
import { useActiveAccount, useObservableEagerState, useObservableState } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo } from "react";
import { NEVER, shareReplay, throttleTime } from "rxjs";

import { ignoreUnhealthyRelaysOnPointers } from "applesauce-relay";
import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import RouterLink from "../../../components/router-link";
import { eventStore } from "../../../services/event-store";
import { liveness } from "../../../services/pool";
import localSettings from "../../../services/preferences";
import FallbackRelaySettings from "../relays/components/fallback-relay-settings";
import MissingRelaysRow from "./components/missing-relays-row";
import OrphanedUsersRow from "./components/orphaned-users-row";
import RelayCountRow from "./components/relay-count-row";
import SelectRelayRow from "./components/selected-relay-row";

function UsersByRelayCount({
  selection,
  contacts,
}: {
  selection: ProfilePointer[] | null | undefined;
  contacts: ProfilePointer[] | null | undefined;
}) {
  // Calculate missing relays users - users who never had any relays (no NIP-65 relay list)
  const missingRelaysUsers = useMemo(() => {
    if (!contacts || !selection) return [];

    const originalMap = new Map(contacts.map((user) => [user.pubkey, user]));

    return selection.filter((selectedUser) => {
      const originalUser = originalMap.get(selectedUser.pubkey);
      const hasNoRelaysInOriginal = !originalUser?.relays || originalUser.relays.length === 0;
      const hasNoRelaysInSelected = !selectedUser.relays || selectedUser.relays.length === 0;

      return hasNoRelaysInOriginal && hasNoRelaysInSelected;
    });
  }, [contacts, selection]);

  // Calculate orphaned users - users who had relays originally but have none after selection
  const orphanedUsers = useMemo(() => {
    if (!contacts || !selection) return [];

    const selectedMap = new Map(selection.map((user) => [user.pubkey, user]));

    return contacts.filter((originalUser) => {
      const hasOriginalRelays = originalUser.relays && originalUser.relays.length > 0;
      const selectedUser = selectedMap.get(originalUser.pubkey);
      const hasSelectedRelays = selectedUser?.relays && selectedUser.relays.length > 0;

      return hasOriginalRelays && !hasSelectedRelays;
    });
  }, [contacts, selection]);

  // Group users by relay count - always call this hook
  const usersByRelayCount = useMemo(() => {
    if (!selection) return {};

    const groups: { [relayCount: number]: ProfilePointer[] } = {};

    selection.forEach((user) => {
      const relayCount = user.relays?.length || 0;
      if (!groups[relayCount]) groups[relayCount] = [];

      groups[relayCount].push(user);
    });

    // Sort users within each group by pubkey for consistent ordering
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => a.pubkey.localeCompare(b.pubkey));
    });

    return groups;
  }, [selection]);

  // Sort relay counts ascending (users with least relays first) - always call this hook
  const sortedRelayCounts = useMemo(() => {
    return Object.keys(usersByRelayCount)
      .map(Number)
      .sort((a, b) => a - b);
  }, [usersByRelayCount]);

  if (!selection) return null;

  return (
    <Accordion allowToggle>
      <MissingRelaysRow users={missingRelaysUsers} />
      <OrphanedUsersRow users={orphanedUsers} />
      {sortedRelayCounts
        .filter((relayCount) => relayCount > 0) // Exclude 0 relay count since we handle it separately
        .map((relayCount) => (
          <RelayCountRow key={relayCount} relayCount={relayCount} users={usersByRelayCount[relayCount]} />
        ))}
    </Accordion>
  );
}

function ConnectionSettings() {
  const maxConnections = useObservableEagerState(localSettings.maxConnections);
  const maxRelaysPerUser = useObservableEagerState(localSettings.maxRelaysPerUser);

  return (
    <Flex gap={4} wrap="wrap">
      <FormControl maxW="sm">
        <FormLabel>Max Connections</FormLabel>
        <NumberInput
          min={0}
          max={30}
          value={maxConnections}
          onChange={(_, value) => localSettings.maxConnections.next(value)}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <FormHelperText>
          The maximum number of relay connections the app should make when fetching events by users.
        </FormHelperText>
      </FormControl>

      <FormControl maxW="sm">
        <FormLabel>Max Relays Per User</FormLabel>
        <NumberInput
          min={0}
          max={30}
          value={maxRelaysPerUser}
          onChange={(_, value) => localSettings.maxRelaysPerUser.next(value)}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <FormHelperText>The maximum number of relays that can be selected for a user.</FormHelperText>
      </FormControl>
    </Flex>
  );
}

export default function OutboxSelectionSettings() {
  const account = useActiveAccount();
  const maxConnections = useObservableEagerState(localSettings.maxConnections);
  const maxRelaysPerUser = useObservableEagerState(localSettings.maxRelaysPerUser);

  // Create an observable for adding relays to the contacts
  const outboxes$ = useMemo(
    () =>
      account?.pubkey
        ? eventStore.contacts(account.pubkey).pipe(
            // Load the NIP-65 outboxes for all contacts
            includeMailboxes(eventStore),
            // Watch the blacklist and ignore relays
            ignoreUnhealthyRelaysOnPointers(liveness),
            // Only recalculate every 200ms
            throttleTime(200),
            // Only calculate it once
            shareReplay(1),
          )
        : NEVER,
    [account?.pubkey, eventStore],
  );

  const original = useObservableState(outboxes$);

  // Get grouped outbox data
  const selection = useMemo(() => {
    if (!original) return [];

    console.info("Selecting optimal relays", original.length);
    return selectOptimalRelays(original, { maxConnections, maxRelaysPerUser });
  }, [original, maxConnections, maxRelaysPerUser]);

  const outboxMap = useMemo(() => selection && groupPubkeysByRelay(selection), [selection]);

  const sortedRelays = outboxMap ? Object.entries(outboxMap).sort(([, a], [, b]) => b.length - a.length) : [];

  return (
    <SimpleView title="Outbox Selection" maxW="6xl">
      {/* Settings */}
      <ConnectionSettings />

      {/* Relays Accordion */}
      <ErrorBoundary>
        <Heading size="md" mt={4}>
          Selected relays for {selection?.length} contacts
        </Heading>
        <Text color="GrayText">
          What relays are selected for each contact in your{" "}
          <Link as={RouterLink} to="/lists/following" color="blue.500">
            contact list
          </Link>
          .
        </Text>
        {sortedRelays.length === 0 ? (
          <Text textAlign="center" py={12} color="gray.500">
            {account ? "Loading..." : "Please log in to view relay data"}
          </Text>
        ) : (
          <Accordion allowToggle>
            {sortedRelays.map(([relay, users]) => (
              <SelectRelayRow key={relay} relay={relay} users={users} totalUsers={selection?.length || 0} />
            ))}
          </Accordion>
        )}
      </ErrorBoundary>

      {/* Users by Relay Count Report */}
      <ErrorBoundary>
        <Heading size="md" mt={4}>
          Users by Relay Count
        </Heading>
        <Text color="GrayText">All users grouped by how many relays have been selected for them.</Text>
        <UsersByRelayCount selection={selection} contacts={original} />
      </ErrorBoundary>

      <FallbackRelaySettings />
    </SimpleView>
  );
}
