import { useCallback, useMemo } from "react";

import { NostrEvent } from "../types/nostr-event";
import useAppSettings from "./use-user-app-settings";

export default function useWordMuteFilter() {
  const { mutedWords } = useAppSettings();

  const regexp = useMemo(() => {
    if (!mutedWords) return;
    const words = mutedWords
      .split(/[,\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return new RegExp(`(?:^|\\s|#)(?:${words.join("|")})(?:\\s|$)`, "i");
  }, [mutedWords]);

  return useCallback(
    (event: NostrEvent) => {
      if (!regexp) return false;
      return event.content.match(regexp) !== null;
    },
    [mutedWords],
  );
}
