import { useEffect, useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { parseCoordinate } from "applesauce-core/helpers";
import { EventZapsQuery } from "applesauce-core/queries";
import { requestZaps } from "../services/zaps-loader";

import { useReadRelays } from "./use-client-relays";

export default function useEventZaps(uid: string, additionalRelays?: Iterable<string>, force?: boolean) {
  const relay = useReadRelays(additionalRelays);

  useEffect(() => {
    requestZaps(uid, relay, force);
  }, [uid, relay.join("|"), force]);

  const pointer = useMemo(() => {
    if (uid.includes(":")) return parseCoordinate(uid, true);
    return uid;
  }, [uid]);

  return useStoreQuery(EventZapsQuery, pointer ? [pointer] : undefined) ?? [];
}
