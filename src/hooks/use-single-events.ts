import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import hash_sum from "hash-sum";
import { NostrEvent } from "nostr-tools";
import { combineLatest, map } from "rxjs";

export default function useSingleEvents(ids?: string[], relays?: string[]): NostrEvent[] {
  const eventStore = useEventStore();

  return (
    useObservableMemo(() => {
      const models = ids?.map((id) => eventStore.event({ id, relays })) ?? [];

      return combineLatest(models).pipe(map((events) => events.filter((e) => !!e)));
    }, [hash_sum(ids), eventStore, hash_sum(relays)]) ?? []
  );
}
