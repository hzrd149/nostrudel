'use client'
import {
  useUnmountEffect
} from "./chunk-NGVRPZ6W.mjs";

// src/use-force-update.ts
import { useCallback, useRef, useState } from "react";
function useForceUpdate() {
  const unloadingRef = useRef(false);
  const [count, setCount] = useState(0);
  useUnmountEffect(() => {
    unloadingRef.current = true;
  });
  return useCallback(() => {
    if (!unloadingRef.current) {
      setCount(count + 1);
    }
  }, [count]);
}

export {
  useForceUpdate
};
//# sourceMappingURL=chunk-TJQCN7SC.mjs.map