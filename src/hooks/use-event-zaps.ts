import { useMemo } from "react";

import eventZapsService from "../services/event-zaps";
import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";
import { getParsedZap } from "../helpers/nostr/zaps";

export default function useEventZaps(eventUID: string, additionalRelays?: Iterable<string>, alwaysRequest = true) {
  const readRelays = useReadRelays(additionalRelays);

  const subject = useMemo(
    () => eventZapsService.requestZaps(eventUID, readRelays, alwaysRequest),
    [eventUID, readRelays.urls.join("|"), alwaysRequest],
  );

  const events = useSubject(subject) || [];

  const zaps = useMemo(() => {
    const parsed = [];
    for (const zap of events) {
      const p = getParsedZap(zap);
      if (p) parsed.push(p);
    }
    return parsed;
  }, [events]);

  return zaps;
}
