'use client'
import {
  useCallbackRef
} from "./chunk-KA2477BY.mjs";

// src/use-timeout.ts
import { useEffect } from "react";
function useTimeout(callback, delay) {
  const fn = useCallbackRef(callback);
  useEffect(() => {
    if (delay == null)
      return void 0;
    let timeoutId = null;
    timeoutId = window.setTimeout(() => {
      fn();
    }, delay);
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [delay, fn]);
}

export {
  useTimeout
};
//# sourceMappingURL=chunk-HMTAETMO.mjs.map