import { EventModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { EventPointer } from "nostr-tools/nip19";
import { useMemo } from "react";

export default function useSingleEvent(id?: string | EventPointer) {
  const pointer = useMemo(() => (typeof id === "string" ? { id } : id), [id]);

  return useEventModel(EventModel, pointer ? [pointer] : undefined);
}
