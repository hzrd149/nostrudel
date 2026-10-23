import { use$, useEventStore } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { map } from "rxjs";

import { castThreadEvent } from "../helpers/nostr/thread";

export default function useThreadEvent(event: NostrEvent | undefined) {
  const store = useEventStore();
  return use$(() => {
    if (!event) return undefined;
    return store.event(event.id).pipe(map((loaded) => loaded && castThreadEvent(loaded)));
  }, [event?.id, store]);
}
