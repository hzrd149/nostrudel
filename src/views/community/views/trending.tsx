import { memo, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";

import {
  buildApprovalMap,
  getCommunityMods,
  getCommunityPostVote,
  getCommunityRelays,
} from "../../../helpers/nostr/communities";
import useSubject from "../../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import { NostrEvent } from "../../../types/nostr-event";
import IntersectionObserverProvider from "../../../providers/intersection-observer";
import TimelineActionAndStatus from "../../../components/timeline-page/timeline-action-and-status";
import PostVoteButtons from "../components/post-vote-buttions";
import TimelineLoader from "../../../classes/timeline-loader";
import CommunityPost from "../components/community-post";
import useUserMuteFilter from "../../../hooks/use-user-mute-filter";
import useEventsReactions from "../../../hooks/use-events-reactions";
import { groupReactions } from "../../../helpers/nostr/reactions";

const ApprovedEvent = memo(
  ({ event, approvals, community }: { event: NostrEvent; approvals: NostrEvent[]; community: NostrEvent }) => {
    return (
      <Flex gap="2" alignItems="flex-start">
        <PostVoteButtons event={event} community={community} flexShrink={0} />
        <CommunityPost event={event} community={community} approvals={approvals} flex={1} />
      </Flex>
    );
  },
);

export default function CommunityTrendingView() {
  const { community, timeline } = useOutletContext() as { community: NostrEvent; timeline: TimelineLoader };
  const muteFilter = useUserMuteFilter();
  const mods = getCommunityMods(community);

  const events = useSubject(timeline.timeline);
  const approvalMap = buildApprovalMap(events, mods);

  const approved = events
    .filter((e) => approvalMap.has(e.id))
    .map((event) => ({ event, approvals: approvalMap.get(event.id) }))
    .filter((e) => !muteFilter(e.event));

  // fetch votes for approved posts
  const eventReactions = useEventsReactions(
    approved.map((e) => e.event.id),
    getCommunityRelays(community),
  );
  const eventVotes = useMemo(() => {
    const dir: Record<string, number> = {};
    for (const [id, reactions] of Object.entries(eventReactions)) {
      const grouped = groupReactions(reactions);
      const { vote } = getCommunityPostVote(grouped);
      dir[id] = vote;
    }
    return dir;
  }, [eventReactions]);

  const sorted = approved.sort((a, b) => (eventVotes[b.event.id] ?? 0) - (eventVotes[a.event.id] ?? 0));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <>
      <IntersectionObserverProvider callback={callback}>
        {sorted.map(({ event, approvals }) => (
          <ApprovedEvent key={event.id} event={event} approvals={approvals ?? []} community={community} />
        ))}
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}
