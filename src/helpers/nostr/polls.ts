import {
  getPollEndsAt,
  getPollOptions,
  getPollResponseVotes,
  POLL_KIND,
  POLL_RESPONSE_KIND,
  type PollOption,
} from "applesauce-common/helpers";
import { NostrEvent } from "nostr-tools";

export { POLL_KIND, POLL_RESPONSE_KIND, getPollOptions };
export type { PollOption };

export type PollResult = PollOption & {
  count: number;
  percent: number;
  voters: string[];
};

export function isPoll(event: NostrEvent) {
  return event.kind === POLL_KIND && getPollOptions(event).length > 0;
}

export function getPollResponses(poll: NostrEvent, responses: NostrEvent[]) {
  const endsAt = getPollEndsAt(poll);
  const latestResponseByPubkey = new Map<string, NostrEvent>();

  for (const response of responses) {
    if (response.kind !== POLL_RESPONSE_KIND) continue;
    if (endsAt && response.created_at > endsAt) continue;

    const votes = getPollResponseVotes(poll, response);
    if (!votes || votes.length === 0) continue;

    const previous = latestResponseByPubkey.get(response.pubkey);
    if (!previous || response.created_at > previous.created_at) latestResponseByPubkey.set(response.pubkey, response);
  }

  return Array.from(latestResponseByPubkey.values()).sort((a, b) => a.created_at - b.created_at);
}

export function getPollResults(poll: NostrEvent, responses: NostrEvent[]) {
  const options = getPollOptions(poll);
  const optionIds = new Set(options.map((option) => option.id));
  const votersByOption = new Map<string, string[]>();
  const latestResponses = getPollResponses(poll, responses);

  for (const response of latestResponses) {
    const votes = getPollResponseVotes(poll, response) ?? [];
    for (const optionId of votes) {
      if (!optionIds.has(optionId)) continue;

      const voters = votersByOption.get(optionId) ?? [];
      voters.push(response.pubkey);
      votersByOption.set(optionId, voters);
    }
  }

  const total = latestResponses.length;
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

export function getAccountPollVote(poll: NostrEvent, responses: NostrEvent[], pubkey?: string) {
  if (!pubkey) return [];

  const response = getPollResponses(poll, responses)
    .filter((response) => response.pubkey === pubkey)
    .at(-1);

  return response ? (getPollResponseVotes(poll, response) ?? []) : [];
}
