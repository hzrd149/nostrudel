import { useEventModel } from "applesauce-react/hooks";
import { EventPointer } from "nostr-tools/nip19";
import { useMemo } from "react";

import EventQuery from "../models/events";

export default function useSingleEvent(id?: string | EventPointer) {
  const pointer = useMemo(() => (typeof id === "string" ? { id } : id), [id]);

  return useEventModel(EventQuery, pointer ? [pointer] : undefined);
}
