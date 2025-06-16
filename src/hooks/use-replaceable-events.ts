import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import hash_sum from "hash-sum";
import { combineLatest, map, of } from "rxjs";
import { CustomAddressPointer, parseCoordinate } from "../helpers/nostr/event";
import { AddressableQuery } from "../models";

export default function useReplaceableEvents(coordinates: string[] | CustomAddressPointer[] | undefined): NostrEvent[] {
  const eventStore = useEventStore();

  return (
    useObservableMemo(() => {
      if (!coordinates) return of([]);

      const models = coordinates
        .map((str) => (typeof str === "string" ? parseCoordinate(str) : str))
        .filter((c) => c !== null)
        .map((cord) => eventStore.model(AddressableQuery, cord));

      return combineLatest(models).pipe(map((events) => events.filter((e) => e !== undefined)));
    }, [hash_sum(coordinates), eventStore]) ?? []
  );
}
