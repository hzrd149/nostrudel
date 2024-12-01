'use client'

// src/use-unmount-effect.ts
import { useEffect } from "react";
function useUnmountEffect(fn, deps = []) {
  return useEffect(
    () => () => fn(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
}

export {
  useUnmountEffect
};
//# sourceMappingURL=chunk-NGVRPZ6W.mjs.map