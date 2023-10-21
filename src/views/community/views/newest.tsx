import { memo } from "react";
import { Flex } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";

import { buildApprovalMap, getCommunityMods } from "../../../helpers/nostr/communities";
import useSubject from "../../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import { NostrEvent } from "../../../types/nostr-event";
import IntersectionObserverProvider from "../../../providers/intersection-observer";
import TimelineActionAndStatus from "../../../components/timeline-page/timeline-action-and-status";
import PostVoteButtons from "../components/post-vote-buttions";
import TimelineLoader from "../../../classes/timeline-loader";
import CommunityPost from "../components/community-post";

const ApprovedEvent = memo(
  ({ event, approvals, community }: { event: NostrEvent; approvals: NostrEvent[]; community: NostrEvent }) => {
    return (
      <Flex gap="2" alignItems="flex-start" overflow="hidden">
        <PostVoteButtons event={event} community={community} />
        <Flex gap="2" direction="column" flex={1} overflow="hidden">
          <CommunityPost event={event} community={community} approvals={approvals} />
        </Flex>
      </Flex>
    );
  },
);

export default function CommunityNewestView() {
  const { community, timeline } = useOutletContext() as { community: NostrEvent; timeline: TimelineLoader };
  const mods = getCommunityMods(community);

  const events = useSubject(timeline.timeline);
  const approvalMap = buildApprovalMap(events, mods);

  const approved = events
    .filter((e) => approvalMap.has(e.id))
    .map((event) => ({ event, approvals: approvalMap.get(event.id) }));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <>
      <IntersectionObserverProvider callback={callback}>
        {approved.map(({ event, approvals }) => (
          <ApprovedEvent key={event.id} event={event} approvals={approvals ?? []} community={community} />
        ))}
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}
