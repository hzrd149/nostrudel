import { useEventModel } from "applesauce-react/hooks";
import { useMemo } from "react";

import { CustomAddressPointer, parseCoordinate } from "../helpers/nostr/event";
import { ReplaceableQuery } from "../models";
import hash_sum from "hash-sum";

export default function useReplaceableEvent(cord: string | CustomAddressPointer | undefined) {
  const parsed = useMemo(() => (typeof cord === "string" ? parseCoordinate(cord) : cord), [hash_sum(cord)]);

  return useEventModel(
    ReplaceableQuery,
    parsed ? [parsed.kind, parsed.pubkey, parsed.identifier, parsed.relays] : undefined,
  );
}
