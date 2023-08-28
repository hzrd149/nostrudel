import { useMemo } from "react";
import { useReadRelayUrls } from "./use-client-relays";
import emojiPacksService from "../services/emoji-packs";
import useSubject from "./use-subject";

export default function useUserEmojiPacks(pubkey?: string, additionalRelays?: string[]) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const subject = useMemo(() => {
    if (pubkey) return emojiPacksService.requestUserEmojiList(pubkey, readRelays);
  }, [pubkey, readRelays.join("|")]);

  return useSubject(subject);
}
