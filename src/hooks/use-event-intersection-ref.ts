import { useRef } from "react";
import { getEventUID } from "nostr-idb";
import { NostrEvent } from "nostr-tools";

import { useRegisterIntersectionEntity } from "../providers/local/intersection-observer";

export default function useEventIntersectionRef<T extends HTMLElement = HTMLDivElement>(event?: NostrEvent) {
  const ref = useRef<T | null>(null);
  useRegisterIntersectionEntity(ref, event ? getEventUID(event) : undefined);
  return ref;
}
