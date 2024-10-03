import { useMemo } from "react";
import { useObservable, useQueryStore } from "applesauce-react";

import { useReadRelays } from "./use-client-relays";
import replaceableEventsService, { RequestOptions } from "../services/replaceable-events";
import { CustomAddressPointer, parseCoordinate } from "../helpers/nostr/event";

export default function useReplaceableEvent(
  cord: string | CustomAddressPointer | undefined,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  const readRelays = useReadRelays(additionalRelays);
  const store = useQueryStore();

  const observable = useMemo(() => {
    const parsed = typeof cord === "string" ? parseCoordinate(cord) : cord;
    if (!parsed) return;

    replaceableEventsService.requestEvent(
      parsed.relays ? [...readRelays, ...parsed.relays] : readRelays,
      parsed.kind,
      parsed.pubkey,
      parsed.identifier,
      opts,
    );

    return store.replaceable(parsed.kind, parsed.pubkey, parsed.identifier);
  }, [cord, readRelays.urls.join("|"), opts?.alwaysRequest, opts?.ignoreCache, store]);

  return useObservable(observable);
}
