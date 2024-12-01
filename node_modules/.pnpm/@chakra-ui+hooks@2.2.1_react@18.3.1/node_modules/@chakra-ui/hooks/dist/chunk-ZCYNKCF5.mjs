'use client'
import {
  useEventListener
} from "./chunk-7JEV5YKL.mjs";

// src/use-pointer-event.ts
import {
  getPointerEventName,
  wrapPointerEventHandler
} from "@chakra-ui/utils";
function usePointerEvent(env, eventName, handler, options) {
  return useEventListener(
    getPointerEventName(eventName),
    wrapPointerEventHandler(handler, eventName === "pointerdown"),
    env,
    options
  );
}

export {
  usePointerEvent
};
//# sourceMappingURL=chunk-ZCYNKCF5.mjs.map