import { useCallback, useEffect, useState } from "react";
import { NostrMultiSubscription } from "../classes/nostr-multi-subscription";
import { NostrEvent } from "../types/nostr-event";

export function useEventDir(subscription: NostrMultiSubscription, filter?: (event: NostrEvent) => boolean) {
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

  const reset = useCallback(() => setEvents({}), [setEvents]);

  return { events, reset };
}
