import { addSeenRelay, getSeenRelays, relaySet } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { onlyEvents } from "applesauce-relay";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { defaultIfEmpty, map, of, scan } from "rxjs";

import { NAPPLET_KIND_SNAPSHOT, getNappletHistoryFilter, getNappletSnapshotsFilter } from "../helpers/nostr/napplets";
import pool from "../services/pool";
import { useReadRelays } from "./use-client-relays";
import useUserMailboxes from "./use-user-mailboxes";

export type NappletVersions = {
  /** Replaceable manifest versions at the napplet's coordinate, newest first */
  versions: NostrEvent[];
  /** Immutable snapshot releases cut from that coordinate, newest first */
  snapshots: NostrEvent[];
};

const EMPTY: NappletVersions = { versions: [], snapshots: [] };

/**
 * Queries the author's relays (plus the relays the manifest itself was seen on — the relay
 * that served a napplet is the one most likely to still hold its older versions) for every
 * release of a napplet: the historical versions of its replaceable coordinate, and the
 * immutable snapshots cut from it.
 *
 * Deduplication is disabled on the pool request (`eventStore: null`) so relays that retain
 * overwritten versions can return more than the newest one; routing through the event store
 * would collapse replaceable events and silently yield a single version.
 *
 * Returns `undefined` while the initial request is in flight, so callers can tell "still
 * searching" apart from "nothing found". Pass no event to keep the query from running at all.
 */
export default function useNappletVersions(event?: NostrEvent) {
  const mailboxes = useUserMailboxes(event?.pubkey);
  const additionalRelays = useMemo(
    () => relaySet(mailboxes?.inboxes, mailboxes?.outboxes, event ? getSeenRelays(event) : undefined),
    [mailboxes, event],
  );
  const relays = useReadRelays(additionalRelays);

  const results = use$(() => {
    if (!event) return of(EMPTY);

    const filters = [getNappletHistoryFilter(event), getNappletSnapshotsFilter(event)].filter(
      (filter) => filter !== undefined,
    );
    if (filters.length === 0) return of(EMPTY);

    return pool.request(relays, filters, { eventStore: null }).pipe(
      onlyEvents(),
      // Relays each answer separately, so the same event arrives repeatedly — merge by id and
      // union the relay hints so every release lists all the relays that served it.
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
      map((found) => {
        const all = Array.from(found.values()).sort((a, b) => b.created_at - a.created_at);

        return {
          versions: all.filter((e) => e.kind !== NAPPLET_KIND_SNAPSHOT),
          snapshots: all.filter((e) => e.kind === NAPPLET_KIND_SNAPSHOT),
        } satisfies NappletVersions;
      }),
      defaultIfEmpty(EMPTY),
    );
  }, [event?.id, relays.join(",")]);

  return { versions: results?.versions, snapshots: results?.snapshots, loading: results === undefined, relays };
}
