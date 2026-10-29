import { mapEventsToStore } from "applesauce-core";
import { use$, useEventStore } from "applesauce-react/hooks";
import { ignoreElements } from "rxjs";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import ignoreRelayErrors from "../helpers/ignore-relay-errors";
import { unique } from "../helpers/array";
import { getThreadFilters, getThreadRoot, getThreadScopeKey, isExternalThreadScope } from "../helpers/nostr/thread";
import pool from "../services/pool";
import useTimelineLoader from "./use-timeline-loader";
import { useUserInbox } from "./use-user-mailboxes";

/** Seed the shared store with NIP-10 replies and NIP-22 comments at every depth. */
export default function useThreadTimelineLoader(focusedEvent: NostrEvent | undefined, relays: Iterable<string>) {
  const store = useEventStore();
  const inboxes = useUserInbox(focusedEvent?.pubkey);
  const root = useMemo(() => focusedEvent && getThreadRoot(focusedEvent), [focusedEvent]);
  const rootPointer = root && !isExternalThreadScope(root) ? root : undefined;
  const readRelays = useMemo(
    () => unique([...relays, ...(inboxes ?? []), ...(rootPointer?.relays ?? [])]),
    [relays, inboxes, rootPointer],
  );
  const { loader } = useTimelineLoader(
    root ? `${getThreadScopeKey(root)}-thread` : "thread",
    readRelays,
    root ? getThreadFilters(root) : undefined,
  );

  // Historical pagination and live updates both feed the same store-backed models.
  use$(() => {
    if (!focusedEvent || !root || readRelays.length === 0) return undefined;
    return pool
      .subscription(readRelays, [
        { "#e": [focusedEvent.id], limit: 100 },
        { "#q": [focusedEvent.id], limit: 100 },
        ...getThreadFilters(root).map((filter) => ({ ...filter, limit: 100 })),
      ])
      .pipe(ignoreRelayErrors("Thread replies"), mapEventsToStore(store), ignoreElements());
  }, [focusedEvent?.id, root, readRelays, store]);

  return { root, rootPointer, loader };
}
