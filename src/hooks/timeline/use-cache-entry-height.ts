import { useEffect } from "react";
import { getEntryDetails, useIntersectionObserver } from "../../providers/local/intersection-observer";

export default function useCacheEntryHeight(set: (key: string, value: number) => void) {
  const { subject: intersectionSubject } = useIntersectionObserver();
  useEffect(() => {
    const listener = (entities: IntersectionObserverEntry[]) => {
      for (const entry of entities) {
        const details = getEntryDetails(entry);
        if (details?.id && entry.target instanceof HTMLElement) {
          const rect = entry.target.getBoundingClientRect();

          set(details.id, rect.height);
        }
      }
    };

    const sub = intersectionSubject.subscribe(listener);
    return () => {
      sub.unsubscribe();
    };
  }, [intersectionSubject, set]);
}
