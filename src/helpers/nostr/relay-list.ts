import dayjs from "dayjs";
import { NostrEvent, isRTag } from "../../types/nostr-event";

export function relayListAddRelay(list: NostrEvent, relay: string) {
  if (list.tags.some((t) => isRTag(t) && t[1] === relay)) throw new Error("relay already in list");
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, ["r", relay]],
  };
}
export function relayListRemoveRelay(list: NostrEvent, relay: string) {
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => isRTag(t) && t[1] !== relay),
  };
}
