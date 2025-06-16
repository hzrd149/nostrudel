import { useObservableMemo } from "applesauce-react/hooks";
import { Filter } from "nostr-tools";

import eventCountService from "../services/event-count";

export default function useEventCount(filter?: Filter | Filter[], alwaysRequest = false) {
  const key = filter ? eventCountService.stringifyFilter(filter) : "empty";
  return useObservableMemo(() => filter && eventCountService.requestCount(filter, alwaysRequest), [key, alwaysRequest]);
}
