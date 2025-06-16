import { Code, CodeProps } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { useRef } from "react";
import { useKeyPressEvent } from "react-use";

import localSettings from "../services/local-settings";

export default function KeyboardShortcut({
  letter,
  requireMeta,
  onPress,
  ...props
}: {
  letter: string;
  requireMeta?: boolean;
  onPress?: (e: KeyboardEvent) => void;
} & Omit<CodeProps, "children">) {
  const enableKeyboardShortcuts = useObservableEagerState(localSettings.enableKeyboardShortcuts);
  const ref = useRef<HTMLDivElement | null>(null);
  useKeyPressEvent(
    (e) => (requireMeta ? e.ctrlKey || e.metaKey : true) && e.key === letter,
    (e) => {
      if (!enableKeyboardShortcuts) return;

      // ignore if the user is focused on an input
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }

      if (onPress) {
        e.preventDefault();
        onPress(e);
      } else if (ref.current?.parentElement) {
        e.preventDefault();
        ref.current.parentElement.click();
      }
    },
  );

  if (!enableKeyboardShortcuts) return null;

  return (
    <Code fontSize="md" mx="2" textDecoration="none" textTransform="capitalize" ref={ref} {...props}>
      {requireMeta ? (navigator.userAgent.includes("Macintosh") ? "⌘" : "^") : ""}
      {letter}
    </Code>
  );
}
