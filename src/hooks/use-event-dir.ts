import { useEffect, useState } from "react";
import { NostrSubscription } from "../classes/nostr-subscription";
import { NostrEvent } from "../types/nostr-event";

export function useEventDir(
  subscription: NostrSubscription,
  filter?: (event: NostrEvent) => boolean
) {
  const [events, setEvents] = useState<Record<string, NostrEvent>>({});

  useEffect(() => {
    const s = subscription.onEvent.subscribe((event) => {
      if (filter && !filter(event)) return;

      setEvents((dir) => {
        if (!dir[event.id]) {
          return { [event.id]: event, ...dir };
        }
        return dir;
      });
    });

    return () => s.unsubscribe();
  }, [subscription]);

  const reset = () => setEvents({});

  return { events, reset };
}
