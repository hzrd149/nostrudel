import { useAsync } from "react-use";
import singleEventService from "../services/single-event";

export default function useSingleEvent(id: string, relays: string[] = []) {
  const { loading, value: event } = useAsync(() => singleEventService.requestEvent(id, relays), [id, relays.join("|")]);

  return {
    event,
    loading,
  };
}
