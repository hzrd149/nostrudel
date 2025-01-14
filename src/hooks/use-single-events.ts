import { useEffect } from "react";
import { Queries } from "applesauce-core";
import { useStoreQuery } from "applesauce-react/hooks";

import singleEventLoader from "../services/single-event-loader";
import { useReadRelays } from "./use-client-relays";

export default function useSingleEvents(ids?: string[], additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);
  useEffect(() => {
    if (!ids) return;

    for (const id of ids) {
      singleEventLoader.next({ id, relays: [...readRelays] });
    }
  }, [ids, readRelays.urls.join("|")]);

  return useStoreQuery(Queries.TimelineQuery, ids ? [{ ids }] : undefined) ?? [];
}
