import { useEffect } from "react";
import { of } from "rxjs";
import { watchEventUpdates } from "applesauce-core/observable";
import { eventStore } from "../services/event-store";
import useForceUpdate from "./use-force-update";

export default function useEventUpdate(id?: string) {
  const update = useForceUpdate();

  useEffect(() => {
    if (!id) return;
    // v5: Use watchEventUpdates operator with event observable
    const sub = of(eventStore.getEvent(id)).pipe(watchEventUpdates(eventStore)).subscribe(update);
    return () => sub.unsubscribe();
  }, [id, update]);
}
