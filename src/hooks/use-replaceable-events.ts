import { useEffect, useMemo } from "react";
import { NostrEvent } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { ReplaceableSetQuery } from "applesauce-core/queries";

import { useReadRelays } from "./use-client-relays";
import replaceableEventLoader from "../services/replaceable-loader";
import { CustomAddressPointer, parseCoordinate } from "../helpers/nostr/event";

export default function useReplaceableEvents(
  coordinates: string[] | CustomAddressPointer[] | undefined,
  additionalRelays?: Iterable<string>,
  force?: boolean,
): NostrEvent[] {
  const readRelays = useReadRelays(additionalRelays);

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
      replaceableEventLoader.next({
        relays: [...readRelays, ...(pointer.relays ?? [])],
        kind: pointer.kind,
        pubkey: pointer.pubkey,
        identifier: pointer.identifier,
        force,
      });
    }
  }, [pointers, readRelays.urls.join("|"), force]);

  const events = useStoreQuery(ReplaceableSetQuery, pointers && [pointers]);
  return events ? Object.values(events) : [];
}
