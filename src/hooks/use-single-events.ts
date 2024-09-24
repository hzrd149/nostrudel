import { useEffect, useMemo } from "react";

import singleEventService from "../services/single-event";
import { useReadRelays } from "./use-client-relays";
import { eventStore } from "../services/event-store";
import { useObservable } from "./use-observable";

export default function useSingleEvents(ids?: string[], additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);
  useEffect(() => {
    if (!ids) return;

    for (const id of ids) {
      singleEventService.requestEvent(id, readRelays);
    }
  }, [ids, readRelays.urls.join("|")]);

  const observable = useMemo(() => (ids ? eventStore.timeline([{ ids }]) : undefined), [ids?.join("|")]);
  return useObservable(observable) ?? [];
}
