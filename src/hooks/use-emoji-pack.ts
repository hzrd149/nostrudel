import { useMemo } from "react";
import { useReadRelayUrls } from "./use-client-relays";
import emojiPacksService from "../services/emoji-packs";
import useSubject from "./use-subject";

export default function useEmojiPack(addr: string, additionalRelays?: string[]) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const subject = useMemo(() => emojiPacksService.requestEmojiPack(addr, readRelays), [addr, readRelays.join("|")]);

  return useSubject(subject);
}
