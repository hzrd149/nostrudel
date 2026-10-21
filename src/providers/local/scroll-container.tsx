import { createContext, useContext } from "react";

/** The element that scrolls the current page, set by the page layout */
export const ScrollContainerContext = createContext<HTMLElement | null>(null);

export function useScrollContainer() {
  return useContext(ScrollContainerContext);
}
