import { useEventStore } from "applesauce-react/hooks/use-event-store";
import { onlyEvents } from "applesauce-relay";
import { nanoid } from "nanoid";
import { Filter } from "nostr-tools";
import { useEffect, useMemo } from "react";

import pool from "../services/pool";

export default function useSimpleSubscription(relays?: string[], filters?: Filter | Filter[]) {
  const eventStore = useEventStore();
  const id = useMemo(() => nanoid(10), []);

  // Create subscription
  const observable = useMemo(
    () => relays && filters && pool.subscription(relays, filters, { id }).pipe(onlyEvents()),
    [relays, filters, id],
  );

  // subscribe
  useEffect(() => {
    const sub = observable?.subscribe((event) => eventStore.add(event));
    return () => sub?.unsubscribe();
  }, [observable, eventStore]);

  return observable;
}
