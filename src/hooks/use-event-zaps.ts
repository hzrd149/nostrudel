import { useEffect, useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { parseCoordinate } from "applesauce-core/helpers";
import { EventZapsQuery } from "applesauce-core/queries";

import eventZapsService from "../services/event-zaps";
import { useReadRelays } from "./use-client-relays";

export default function useEventZaps(uid: string, additionalRelays?: Iterable<string>, alwaysRequest = false) {
  const readRelays = useReadRelays(additionalRelays);

  useEffect(() => {
    eventZapsService.requestZaps(uid, readRelays, alwaysRequest);
  }, [uid, readRelays.urls.join("|"), alwaysRequest]);

  const pointer = useMemo(() => {
    if (uid.includes(":")) return parseCoordinate(uid, true);
    return uid;
  }, [uid]);

  return useStoreQuery(EventZapsQuery, pointer ? [pointer] : undefined) ?? [];
}
