import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function useScrollRestoreRef<T extends HTMLElement = HTMLDivElement>(name = "default") {
  const ref = useRef<T | null>(null);
  const location = useLocation();
  const key = "scroll_" + name + "_" + location.key + location.pathname;

  useLayoutEffect(() => {
    const container = ref.current;
    // Restore scroll position on mount
    if (container) {
      const savedScroll = sessionStorage.getItem(key);
      if (savedScroll) container.scrollTop = parseInt(savedScroll, 10);
    }

    // Save scroll position before unmounting
    return () => {
      if (!container) return;

      const y = container?.scrollTop;
      if (y) sessionStorage.setItem(key, String(y));
      else sessionStorage.removeItem(key);
    };
  }, [key]);

  return ref;
}
