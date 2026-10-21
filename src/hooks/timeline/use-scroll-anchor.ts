import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { useIntersectionObserver } from "../../providers/local/intersection-observer";
import { useScrollContainer } from "../../providers/local/scroll-container";

/**
 * Keeps the topmost visible timeline item at the same place on screen when the rendered list changes.
 * Browser scroll anchoring is left on: where it already held the item in place the measured shift is zero,
 * so this only corrects browsers without it (Safari) and changes it ignores.
 * @returns a function that runs a callback after the next correction, used to scroll once new items render
 */
export default function useScrollAnchor() {
  const container = useScrollContainer();
  const { subject } = useIntersectionObserver();
  const visible = useRef(new Set<Element>());
  const anchor = useRef<{ el: Element; top: number }>();
  const after = useRef<() => void>();

  const record = useCallback(() => {
    let top: Element | undefined;
    let topY = Infinity;
    for (const el of visible.current) {
      if (!el.isConnected) {
        visible.current.delete(el);
        continue;
      }
      const y = el.getBoundingClientRect().top;
      if (y < topY) {
        top = el;
        topY = y;
      }
    }
    anchor.current = top ? { el: top, top: topY } : undefined;
  }, []);

  // Track which items are on screen
  useEffect(() => {
    const sub = subject.subscribe((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.current.add(entry.target);
        else visible.current.delete(entry.target);
      }
      record();
    });
    return () => sub.unsubscribe();
  }, [subject, record]);

  // Follow the reader as they scroll, at most once per frame
  useEffect(() => {
    if (!container) return;
    let frame = 0;
    const listener = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), record()));
    };
    container.addEventListener("scroll", listener, { passive: true });
    return () => {
      container.removeEventListener("scroll", listener);
      cancelAnimationFrame(frame);
    };
  }, [container, record]);

  // Runs after every render of the owning timeline, before the browser paints
  useLayoutEffect(() => {
    const prev = anchor.current;
    if (container && prev?.el.isConnected) {
      const shift = prev.el.getBoundingClientRect().top - prev.top;
      if (shift !== 0) container.scrollBy({ top: shift, behavior: "instant" });
    }
    record();

    const callback = after.current;
    after.current = undefined;
    callback?.();
  });

  return useCallback((callback: () => void) => {
    after.current = callback;
  }, []);
}
