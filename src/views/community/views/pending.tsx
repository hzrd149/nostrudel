import { useCallback, useRef, useState } from "react";
import { Box, Button, Flex, useToast } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import dayjs from "dayjs";

import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import { getEventCoordinate, getEventUID } from "../../../helpers/nostr/events";
import {
  COMMUNITY_APPROVAL_KIND,
  buildApprovalMap,
  getCommunityMods,
  getCommunityRelays,
} from "../../../helpers/nostr/communities";
import useSubject from "../../../hooks/use-subject";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { EmbedEvent } from "../../../components/embed-event";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../../components/timeline-page/timeline-action-and-status";
import TimelineLoader from "../../../classes/timeline-loader";
import { CheckIcon } from "../../../components/icons";
import { useSigningContext } from "../../../providers/signing-provider";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { useWriteRelayUrls } from "../../../hooks/use-client-relays";

type PendingProps = {
  event: NostrEvent;
  community: NostrEvent;
};

function ModPendingPost({ event, community }: PendingProps) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  const communityRelays = getCommunityRelays(community);
  const writeRelays = useWriteRelayUrls(communityRelays);
  const [loading, setLoading] = useState(false);
  const approve = useCallback(async () => {
    setLoading(true);
    try {
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

      const signed = await requestSignature(draft);
      new NostrPublishAction("Approve", writeRelays, signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  }, [event, requestSignature, writeRelays, setLoading, community]);

  return (
    <Flex direction="column" gap="2" ref={ref}>
      <EmbedEvent event={event} />
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

function PendingPost({ event }: PendingProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <Box ref={ref}>
      <EmbedEvent event={event} />
    </Box>
  );
}

export default function CommunityPendingView() {
  const account = useCurrentAccount();
  const { community, timeline } = useOutletContext() as { community: NostrEvent; timeline: TimelineLoader };

  const events = useSubject(timeline.timeline);

  const mods = getCommunityMods(community);
  const approvals = buildApprovalMap(events, mods);
  const pending = events.filter((e) => e.kind !== COMMUNITY_APPROVAL_KIND && !approvals.has(e.id));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  const isMod = !!account && mods.includes(account?.pubkey);
  const PostComponent = isMod ? ModPendingPost : PendingPost;

  return (
    <>
      <IntersectionObserverProvider callback={callback}>
        {pending.map((event) => (
          <PostComponent key={getEventUID(event)} event={event} community={community} />
        ))}
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}
