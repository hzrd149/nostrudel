import { AddressPointerWithoutD } from "applesauce-core/helpers";
import { useEventModel } from "applesauce-react/hooks";
import hash_sum from "hash-sum";
import { AddressPointer } from "nostr-tools/nip19";
import { useMemo } from "react";

import { parseCoordinate } from "../helpers/nostr/event";
import { AddressableQuery } from "../models";

export default function useReplaceableEvent(cord: string | AddressPointer | AddressPointerWithoutD | undefined) {
  const parsed = useMemo(() => (typeof cord === "string" ? parseCoordinate(cord) : cord), [hash_sum(cord)]);

  return useEventModel(AddressableQuery, parsed ? [parsed] : undefined);
}
