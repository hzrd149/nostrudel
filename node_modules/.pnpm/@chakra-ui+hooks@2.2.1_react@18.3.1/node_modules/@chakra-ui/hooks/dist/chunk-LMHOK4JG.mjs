'use client'
import {
  useEventListener
} from "./chunk-7JEV5YKL.mjs";

// src/use-mouse-down-ref.ts
import { useRef } from "react";
function useMouseDownRef(shouldListen = true) {
  const mouseDownRef = useRef();
  useEventListener("mousedown", (event) => {
    if (shouldListen) {
      mouseDownRef.current = event.target;
    }
  });
  return mouseDownRef;
}

export {
  useMouseDownRef
};
//# sourceMappingURL=chunk-LMHOK4JG.mjs.map