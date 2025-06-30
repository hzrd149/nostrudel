import { useRef } from "react";
import { NostrEvent } from "nostr-tools";
import { getEventUID } from "applesauce-core/helpers";

import { useIntersectionEntityDetails } from "../providers/local/intersection-observer";

export default function useEventIntersectionRef<T extends HTMLElement = HTMLDivElement>(event?: NostrEvent) {
  const ref = useRef<T | null>(null);
  useIntersectionEntityDetails(ref, event ? getEventUID(event) : undefined, event?.created_at);
  return ref;
}
