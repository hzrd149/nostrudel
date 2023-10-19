import { MouseEventHandler, memo, useCallback, useRef } from "react";
import { AvatarGroup, Card, CardBody, CardFooter, CardHeader, Flex, Heading, LinkBox, Text } from "@chakra-ui/react";
import { useOutletContext, Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";

import { COMMUNITY_APPROVAL_KIND, buildApprovalMap, getCommunityMods } from "../../../helpers/nostr/communities";
import { getEventUID } from "../../../helpers/nostr/events";
import useSubject from "../../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import { NostrEvent } from "../../../types/nostr-event";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import TimelineActionAndStatus from "../../../components/timeline-page/timeline-action-and-status";
import PostVoteButtons from "../components/post-vote-buttions";
import TimelineLoader from "../../../classes/timeline-loader";
import UserAvatarLink from "../../../components/user-avatar-link";
import { useNavigateInDrawer } from "../../../providers/drawer-sub-view-provider";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { InlineNoteContent } from "../../../components/note/inline-note-content";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { UserLink } from "../../../components/user-link";

function ApprovalIcon({ approval }: { approval: NostrEvent }) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(approval));

  return <UserAvatarLink pubkey={approval.pubkey} ref={ref} size="xs" />;
}
const ApprovedEvent = memo(
  ({ event, approvals, community }: { event: NostrEvent; approvals: NostrEvent[]; community: NostrEvent }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    useRegisterIntersectionEntity(ref, getEventUID(event));

    // const additionalRelays = useAdditionalRelayContext();
    // const embeddedEvent = getApprovedEmbeddedNote(approval);
    // const eventTag = approval.tags.find(isETag);

    // const loadEvent = useSingleEvent(
    //   eventTag?.[1],
    //   eventTag?.[2] ? [eventTag[2], ...additionalRelays] : additionalRelays,
    // );
    // const event = loadEvent || embeddedEvent;
    // if (!event) return;

    const navigate = useNavigateInDrawer();
    const to = `/n/${getSharableEventAddress(event)}`;

    const handleClick = useCallback<MouseEventHandler>(
      (e) => {
        e.preventDefault();
        navigate(to);
      },
      [navigate, to],
    );

    return (
      <Flex ref={ref} gap="2" alignItems="flex-start" overflow="hidden">
        <PostVoteButtons event={event} community={community} />
        <Flex gap="2" direction="column" flex={1}>
          <Card as={LinkBox}>
            <CardHeader px="2" pt="4" pb="0">
              <Heading size="md">
                <HoverLinkOverlay as={RouterLink} to={to} onClick={handleClick}>
                  {event.content.match(/^[^\n\t]+/)}
                </HoverLinkOverlay>
              </Heading>
            </CardHeader>
            <CardBody p="2">
              <InlineNoteContent event={event} maxLength={96} />
            </CardBody>
            <CardFooter display="flex" gap="2" alignItems="center" p="2">
              <Text>
                Posted {dayjs.unix(event.created_at).fromNow()} by <UserLink pubkey={event.pubkey} fontWeight="bold" />
              </Text>
              <Text fontSize="sm" ml="auto">
                Approved by
              </Text>
              <AvatarGroup>
                {approvals.map((approval) => (
                  <ApprovalIcon key={approval.id} approval={approval} />
                ))}
              </AvatarGroup>
            </CardFooter>
          </Card>
        </Flex>
      </Flex>
    );
  },
);

export default function CommunityNewestView() {
  const { community, timeline } = useOutletContext() as { community: NostrEvent; timeline: TimelineLoader };
  const mods = getCommunityMods(community);

  const events = useSubject(timeline.timeline);
  const approvalMap = buildApprovalMap(events);

  const approved = events
    .filter((e) => approvalMap.has(e.id))
    .map((event) => ({ event, approvals: approvalMap.get(event.id) }));

  const approvals = events.filter((e) => e.kind === COMMUNITY_APPROVAL_KIND && mods.includes(e.pubkey));
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
