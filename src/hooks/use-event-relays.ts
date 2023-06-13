import { useMemo } from "react";
import { getEventRelays } from "../services/event-relays";
import useSubject from "./use-subject";

export default function useEventRelays(eventId?: string) {
  const sub = useMemo(() => (eventId ? getEventRelays(eventId) : undefined), [eventId]);
  return useSubject(sub) ?? [];
}
