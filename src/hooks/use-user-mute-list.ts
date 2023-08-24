import useReplaceableEvent from "./use-replaceable-event";
import { MUTE_LIST_KIND } from "../helpers/nostr/lists";

export default function useUserMuteList(pubkey?: string, additionalRelays: string[] = [], alwaysRequest = true) {
  return useReplaceableEvent(pubkey && { kind: MUTE_LIST_KIND, pubkey }, additionalRelays, alwaysRequest);
}
