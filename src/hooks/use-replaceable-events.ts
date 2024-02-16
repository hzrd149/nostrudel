import { useMemo } from "react";

import { useReadRelays } from "./use-client-relays";
import replaceableEventsService, { RequestOptions } from "../services/replaceable-events";
import { CustomAddressPointer, parseCoordinate } from "../helpers/nostr/events";
import Subject from "../classes/subject";
import { NostrEvent } from "../types/nostr-event";
import useSubjects from "./use-subjects";

export default function useReplaceableEvents(
  coordinates: string[] | CustomAddressPointer[] | undefined,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  const readRelays = useReadRelays(additionalRelays);
  const subs = useMemo(() => {
    if (!coordinates) return undefined;
    const subs: Subject<NostrEvent>[] = [];
    for (const cord of coordinates) {
      const parsed = typeof cord === "string" ? parseCoordinate(cord) : cord;
      if (!parsed) return;
      subs.push(
        replaceableEventsService.requestEvent(
          parsed.relays ? [...readRelays, ...parsed.relays] : readRelays,
          parsed.kind,
          parsed.pubkey,
          parsed.identifier,
          opts,
        ),
      );
    }
    return subs;
  }, [coordinates, readRelays.urls.join("|")]);

  return useSubjects(subs);
}
