import { useRef } from "react";
import { Flex } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";

import { unique } from "../../../helpers/array";
import {
  COMMUNITY_APPROVAL_KIND,
  getApprovedEmbeddedNote,
  getCommunityMods,
  getCommunityRelays,
} from "../../../helpers/nostr/communities";
import { getEventCoordinate, getEventUID } from "../../../helpers/nostr/events";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import useSubject from "../../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { NostrEvent, isETag } from "../../../types/nostr-event";
import { EmbedEvent } from "../../../components/embed-event";
import useSingleEvent from "../../../hooks/use-single-event";
import { useAdditionalRelayContext } from "../../../providers/additional-relay-context";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import TimelineActionAndStatus from "../../../components/timeline-page/timeline-action-and-status";
import PostVoteButtons from "../components/post-vote-buttions";

function ApprovedEvent({ approval, community }: { approval: NostrEvent; community: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(approval));

  const additionalRelays = useAdditionalRelayContext();
  const embeddedEvent = getApprovedEmbeddedNote(approval);
  const eventTag = approval.tags.find(isETag);

  const loadEvent = useSingleEvent(
    eventTag?.[1],
    eventTag?.[2] ? [eventTag[2], ...additionalRelays] : additionalRelays,
  );
  const event = loadEvent || embeddedEvent;
  if (!event) return;
  return (
    <Flex ref={ref} gap="2" alignItems="flex-start" overflow="hidden">
      <PostVoteButtons event={event} community={community} />
      <EmbedEvent event={event} flex={1} />
    </Flex>
  );
}

export default function CommunityNewestView() {
  const { community } = useOutletContext() as { community: NostrEvent };
  const mods = getCommunityMods(community);

  const readRelays = useReadRelayUrls(getCommunityRelays(community));
  const timeline = useTimelineLoader(`${getEventUID(community)}-approved-posts`, readRelays, {
    authors: unique([community.pubkey, ...mods]),
    kinds: [COMMUNITY_APPROVAL_KIND],
    "#a": [getEventCoordinate(community)],
  });

  const approvals = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <>
      <IntersectionObserverProvider callback={callback}>
        {approvals.map((approval) => (
          <ApprovedEvent key={getEventUID(approval)} approval={approval} community={community} />
        ))}
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}
