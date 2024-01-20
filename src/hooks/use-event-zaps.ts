import { useMemo } from "react";

import eventZapsService from "../services/event-zaps";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";
import { parseZapEvent } from "../helpers/nostr/zaps";

export default function useEventZaps(eventUID: string, additionalRelays?: Iterable<string>, alwaysRequest = true) {
  const readRelays = useReadRelayUrls(additionalRelays);

  const subject = useMemo(
    () => eventZapsService.requestZaps(eventUID, readRelays, alwaysRequest),
    [eventUID, readRelays.urls.join("|"), alwaysRequest],
  );

  const events = useSubject(subject) || [];

  const zaps = useMemo(() => {
    const parsed = [];
    for (const zap of events) {
      try {
        parsed.push(parseZapEvent(zap));
      } catch (e) {}
    }
    return parsed;
  }, [events]);

  return zaps;
}
