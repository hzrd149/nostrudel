import { useKeyPressEvent } from "react-use";
import { Handler } from "react-use/lib/useKey";

export default function useKeyPressNav(key: string, keydown?: Handler | null, keyup?: Handler | null) {
  return useKeyPressEvent(
    key,
    keydown
      ? (e) => {
          // ignore if the user is focused on an input
          if (
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement
          ) {
            return;
          }

          keydown(e);
        }
      : undefined,
    keyup
      ? (e) => {
          // ignore if the user is focused on an input
          if (
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement
          ) {
            return;
          }

          keyup(e);
        }
      : undefined,
  );
}
