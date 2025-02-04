import { useEffect } from "react";
import { NostrEvent } from "nostr-tools";
import { getEventUID } from "applesauce-core/helpers";
import { useStoreQuery } from "applesauce-react/hooks";
import { ReactionsQuery } from "applesauce-core/queries";

import { useReadRelays } from "./use-client-relays";
import { requestReactions } from "../services/event-reactions-loader";

export default function useEventReactions(event: NostrEvent, additionalRelays?: string[], force?: boolean) {
  const relays = useReadRelays(additionalRelays);

  useEffect(() => {
    requestReactions(getEventUID(event), relays, force);
  }, [event, relays.join(","), force]);

  return useStoreQuery(ReactionsQuery, [event]);
}
