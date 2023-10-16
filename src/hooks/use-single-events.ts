import { useMemo } from "react";

import singleEventService from "../services/single-event";
import { useReadRelayUrls } from "./use-client-relays";
import useSubjects from "./use-subjects";

export default function useSingleEvents(ids?: string[], additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const subjects = useMemo(() => {
    return ids?.map((id) => singleEventService.requestEvent(id, readRelays)) ?? [];
  }, [ids, readRelays.join("|")]);

  return useSubjects(subjects);
}
