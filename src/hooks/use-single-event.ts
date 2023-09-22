import singleEventService from "../services/single-event";
import { useReadRelayUrls } from "./use-client-relays";
import { useMemo } from "react";
import useSubject from "./use-subject";

export default function useSingleEvent(id?: string, additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const subject = useMemo(() => {
    if (id) return singleEventService.requestEvent(id, readRelays);
  }, [id, readRelays.join("|")]);

  return useSubject(subject);
}
