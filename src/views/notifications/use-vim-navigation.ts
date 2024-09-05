import { NostrEvent } from "nostr-tools";
import { useContext } from "react";
import FocusedContext from "./focused-context";
import readStatusService from "../../services/read-status";
import useKeyPressNav from "../../hooks/use-key-press-nav";

export default function useVimNavigation(events: NostrEvent[]) {
  const { id: focused, focus: setFocus } = useContext(FocusedContext);

  // VIM controls
  const navigatePrev = () => {
    const focusedEvent = events.find((e) => e.id === focused);

    if (focusedEvent) {
      const i = events.indexOf(focusedEvent);
      if (i >= 1) {
        const prev = events[i - 1];
        if (prev) setFocus(prev.id);
      }
    }
  };
  const navigatePrevUnread = () => {
    const focusedEvent = events.find((e) => e.id === focused);

    const idx = focusedEvent ? events.indexOf(focusedEvent) : 0;
    for (let i = idx; i >= 0; i--) {
      if (readStatusService.getStatus(events[i].id).value === false) {
        setFocus(events[i].id);
        break;
      }
    }
  };
  const navigateNext = () => {
    const focusedEvent = events.find((e) => e.id === focused);

    const i = focusedEvent ? events.indexOf(focusedEvent) : -1;
    if (i < events.length - 2) {
      const next = events[i + 1];
      if (next) setFocus(next.id);
    }
  };
  const navigateNextUnread = () => {
    const focusedEvent = events.find((e) => e.id === focused);

    const idx = focusedEvent ? events.indexOf(focusedEvent) : 0;
    for (let i = idx; i < events.length; i++) {
      if (readStatusService.getStatus(events[i].id).value === false) {
        setFocus(events[i].id);
        break;
      }
    }
  };
  const navigateTop = () => setFocus(events[0]?.id ?? "");
  const navigateEnd = () => setFocus(events[events.length - 1]?.id ?? "");

  useKeyPressNav("ArrowUp", navigatePrev);
  useKeyPressNav("ArrowDown", navigateNext);
  useKeyPressNav("ArrowLeft", navigatePrevUnread);
  useKeyPressNav("ArrowRight", navigateNextUnread);
  useKeyPressNav("k", navigatePrev);
  useKeyPressNav("h", navigatePrevUnread);
  useKeyPressNav("j", navigateNext);
  useKeyPressNav("l", navigateNextUnread);
  useKeyPressNav("H", navigateTop);
  useKeyPressNav("Home", navigateTop);
  useKeyPressNav("L", navigateEnd);
  useKeyPressNav("End", navigateEnd);
}
