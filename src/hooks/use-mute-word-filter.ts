import { useCallback, useMemo } from "react";

import { NostrEvent } from "nostr-tools";
import useAppSettings from "./use-user-app-settings";
import { createMutedWordsRegExp } from "applesauce-core/helpers";

/** @deprecated Use useUserMuteFilter once the legacy mute words filter is removed */
export default function useLegacyMuteWordsFilter() {
  const { mutedWords } = useAppSettings();
  const regex = useMemo(
    () => (mutedWords && mutedWords.length > 0 ? createMutedWordsRegExp(mutedWords.split(/[\s,]+/)) : undefined),
    [mutedWords],
  );

  return useCallback(
    (event: NostrEvent) => {
      const content = event.content.toLocaleLowerCase();
      if (regex) return regex.test(content);
      return false;
    },
    [regex],
  );
}
