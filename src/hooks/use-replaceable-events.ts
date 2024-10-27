import { useMemo } from "react";
import { useObservable, useQueryStore } from "applesauce-react/hooks";

import { useReadRelays } from "./use-client-relays";
import replaceableEventsService, { RequestOptions } from "../services/replaceable-events";
import { CustomAddressPointer, parseCoordinate } from "../helpers/nostr/event";

export default function useReplaceableEvents(
  coordinates: string[] | CustomAddressPointer[] | undefined,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  const readRelays = useReadRelays(additionalRelays);
  const store = useQueryStore();

  const observable = useMemo(() => {
    if (!coordinates) return undefined;
    const pointers: CustomAddressPointer[] = [];

    for (const cord of coordinates) {
      const parsed = typeof cord === "string" ? parseCoordinate(cord) : cord;
      if (!parsed) return;

      pointers.push(parsed);
      replaceableEventsService.requestEvent(
        parsed.relays ? [...readRelays, ...parsed.relays] : readRelays,
        parsed.kind,
        parsed.pubkey,
        parsed.identifier,
        opts,
      );
    }

    return store.replaceableSet(pointers);
  }, [coordinates, readRelays.urls.join("|"), store]);

  const map = useObservable(observable);
  return Array.from(map?.values() ?? []);
}
