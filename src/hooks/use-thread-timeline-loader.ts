import { kinds as eventKinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { unique } from "../helpers/array";
import { getThreadReferences } from "../helpers/nostr/event";
import useTimelineLoader from "./use-timeline-loader";

/**
 * Seeds the event store with every event referencing a thread's root.
 *
 * Resolves the root pointer from the focused event (via NIP-10) and opens a
 * relay-side `#e` / `#q` subscription against it. Consumers should subscribe
 * to thread data through the event store (e.g. Note casts) rather than from
 * this hook — it intentionally only returns the root pointer and the loader
 * needed to drive infinite scroll.
 */
export default function useThreadTimelineLoader(
  focusedEvent: NostrEvent | undefined,
  relays: Iterable<string>,
  kinds?: number[],
) {
  const refs = focusedEvent && getThreadReferences(focusedEvent);
  const rootPointer = refs?.root?.e || (focusedEvent && { id: focusedEvent.id });

  const readRelays = useMemo(() => unique([...relays, ...(rootPointer?.relays ?? [])]), [relays, rootPointer?.relays]);

  const kindArr = kinds ? (kinds.length > 0 ? kinds : undefined) : [eventKinds.ShortTextNote];
  const timelineId = `${rootPointer?.id}-thread`;
  const { loader } = useTimelineLoader(
    timelineId,
    readRelays,
    rootPointer
      ? [
          { "#e": [rootPointer.id], kinds: kindArr },
          { "#q": [rootPointer.id], kinds: kindArr },
        ]
      : undefined,
  );

  return { rootPointer, loader };
}
