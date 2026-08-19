import { addSeenRelay, getSeenRelays, relaySet } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { onlyEvents } from "applesauce-relay";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { defaultIfEmpty, map, of, scan } from "rxjs";

import { getNappletHistoryFilter } from "../helpers/nostr/napplets";
import pool from "../services/pool";
import { useReadRelays } from "./use-client-relays";
import useUserMailboxes from "./use-user-mailboxes";

/**
 * Queries all of a user's relays (plus the relays the manifest itself was seen on — the
 * relay that served a napplet is the relay most likely to still hold its older versions)
 * for every historical version of a napplet manifest's replaceable/addressable coordinate.
 * Deduplication is disabled on the pool request (`eventStore: null`) so relays that retain
 * overwritten versions can return more than the newest one; routing through the event store
 * would collapse replaceable events to the newest one and silently return a single version.
 *
 * `versions` is `undefined` while the initial request is in flight, and a (possibly empty)
 * array sorted newest-first once it resolves. Relay hints are unioned onto each event via
 * `getSeenRelays`.
 */
export default function useNappletHistory(event?: NostrEvent) {
  const mailboxes = useUserMailboxes(event?.pubkey);
  const additionalRelays = useMemo(
    () => relaySet(mailboxes?.inboxes, mailboxes?.outboxes, event ? getSeenRelays(event) : undefined),
    [mailboxes, event],
  );
  const relays = useReadRelays(additionalRelays);

  const versions = use$(() => {
    if (!event) return of([] as NostrEvent[]);

    const filter = getNappletHistoryFilter(event);
    if (!filter) return of([] as NostrEvent[]);

    return pool.request(relays, [filter], { eventStore: null }).pipe(
      onlyEvents(),
      scan((found, e) => {
        const existing = found.get(e.id);
        const seen = getSeenRelays(e);
        if (existing) {
          if (seen) for (const relay of seen) addSeenRelay(existing, relay);
        } else {
          found.set(e.id, e);
        }
        return found;
      }, new Map<string, NostrEvent>()),
      map((found) => Array.from(found.values()).sort((a, b) => b.created_at - a.created_at)),
      defaultIfEmpty([]),
    );
  }, [event?.id, relays.join(",")]);

  return { versions, relays };
}
