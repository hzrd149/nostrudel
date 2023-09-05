import { useAsync } from "react-use";

import singleEventService from "../services/single-event";
import { useReadRelayUrls } from "./use-client-relays";

export default function useSingleEvent(id?: string, additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const { loading, value: event } = useAsync(async () => {
    if (id) return singleEventService.requestEvent(id, readRelays);
  }, [id, readRelays.join("|")]);

  return {
    event,
    loading,
  };
}
