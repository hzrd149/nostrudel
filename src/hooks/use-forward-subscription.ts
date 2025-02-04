import { nanoid } from "nanoid";
import { Filter } from "nostr-tools";
import { useEffect, useMemo } from "react";
import { createRxForwardReq } from "rx-nostr";
import hash from "hash-sum";

import rxNostr from "../services/rx-nostr";
import { useEventStore } from "applesauce-react/hooks/use-event-store";

export default function useForwardSubscription(relays?: string[], filters?: Filter | Filter[]) {
  const eventStore = useEventStore();
  const id = useMemo(() => nanoid(10), []);
  const rxReq = useMemo(() => createRxForwardReq(id), [id]);

  // attach to rxNostr
  const observable = useMemo(() => rxNostr.use(rxReq, { on: { relays } }), [rxReq, relays?.join(",")]);

  // subscribe
  // NOTE: have to subscribe before emitting filter
  useEffect(() => {
    const sub = observable.subscribe((packet) => {
      eventStore.add(packet.event, packet.from);
    });

    return () => sub.unsubscribe();
  }, [observable, eventStore]);

  // update filters
  useEffect(() => {
    if (filters) {
      if (Array.isArray(filters)) {
        if (filters.length > 0) rxReq.emit(filters);
      } else rxReq.emit([filters]);
    }
  }, [rxReq, hash(filters)]);

  return observable;
}
