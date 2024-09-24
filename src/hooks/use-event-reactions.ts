import { NostrEvent } from "nostr-tools";
import { getEventUID } from "applesauce-core/helpers";

import eventReactionsService from "../services/event-reactions";
import { useReadRelays } from "./use-client-relays";
import { queryStore } from "../services/event-store";
import { useObservable } from "./use-observable";
import { useEffect } from "react";

export default function useEventReactions(
  event: NostrEvent,
  additionalRelays?: Iterable<string>,
  alwaysRequest = true,
) {
  const relays = useReadRelays(additionalRelays);

  useEffect(() => {
    eventReactionsService.requestReactions(getEventUID(event), relays, alwaysRequest);
  }, [event, relays, alwaysRequest]);

  const observable = queryStore.getReactions(event);
  return useObservable(observable);
}
