import { useCallback, useState } from "react";
import { Button, Flex } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { useObservable } from "applesauce-react/hooks";
import dayjs from "dayjs";

import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import { getEventCoordinate, getEventUID } from "../../../helpers/nostr/event";
import {
  COMMUNITY_APPROVAL_KIND,
  buildApprovalMap,
  getCommunityMods,
  getCommunityRelays,
} from "../../../helpers/nostr/communities";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import { CheckIcon } from "../../../components/icons";
import useCurrentAccount from "../../../hooks/use-current-account";
import CommunityPost from "../components/community-post";
import { RouterContext } from "../community-home";
import useUserMuteFilter from "../../../hooks/use-user-mute-filter";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

type PendingProps = {
  event: NostrEvent;
  approvals: NostrEvent[];
  community: NostrEvent;
};

function ModPendingPost({ event, community, approvals }: PendingProps) {
  const publish = usePublishEvent();

  const ref = useEventIntersectionRef(event);

  const communityRelays = getCommunityRelays(community);
  const [loading, setLoading] = useState(false);
  const approve = useCallback(async () => {
    setLoading(true);
    const relay = communityRelays[0];
    const draft: DraftNostrEvent = {
      kind: COMMUNITY_APPROVAL_KIND,
      content: JSON.stringify(event),
      created_at: dayjs().unix(),
      tags: [
        relay ? ["a", getEventCoordinate(community), relay] : ["a", getEventCoordinate(community)],
        ["e", event.id],
        ["p", event.pubkey],
        ["k", String(event.kind)],
      ],
    };

    await publish("Approve", draft);
    setLoading(false);
  }, [event, publish, setLoading, community]);

  return (
    <Flex direction="column" gap="2" ref={ref}>
      <CommunityPost event={event} approvals={approvals} />
      <Flex gap="2">
        <Button
          colorScheme="primary"
          leftIcon={<CheckIcon />}
          size="sm"
          ml="auto"
          onClick={approve}
          isLoading={loading}
        >
          Approve
        </Button>
      </Flex>
    </Flex>
  );
}

export default function CommunityPendingView() {
  const account = useCurrentAccount();
  const muteFilter = useUserMuteFilter();
  const { community, timeline } = useOutletContext<RouterContext>();

  const events = useObservable(timeline.timeline) ?? [];

  const mods = getCommunityMods(community);
  const approvals = buildApprovalMap(events, mods);
  const pending = events.filter((e) => e.kind !== COMMUNITY_APPROVAL_KIND && !approvals.has(e.id) && !muteFilter(e));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  const isMod = !!account && mods.includes(account?.pubkey);
  const PostComponent = isMod ? ModPendingPost : CommunityPost;

  return (
    <>
      <IntersectionObserverProvider callback={callback}>
        {pending.map((event) => (
          <PostComponent key={getEventUID(event)} event={event} community={community} approvals={[]} />
        ))}
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}
