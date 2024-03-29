import { useMemo } from "react";

import singleEventService from "../services/single-event";
import { useReadRelays } from "./use-client-relays";
import useSubjects from "./use-subjects";

export default function useSingleEvents(ids?: string[], additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);
  const subjects = useMemo(() => {
    return ids?.map((id) => singleEventService.requestEvent(id, readRelays)) ?? [];
  }, [ids, readRelays.urls.join("|")]);

  return useSubjects(subjects);
}
