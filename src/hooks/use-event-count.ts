import { useMemo } from "react";
import eventCountService from "../services/event-count";
import { NostrRequestFilter } from "../types/nostr-relay";
import useSubject from "./use-subject";

export default function useEventCount(filter?: NostrRequestFilter, alwaysRequest = false) {
  const key = filter ? eventCountService.stringifyFilter(filter) : "empty";
  const subject = useMemo(() => filter && eventCountService.requestCount(filter, alwaysRequest), [key, alwaysRequest]);
  return useSubject(subject);
}
