import { Reaction } from "applesauce-common/casts";

export type ReactionGroup = { emoji: string; url?: string; name?: string; pubkeys: string[] };

export function groupReactions(reactions: Reaction[]): ReactionGroup[] {
  const groups: Record<string, ReactionGroup> = {};
  for (const reaction of reactions) {
    const emoji = reaction.content;
    const customEmoji = reaction.emoji;
    groups[emoji] = groups[emoji] || { emoji, url: customEmoji?.url, name: customEmoji?.shortcode, pubkeys: [] };
    if (!groups[emoji].pubkeys.includes(reaction.event.pubkey)) {
      groups[emoji].pubkeys.push(reaction.event.pubkey);
    }
  }
  return Object.values(groups).sort((a, b) => b.pubkeys.length - a.pubkeys.length);
}
