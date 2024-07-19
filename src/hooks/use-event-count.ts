import { useMemo } from "react";
import { Filter } from "nostr-tools";
import eventCountService from "../services/event-count";
import useSubject from "./use-subject";

export default function useEventCount(filter?: Filter | Filter[], alwaysRequest = false) {
  const key = filter ? eventCountService.stringifyFilter(filter) : "empty";
  const subject = useMemo(() => filter && eventCountService.requestCount(filter, alwaysRequest), [key, alwaysRequest]);
  return useSubject(subject);
}
