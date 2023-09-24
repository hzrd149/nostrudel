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

import Subject from "../classes/subject";

export type ExtendedIntersectionObserverEntry = { entry: IntersectionObserverEntry; id: string | undefined };
export type ExtendedIntersectionObserverCallback = (
  entries: ExtendedIntersectionObserverEntry[],
  observer: IntersectionObserver,
) => void;

const IntersectionObserverContext = createContext<{
  observer?: IntersectionObserver;
  setElementId: (element: Element, id: any) => void;
  // NOTE: hard codded string type
  subject: Subject<ExtendedIntersectionObserverEntry[]>;
}>({ setElementId: () => {}, subject: new Subject() });

export function useIntersectionObserver() {
  return useContext(IntersectionObserverContext);
}

export function useRegisterIntersectionEntity(ref: MutableRefObject<Element | null>, id?: string) {
  const { observer, setElementId } = useIntersectionObserver();

  useEffect(() => {
    if (observer && ref.current) {
      observer.observe(ref.current);
      if (id) setElementId(ref.current, id);
    }
  }, [observer]);
  useUnmount(() => {
    if (observer && ref.current) observer.unobserve(ref.current);
  });
}

/** @deprecated */
export function useIntersectionMapCallback(
  callback: (map: Map<string, IntersectionObserverEntry>) => void,
  watch: DependencyList,
) {
  const map = useMemo(() => new Map<string, IntersectionObserverEntry>(), []);
  return useCallback<ExtendedIntersectionObserverCallback>(
    (entries) => {
      for (const { id, entry } of entries) id && map.set(id, entry);
      callback(map);
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
  callback: ExtendedIntersectionObserverCallback;
}) {
  const elementIds = useMemo(() => new WeakMap<Element, string>(), []);
  const [subject] = useState(() => new Subject<ExtendedIntersectionObserverEntry[]>([], false));

  const handleIntersection = useCallback<IntersectionObserverCallback>(
    (entries, observer) => {
      const extendedEntries = entries.map((entry) => {
        return { entry, id: elementIds.get(entry.target) };
      });
      callback(extendedEntries, observer);

      subject.next(extendedEntries);
    },
    [subject],
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

  const setElementId = useCallback(
    (element: Element, id: string) => {
      elementIds.set(element, id);
    },
    [elementIds],
  );

  const context = useMemo(
    () => ({
      observer,
      setElementId,
      subject,
    }),
    [observer, setElementId, subject],
  );

  return <IntersectionObserverContext.Provider value={context}>{children}</IntersectionObserverContext.Provider>;
}
