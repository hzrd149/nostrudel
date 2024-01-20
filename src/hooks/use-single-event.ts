import singleEventService from "../services/single-event";
import { useReadRelays } from "./use-client-relays";
import { useMemo } from "react";
import useSubject from "./use-subject";

export default function useSingleEvent(id?: string, additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);
  const subject = useMemo(() => {
    if (id) return singleEventService.requestEvent(id, readRelays);
  }, [id, readRelays.urls.join("|")]);

  return useSubject(subject);
}
