import { NostrEvent } from "nostr-tools";

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

export function getEventReactionScore(grouped: ReactionGroup[]) {
  const up = grouped.find((r) => r.emoji === "+");
  const down = grouped.find((r) => r.emoji === "-");
  const vote = (up?.pubkeys.length ?? 0) - (down?.pubkeys.length ?? 0);
  return { up, down, vote };
}
