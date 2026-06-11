import { addSeenRelay, getSeenRelays, relaySet } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { onlyEvents } from "applesauce-relay";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { defaultIfEmpty, map, of, scan } from "rxjs";

import { getListHistoryFilter, sortVersions } from "../helpers/nostr/list-history";
import pool from "../services/pool";
import { useReadRelays } from "./use-client-relays";
import useUserMailboxes from "./use-user-mailboxes";

/** Extra relays that are known to keep historical versions of replaceable events */
export const LIST_HISTORY_RELAYS = ["wss://relay.ditto.pub/"];

/**
 * Queries all of a user's relays (plus extra history relays) for every historical
 * version of a replaceable list event. Deduplication is disabled on the pool request
 * (`eventStore: null`) so older overwritten versions are returned instead of only the
 * newest one.
 *
 * Returns `undefined` while the initial request is in flight, then a (possibly empty)
 * array of events sorted newest-first. Relay hints are on each event via `getSeenRelays`.
 */
export default function useListHistory(list?: NostrEvent) {
  const mailboxes = useUserMailboxes(list?.pubkey);
  const additionalRelays = useMemo(
    () => relaySet(mailboxes?.inboxes, mailboxes?.outboxes, LIST_HISTORY_RELAYS),
    [mailboxes],
  );
  const relays = useReadRelays(additionalRelays);

  const versions = use$(() => {
    if (!list) return of([] as NostrEvent[]);

    const filter = getListHistoryFilter(list);

    return pool.request(relays, [filter], { eventStore: null }).pipe(
      onlyEvents(),
      scan((found, event) => {
        const existing = found.get(event.id);
        const seen = getSeenRelays(event);
        if (existing) {
          if (seen) for (const relay of seen) addSeenRelay(existing, relay);
        } else {
          found.set(event.id, event);
        }
        return found;
      }, new Map<string, NostrEvent>()),
      map((found) => sortVersions(Array.from(found.values()))),
      defaultIfEmpty([]),
    );
  }, [list?.id, relays.join(",")]);

  return { versions, relays };
}
