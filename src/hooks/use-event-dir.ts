import { useEffect, useState } from "react";
import { Subscription } from "../services/subscriptions";
import { NostrEvent } from "../types/nostr-event";

export function useEventDir(subscription: Subscription) {
  const [events, setEvents] = useState<Record<string, NostrEvent>>({});

  useEffect(() => {
    const s = subscription.onEvent.subscribe((event) => {
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
