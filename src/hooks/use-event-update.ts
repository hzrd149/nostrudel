import { useEffect, useMemo } from "react";
import { eventStore } from "../services/event-store";
import useForceUpdate from "./use-force-update";

export default function useEventUpdate(id?: string) {
  const update = useForceUpdate();

  const observable = useMemo(() => (id ? eventStore.updated(id) : undefined), [id]);
  useEffect(() => {
    if (!observable) return;
    const sub = observable.subscribe(update);
    return () => sub.unsubscribe();
  }, [observable, update]);
}
