import {
  DependencyList,
  MutableRefObject,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMount, useUnmount } from "react-use";
import { BehaviorSubject, Subject } from "rxjs";

const IntersectionObserverContext = createContext<{
  observer?: IntersectionObserver;
  // NOTE: hard codded string type
  subject: Subject<IntersectionObserverEntry[]>;
}>({ subject: new Subject() });

export function useIntersectionObserver() {
  return useContext(IntersectionObserverContext);
}

export function getEntryDetails(entry: IntersectionObserverEntry) {
  if (entry.target instanceof HTMLElement) {
    const { id, ts } = entry.target.dataset;
    if (id && ts) return { id, ts };
  }
}

export function useIntersectionEntityDetails(ref: MutableRefObject<HTMLElement | null>, id?: string, date?: number) {
  const { observer } = useIntersectionObserver();

  useEffect(() => {
    if (observer && ref.current) {
      observer.observe(ref.current);

      if (id) ref.current.dataset.id = id;
      if (date) ref.current.dataset.ts = String(date);
    }
  }, [observer]);

  useUnmount(() => {
    if (observer && ref.current) observer.unobserve(ref.current);
  });
}

export function useCachedIntersectionMapCallback(
  callback: (map: Map<string, IntersectionObserverEntry>) => void,
  watch: DependencyList,
) {
  const cache = useMemo(() => new Map<string, IntersectionObserverEntry>(), []);

  return useCallback<IntersectionObserverCallback>(
    (entries, observer) => {
      for (const entry of entries) {
        const details = getEntryDetails(entry);
        if (details?.id) cache.set(details.id, entry);
      }
      callback(cache);
    },
    [callback, ...watch],
  );
}

export default function IntersectionObserverProvider({
  children,
  root,
  rootMargin,
  threshold,
  callback,
}: PropsWithChildren & {
  root?: MutableRefObject<HTMLElement | null>;
  rootMargin?: IntersectionObserverInit["rootMargin"];
  threshold?: IntersectionObserverInit["threshold"];
  callback: IntersectionObserverCallback;
}) {
  const [subject] = useState(() => new BehaviorSubject<IntersectionObserverEntry[]>([]));

  const handleIntersection = useCallback<IntersectionObserverCallback>(
    (entries, observer) => {
      callback(entries, observer);
      subject.next(entries);
    },
    [subject, callback],
  );

  const [observer, setObserver] = useState<IntersectionObserver>(
    () => new IntersectionObserver(handleIntersection, { rootMargin, threshold }),
  );

  useMount(() => {
    if (root?.current) {
      // recreate observer with root
      setObserver(new IntersectionObserver(handleIntersection, { rootMargin, threshold, root: root.current }));
    }
  });
  useUnmount(() => {
    if (observer) observer.disconnect();
  });

  const context = useMemo(
    () => ({
      observer,
      subject,
    }),
    [observer, subject],
  );

  return <IntersectionObserverContext.Provider value={context}>{children}</IntersectionObserverContext.Provider>;
}
