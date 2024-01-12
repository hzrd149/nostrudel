import { kinds } from "nostr-tools";
import { DraftNostrEvent, NostrEvent, Tag } from "../../types/nostr-event";
import dayjs from "dayjs";
import { getEventCoordinate, isReplaceable } from "./events";

export type ReactionGroup = { emoji: string; url?: string; name?: string; count: number; pubkeys: string[] };

export function groupReactions(reactions: NostrEvent[]) {
  const groups: Record<string, ReactionGroup> = {};
  for (const reactionEvent of reactions) {
    const emoji = reactionEvent.content;
    const emojiTag = reactionEvent.tags.find((t) => t[0] === "emoji");
    const name = emojiTag?.[2];
    const url = emojiTag?.[2];
    groups[emoji] = groups[emoji] || { emoji, url, name, count: 0, pubkeys: [] };
    groups[emoji].count++;
    if (!groups[emoji].pubkeys.includes(reactionEvent.pubkey)) {
      groups[emoji].pubkeys.push(reactionEvent.pubkey);
    }
  }
  return Array.from(Object.values(groups)).sort((a, b) => b.pubkeys.length - a.pubkeys.length);
}

export function draftEventReaction(event: NostrEvent, emoji = "+", url?: string) {
  const tags: Tag[] = [
    ["e", event.id],
    ["p", event.pubkey],
  ];
  const draft: DraftNostrEvent = {
    kind: kinds.Reaction,
    content: url ? ":" + emoji + ":" : emoji,
    tags: isReplaceable(event.kind) ? [...tags, ["a", getEventCoordinate(event)]] : tags,
    created_at: dayjs().unix(),
  };

  if (url) draft.tags.push(["emoji", emoji, url]);

  return draft;
}
