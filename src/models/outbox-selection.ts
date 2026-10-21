import { includeFallbackRelays, includeMailboxes } from "applesauce-core";
import { selectOptimalRelays } from "applesauce-core/helpers";
import { ignoreUnhealthyRelaysOnPointers } from "applesauce-relay";
import { ProfilePointer } from "nostr-tools/nip19";
import { combineLatestWith, debounceTime, map, MonoTypeOperatorFunction, pipe } from "rxjs";
import { eventStore } from "../services/event-store";
import liveness from "../services/relay-liveness";
import localSettings from "../services/preferences";

/** Include outboxes and remove unhealthy relays */
export function includeOutboxRelays(): MonoTypeOperatorFunction<ProfilePointer[]> {
  return pipe(
    // Add users outbox relays
    includeMailboxes(eventStore, "outbox"),
    // Get the extra relays
    includeFallbackRelays(localSettings.fallbackRelays),
    // Ignore unhealthy relays
    ignoreUnhealthyRelaysOnPointers(liveness),
  );
}

/** Default outbox relay selection for app  */
export function outboxSelection(): MonoTypeOperatorFunction<ProfilePointer[]> {
  return pipe(
    includeOutboxRelays(),
    // Get connection settings
    combineLatestWith(localSettings.maxConnections, localSettings.maxRelaysPerUser),
    // Wait for outboxes to be stable after 500ms
    debounceTime(500),
    // Select optimal relays
    map(([users, maxConnections, maxRelaysPerUser]) =>
      selectOptimalRelays(users, { maxConnections, maxRelaysPerUser }),
    ),
  );
}
