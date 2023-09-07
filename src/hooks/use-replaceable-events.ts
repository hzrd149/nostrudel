import { useMemo } from "react";

import { useReadRelayUrls } from "./use-client-relays";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import { CustomEventPointer, parseCoordinate } from "../helpers/nostr/events";
import Subject from "../classes/subject";
import { NostrEvent } from "../types/nostr-event";
import useSubjects from "./use-subjects";

export default function useReplaceableEvents(
  coordinates: string[] | CustomEventPointer[] | undefined,
  additionalRelays: string[] = [],
  alwaysRequest = false,
) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const subs = useMemo(() => {
    if (!coordinates) return undefined;
    const subs: Subject<NostrEvent>[] = [];
    for (const cord of coordinates) {
      const parsed = typeof cord === "string" ? parseCoordinate(cord) : cord;
      if (!parsed) return;
      subs.push(
        replaceableEventLoaderService.requestEvent(
          parsed.relays ? [...readRelays, ...parsed.relays] : readRelays,
          parsed.kind,
          parsed.pubkey,
          parsed.identifier,
          alwaysRequest,
        ),
      );
    }
    return subs;
  }, [coordinates, readRelays.join("|")]);

  return useSubjects(subs);
}
