import { useEffect, useMemo } from "react";
import { useObservable, useQueryStore, useStoreQuery } from "applesauce-react/hooks";
import { ReplaceableSetQuery } from "applesauce-core/queries";

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

  const pointers = useMemo(() => {
    if (!coordinates) return undefined;
    const arr: CustomAddressPointer[] = [];
    for (const cord of coordinates) {
      const parsed = typeof cord === "string" ? parseCoordinate(cord) : cord;
      if (!parsed) return;

      arr.push(parsed);
    }
    return arr;
  }, [coordinates]);

  // load events
  useEffect(() => {
    if (!pointers) return;
    for (const pointer of pointers) {
      replaceableEventsService.requestEvent(
        pointer.relays ? [...readRelays, ...pointer.relays] : readRelays,
        pointer.kind,
        pointer.pubkey,
        pointer.identifier,
        opts,
      );
    }
  }, [pointers, readRelays.urls.join("|")]);

  const map = useStoreQuery(ReplaceableSetQuery, pointers && [pointers]);
  return Array.from(map?.values() ?? []);
}
