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

const IntersectionObserverContext = createContext<{
  observer?: IntersectionObserver;
  setElementId: (element: Element, id: any) => void;
}>({ setElementId: () => {} });

export type ExtendedIntersectionObserverEntry<T> = { entry: IntersectionObserverEntry; id: T | undefined };
export type ExtendedIntersectionObserverCallback<T> = (
  entries: ExtendedIntersectionObserverEntry<T>[],
  observer: IntersectionObserver
) => void;

export function useIntersectionObserver() {
  return useContext(IntersectionObserverContext);
}

export function useRegisterIntersectionEntity<T>(ref: MutableRefObject<Element | null>, id?: T) {
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

export function useIntersectionMapCallback<T>(
  callback: (map: Map<T, IntersectionObserverEntry>) => void,
  watch: DependencyList
) {
  const map = useMemo(() => new Map<T, IntersectionObserverEntry>(), []);
  return useCallback<ExtendedIntersectionObserverCallback<T>>(
    (entries) => {
      for (const { id, entry } of entries) {
        if (id) map.set(id, entry);
      }

      callback(map);
    },
    [callback, ...watch]
  );
}

export default function IntersectionObserverProvider<T = undefined>({
  children,
  root,
  rootMargin,
  threshold,
  callback,
}: PropsWithChildren & {
  root: MutableRefObject<HTMLElement | null>;
  rootMargin?: IntersectionObserverInit["rootMargin"];
  threshold?: IntersectionObserverInit["threshold"];
  callback: ExtendedIntersectionObserverCallback<T>;
}) {
  const elementIds = useMemo(() => new WeakMap<Element, T>(), []);
  const [observer, setObserver] = useState<IntersectionObserver>();

  useMount(() => {
    if (root.current) {
      const observer = new IntersectionObserver(
        (entries, observer) => {
          callback(
            entries.map((entry) => {
              return { entry, id: elementIds.get(entry.target) };
            }),
            observer
          );
        },
        { rootMargin, threshold }
      );

      setObserver(observer);
    }
  });
  useUnmount(() => {
    if (observer) observer.disconnect();
  });

  const setElementId = useCallback(
    (element: Element, id: T) => {
      elementIds.set(element, id);
    },
    [elementIds]
  );

  const context = useMemo(
    () => ({
      observer,
      setElementId,
    }),
    [observer, setElementId]
  );

  return <IntersectionObserverContext.Provider value={context}>{children}</IntersectionObserverContext.Provider>;
}
