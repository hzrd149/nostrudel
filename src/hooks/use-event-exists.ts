import { useMemo } from "react";
import stringify from "json-stringify-deterministic";
import eventExistsService from "../services/event-exists";
import { NostrRequestFilter } from "../types/nostr-query";
import useSubject from "./use-subject";

export default function useEventExists(filter?: NostrRequestFilter, relays: string[] = [], fallback = true) {
  const sub = useMemo(
    () => filter && eventExistsService.requestExists(filter, relays),
    [stringify(filter), relays.join("|")],
  );
  return useSubject(sub) ?? fallback;
}
