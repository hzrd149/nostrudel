import { logger } from "applesauce-core";
import { RefCallback, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { FixedSizeList } from "react-window";

const log = logger.extend("useScrollRestoreRef");

function useScrollKey(name = "default") {
  const location = useLocation();
  return "scroll_" + name + "_" + location.key + location.pathname;
}

// Save the scroll position when the component unmounts
function useSaveScrollPosition<T extends HTMLElement = HTMLDivElement>(key: string, ref: React.RefObject<T>) {
  useLayoutEffect(() => {
    return () => {
      if (ref.current) {
        const position = ref.current?.scrollTop;

        if (position) {
          log("Saving scroll position", key, position);
          sessionStorage.setItem(key, String(position));
        } else {
          log("Removing scroll position", key);
          sessionStorage.removeItem(key);
        }
      }
    };
  }, [key]);
}

/** Scroll restoration hook for a html element */
export default function useScrollRestoreRef<T extends HTMLElement = HTMLDivElement>(
  name = "default",
): RefCallback<T | null> {
  const ref = useRef<T | null>(null);
  const key = useScrollKey(name);

  // Save the scroll position when the component unmounts
  useSaveScrollPosition(key, ref);

  // Return ref callback for restoring scroll position on mount
  return useCallback(
    (container: T | null) => {
      ref.current = container;

      if (container) {
        const savedScroll = sessionStorage.getItem(key);
        if (savedScroll) {
          log("Restoring scroll position", container, parseInt(savedScroll, 10));
          container.scrollTop = parseInt(savedScroll, 10);
        }
      }
    },
    [key],
  );
}

/** Scroll restoration hook for react-window lists */
export function useVirtualListScrollRestore(name = "default") {
  const ref = useRef<HTMLDivElement | null>(null);
  const key = useScrollKey(name);

  // Save the scroll position when the component unmounts
  useSaveScrollPosition(key, ref);

  // Callback for saving the scroll element
  const outerRef = useCallback(
    (container: HTMLDivElement | null) => {
      ref.current = container;
      if (container) log("Found scroll container", container);
    },
    [key],
  );

  // Restore scroll position on mount
  const listRef = useCallback(
    (list: FixedSizeList | null) => {
      if (list) {
        const savedScroll = sessionStorage.getItem(key);
        if (savedScroll) {
          log("Restoring scroll position", list, parseInt(savedScroll, 10));
          list.scrollTo(parseInt(savedScroll, 10));
        }
      }
    },
    [key],
  );

  return { outerRef, ref: listRef };
}
