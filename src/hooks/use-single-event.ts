import { useEffect, useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { EventPointer } from "nostr-tools/nip19";
import { mergeRelaySets } from "applesauce-core/helpers";
import { Queries } from "applesauce-core";

import singleEventLoader from "../services/single-event-loader";
import { useReadRelays } from "./use-client-relays";

export default function useSingleEvent(id?: string | EventPointer, additionalRelays?: Iterable<string>) {
  const pointer = useMemo(() => (typeof id === "string" ? { id } : id), [id]);
  const readRelays = useReadRelays();

  useEffect(() => {
    if (pointer)
      singleEventLoader.next({
        id: pointer.id,
        relays: mergeRelaySets(pointer.relays, readRelays, additionalRelays),
      });
  }, [pointer?.id, readRelays.join("|"), additionalRelays]);

  return useStoreQuery(Queries.SingleEventQuery, pointer ? [pointer.id] : undefined);
}
