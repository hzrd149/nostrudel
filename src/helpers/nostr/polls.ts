import { kinds, NostrEvent } from "nostr-tools";

export const ZAPLESS_POLL_KIND = 6969;

export type PollOption = {
  id: string;
  label: string;
};

export type PollResult = PollOption & {
  count: number;
  percent: number;
  voters: string[];
};

export function getPollOptions(event: NostrEvent): PollOption[] {
  return event.tags
    .filter((tag) => tag[0] === "poll_option" && tag[1] && tag[2])
    .map((tag) => ({ id: tag[1], label: tag[2] }))
    .sort((a, b) => {
      const aIndex = Number(a.id);
      const bIndex = Number(b.id);
      if (Number.isFinite(aIndex) && Number.isFinite(bIndex)) return aIndex - bIndex;
      return a.id.localeCompare(b.id);
    });
}

function getNumericTag(event: NostrEvent, tagName: string) {
  const value = event.tags.find((tag) => tag[0] === tagName)?.[1];
  if (value === undefined) return undefined;

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function isZaplessPoll(event: NostrEvent) {
  if (event.kind !== ZAPLESS_POLL_KIND) return false;

  const minimum = getNumericTag(event, "value_minimum");
  const maximum = getNumericTag(event, "value_maximum");
  return minimum === 0 && maximum === 0 && getPollOptions(event).length > 0;
}

export function getPollResults(poll: NostrEvent, reactions: NostrEvent[]) {
  const options = getPollOptions(poll);
  const optionIds = new Set(options.map((option) => option.id));
  const latestVoteByPubkey = new Map<string, NostrEvent>();

  for (const reaction of reactions) {
    if (reaction.kind !== kinds.Reaction) continue;
    if (!optionIds.has(reaction.content)) continue;
    if (!reaction.tags.some((tag) => tag[0] === "e" && tag[1] === poll.id)) continue;

    const previous = latestVoteByPubkey.get(reaction.pubkey);
    if (!previous || reaction.created_at > previous.created_at) latestVoteByPubkey.set(reaction.pubkey, reaction);
  }

  const votersByOption = new Map<string, string[]>();
  for (const vote of latestVoteByPubkey.values()) {
    const voters = votersByOption.get(vote.content) ?? [];
    voters.push(vote.pubkey);
    votersByOption.set(vote.content, voters);
  }

  const total = latestVoteByPubkey.size;
  const results: PollResult[] = options.map((option) => {
    const voters = votersByOption.get(option.id) ?? [];
    return {
      ...option,
      voters,
      count: voters.length,
      percent: total > 0 ? Math.round((voters.length / total) * 100) : 0,
    };
  });

  return { results, total };
}

export function getAccountPollVote(poll: NostrEvent, reactions: NostrEvent[], pubkey?: string) {
  if (!pubkey) return undefined;

  return reactions
    .filter(
      (reaction) =>
        reaction.kind === kinds.Reaction &&
        reaction.pubkey === pubkey &&
        reaction.tags.some((tag) => tag[0] === "e" && tag[1] === poll.id),
    )
    .sort((a, b) => b.created_at - a.created_at)
    .find((reaction) => getPollOptions(poll).some((option) => option.id === reaction.content))?.content;
}