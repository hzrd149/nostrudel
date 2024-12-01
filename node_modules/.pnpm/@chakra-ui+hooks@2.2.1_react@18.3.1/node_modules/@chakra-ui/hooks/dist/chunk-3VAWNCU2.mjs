'use client'

// src/use-latest-ref.ts
import { useRef } from "react";
function useLatestRef(value) {
  const ref = useRef(null);
  ref.current = value;
  return ref;
}

export {
  useLatestRef
};
//# sourceMappingURL=chunk-3VAWNCU2.mjs.map