import { useMemo } from "react";
import { useReadRelayUrls } from "./use-client-relays";
import emojiPacksService from "../services/emoji-packs";
import useSubject from "./use-subject";

export default function useUserEmojiPacks(pubkey?: string, additionalRelays?: string[], alwaysFetch = false) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const subject = useMemo(() => {
    if (pubkey) return emojiPacksService.requestUserEmojiList(pubkey, readRelays, alwaysFetch);
  }, [pubkey, readRelays.join("|")]);

  return useSubject(subject);
}
