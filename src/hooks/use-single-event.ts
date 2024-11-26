import { useEffect } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { Queries } from "applesauce-core";

import singleEventService from "../services/single-event";
import { useReadRelays } from "./use-client-relays";

export default function useSingleEvent(id?: string, additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);

  useEffect(() => {
    if (id) singleEventService.requestEvent(id, readRelays);
  }, [id, readRelays.urls.join("|")]);

  return useStoreQuery(Queries.SingleEventQuery, id ? [id] : undefined);
}
