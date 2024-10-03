import { useEffect } from "react";

import singleEventService from "../services/single-event";
import { useReadRelays } from "./use-client-relays";
import { useStoreQuery } from "applesauce-react";
import { Queries } from "applesauce-core";

export default function useSingleEvent(id?: string, additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);

  useEffect(() => {
    if (id) singleEventService.requestEvent(id, readRelays);
  }, [id, readRelays.urls.join("|")]);

  return useStoreQuery(Queries.SingleEventQuery, id ? [id] : undefined);
}
