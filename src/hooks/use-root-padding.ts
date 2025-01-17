import { useEffect } from "react";

export default function useRootPadding(padding?: { left?: string; top?: string; right?: string; bottom?: string }) {
  useEffect(() => {
    const root = document.body;
    if (!root) return;

    if (padding?.top) root.style.paddingTop = padding.top;
    if (padding?.left) root.style.paddingLeft = padding.left;
    if (padding?.right) root.style.paddingRight = padding.right;
    if (padding?.bottom) root.style.paddingBottom = padding.bottom;

    return () => {
      root.style.removeProperty("padding-top");
      root.style.removeProperty("padding-left");
      root.style.removeProperty("padding-right");
      root.style.removeProperty("padding-bottom");
    };
  }, [padding?.left, padding?.top, padding?.right, padding?.bottom]);
}
