import { Flex, Text } from "@chakra-ui/react";
import { mapEventsToStore } from "applesauce-core";
import { buildCommonEventRelationFilters } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { onlyEvents } from "applesauce-relay";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { useReadRelays } from "../../../hooks/use-client-relays";
import { useUserInbox } from "../../../hooks/use-user-mailboxes";
import { eventStore } from "../../../services/event-store";
import pool from "../../../services/pool";
import EmbeddedUnknown from "../../embed-event/card/embedded-unknown";

export default function DebugEventReferencesPage({ event }: { event: NostrEvent }) {
  const inbox = useUserInbox(event.pubkey);
  const relays = useReadRelays(inbox);

  const filters = useMemo(() => buildCommonEventRelationFilters({}, event), [event]);

  // Start a live subscription to the event store for the event references
  use$(() => pool.subscription(relays, filters).pipe(onlyEvents(), mapEventsToStore(eventStore)), [relays, filters]);

  // Get the events from the event store
  const events = use$(() => eventStore.timeline(filters), [filters]) ?? [];

  return (
    <Flex direction="column" gap="2" maxH="70vh" overflowY="auto" pr="1">
      {events.length === 0 ? (
        <Text color="GrayText" fontSize="sm">
          {inbox === undefined ? "Looking up inbox relays..." : "No references found yet."}
        </Text>
      ) : (
        events.map((e) => <EmbeddedUnknown key={e.id} event={e} />)
      )}
    </Flex>
  );
}
