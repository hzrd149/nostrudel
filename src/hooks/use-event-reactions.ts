import { useEffect } from "react";
import { NostrEvent } from "nostr-tools";
import { getEventUID } from "applesauce-core/helpers";
import { useStoreQuery } from "applesauce-react/hooks";
import { ReactionsQuery } from "applesauce-core/queries";

import eventReactionsService from "../services/event-reactions";
import { useReadRelays } from "./use-client-relays";

export default function useEventReactions(
  event: NostrEvent,
  additionalRelays?: Iterable<string>,
  alwaysRequest = true,
) {
  const relays = useReadRelays(additionalRelays);

  useEffect(() => {
    eventReactionsService.requestReactions(getEventUID(event), relays, alwaysRequest);
  }, [event, relays, alwaysRequest]);

  return useStoreQuery(ReactionsQuery, [event]);
}
