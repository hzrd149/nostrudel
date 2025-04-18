import { useCallback } from "react";

import { NostrEvent } from "../types/nostr-event";
import useAppSettings from "./use-user-app-settings";

/** @deprecated Use useUserMuteFilter once the legacy mute words filter is removed */
export default function useLegacyMuteWordsFilter() {
  const { mutedWords } = useAppSettings();

  return useCallback(
    (event: NostrEvent) => {
      const content = event.content.toLocaleLowerCase();
      if (mutedWords)
        for (const word of mutedWords) {
          if (content.includes(word.toLocaleLowerCase())) return false;
        }

      return true;
    },
    [mutedWords],
  );
}
