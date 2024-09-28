import { useEffect } from "react";

import singleEventService from "../services/single-event";
import { useReadRelays } from "./use-client-relays";
import { queryStore } from "../services/event-store";
import { useObservable } from "./use-observable";

export default function useSingleEvent(id?: string, additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);

  useEffect(() => {
    if (id) singleEventService.requestEvent(id, readRelays);
  }, [id, readRelays.urls.join("|")]);

  const observable = id ? queryStore.event(id) : undefined;
  return useObservable(observable);
}
