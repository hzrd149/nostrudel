import { Kind } from "nostr-tools";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import dayjs from "dayjs";

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

export function draftEventReaction(reacted: NostrEvent, emoji = "+", url?: string) {
  // only keep the e, and p tags on the parent event
  const inheritedTags = reacted.tags.filter((tag) => tag.length >= 2 && (tag[0] === "e" || tag[0] === "p"));

  const draft: DraftNostrEvent = {
    kind: Kind.Reaction,
    content: url ? ":" + emoji + ":" : emoji,
    tags: [...inheritedTags, ["e", reacted.id], ["p", reacted.pubkey]],
    created_at: dayjs().unix(),
  };

  if (url) draft.tags.push(["emoji", emoji, url]);

  return draft;
}
