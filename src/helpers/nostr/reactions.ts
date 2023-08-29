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
  return Array.from(Object.values(groups)).sort((a, b) => b.count - a.count);
}

export function draftEventReaction(event: NostrEvent, emoji = "+", url?: string) {
  const draft: DraftNostrEvent = {
    kind: Kind.Reaction,
    content: url ? ":" + emoji + ":" : emoji,
    tags: [
      ["e", event.id],
      ["p", event.pubkey], // TODO: pick a relay for the user
    ],
    created_at: dayjs().unix(),
  };

  if (url) draft.tags.push(["emoji", emoji, url]);

  return draft;
}
