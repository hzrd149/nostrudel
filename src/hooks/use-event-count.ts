import { useMemo } from "react";
import { Filter } from "nostr-tools";
import { useObservable } from "applesauce-react/hooks";

import eventCountService from "../services/event-count";

export default function useEventCount(filter?: Filter | Filter[], alwaysRequest = false) {
  const key = filter ? eventCountService.stringifyFilter(filter) : "empty";
  const subject = useMemo(() => filter && eventCountService.requestCount(filter, alwaysRequest), [key, alwaysRequest]);
  return useObservable(subject);
}
