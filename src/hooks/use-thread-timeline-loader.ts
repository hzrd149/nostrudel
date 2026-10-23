import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { unique } from "../helpers/array";
import { getThreadFilters, getThreadRoot, getThreadScopeKey, isExternalThreadScope } from "../helpers/nostr/thread";
import useTimelineLoader from "./use-timeline-loader";

/** Seed the shared store with NIP-10 replies and NIP-22 comments at every depth. */
export default function useThreadTimelineLoader(focusedEvent: NostrEvent | undefined, relays: Iterable<string>) {
  const root = useMemo(() => focusedEvent && getThreadRoot(focusedEvent), [focusedEvent]);
  const rootPointer = root && !isExternalThreadScope(root) ? root : undefined;
  const readRelays = useMemo(() => unique([...relays, ...(rootPointer?.relays ?? [])]), [relays, rootPointer]);
  const { loader } = useTimelineLoader(
    root ? `${getThreadScopeKey(root)}-thread` : "thread",
    readRelays,
    root ? getThreadFilters(root) : undefined,
  );

  return { root, rootPointer, loader };
}
