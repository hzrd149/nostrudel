import { useCallback, useMemo, useRef, useState } from "react";
import { Box, Card, Flex, IconButton, Text, useToast } from "@chakra-ui/react";
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
import { ChevronUpIcon } from "../../../components/icons";
import { ChevronDownIcon } from "@chakra-ui/icons";
import useEventReactions from "../../../hooks/use-event-reactions";
import { useMeasure, useStartTyping } from "react-use";
import { draftEventReaction } from "../../../helpers/nostr/reactions";
import eventReactionsService from "../../../services/event-reactions";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";
import { useSigningContext } from "../../../providers/signing-provider";
import { useCurrentAccount } from "../../../hooks/use-current-account";

function ApprovalVoteButtons({ event, community }: { event: NostrEvent; community: NostrEvent }) {
  const account = useCurrentAccount();
  const reactions = useEventReactions(event.id);
  const toast = useToast();

  const voteReactions = useMemo(() => {
    return reactions?.filter((r) => r.content === "+" || r.content === "-") ?? [];
  }, [reactions]);
  const vote = useMemo(() => {
    return voteReactions.reduce((t, r) => {
      if (r.content === "+") return t + 1;
      else if (r.content === "-") return t - 1;
      return t;
    }, 0);
  }, [voteReactions]);

  const myVote = reactions?.find((e) => e.pubkey === account?.pubkey);

  const { requestSignature } = useSigningContext();
  const [loading, setLoading] = useState(false);
  const addVote = useCallback(
    async (vote: string) => {
      setLoading(true);
      try {
        const draft = draftEventReaction(event, vote);

        const signed = await requestSignature(draft);
        if (signed) {
          const writeRelays = clientRelaysService.getWriteUrls();
          const communityRelays = getCommunityRelays(community);
          new NostrPublishAction("Reaction", unique([...writeRelays, ...communityRelays]), signed);
          eventReactionsService.handleEvent(signed);
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setLoading(false);
    },
    [event, community, requestSignature],
  );

  return (
    <Card direction="column" alignItems="center" borderRadius="lg">
      <IconButton
        aria-label="up vote"
        title="up vote"
        icon={<ChevronUpIcon boxSize={6} />}
        size="sm"
        variant={myVote?.content === "+" ? "solid" : "ghost"}
        isLoading={loading}
        onClick={() => addVote("+")}
        isDisabled={!account || !!myVote}
        colorScheme={myVote ? "primary" : "gray"}
      />
      {voteReactions.length > 0 && <Text my="1">{vote}</Text>}
      <IconButton
        aria-label="down vote"
        title="down vote"
        icon={<ChevronDownIcon boxSize={6} />}
        size="sm"
        variant={myVote?.content === "-" ? "solid" : "ghost"}
        isLoading={loading}
        onClick={() => addVote("-")}
        isDisabled={!account || !!myVote}
      />
    </Card>
  );
}

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
      <ApprovalVoteButtons event={event} community={community} />
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
