import { useEffect, useMemo, useState } from "react";
import { eventStore } from "../services/event-store";

export default function useEventUpdate(id?: string) {
  const [_count, setCount] = useState(0);

  const observable = useMemo(() => (id ? eventStore.event(id) : undefined), [id]);
  useEffect(() => {
    if (!observable) return;
    const sub = observable.subscribe(() => setCount((v) => v + 1));
    return () => sub.unsubscribe();
  }, [observable]);
}
