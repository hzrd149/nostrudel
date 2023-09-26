import { useRef } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import {
  COMMUNITY_APPROVAL_KIND,
  getApprovedEmbeddedNote,
  getCOmmunityRelays as getCommunityRelays,
  getCommunityImage,
  getCommunityMods,
  getCommunityName,
} from "../../helpers/nostr/communities";
import { NostrEvent, isETag } from "../../types/nostr-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import CommunityDescription from "../communities/components/community-description";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { getEventCoordinate, getEventUID } from "../../helpers/nostr/events";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { unique } from "../../helpers/array";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import CommunityJoinButton from "../communities/components/community-subscribe-button";
import useSingleEvent from "../../hooks/use-single-event";
import { EmbedEvent } from "../../components/embed-event";
import { AdditionalRelayProvider, useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { RelayIconStack } from "../../components/relay-icon-stack";

function ApprovedEvent({ approval }: { approval: NostrEvent }) {
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
    <Box ref={ref}>
      <EmbedEvent event={event} />
    </Box>
  );
}

export default function CommunityHomePage({ community }: { community: NostrEvent }) {
  const mods = getCommunityMods(community);
  const image = getCommunityImage(community);

  const communityRelays = getCommunityRelays(community);
  const readRelays = useReadRelayUrls(communityRelays);
  const timeline = useTimelineLoader(`${getEventUID(community)}-approved-posts`, readRelays, {
    authors: unique([community.pubkey, ...mods]),
    kinds: [COMMUNITY_APPROVAL_KIND],
    "#a": [getEventCoordinate(community)],
  });

  const approvals = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <AdditionalRelayProvider relays={communityRelays}>
      <VerticalPageLayout pt={image && "0"}>
        {image && (
          <Box
            backgroundImage={getCommunityImage(community)}
            backgroundRepeat="no-repeat"
            backgroundSize="contain"
            backgroundPosition="center"
            aspectRatio={4 / 1}
            backgroundColor="rgba(0,0,0,0.2)"
          />
        )}
        <Flex wrap="wrap" gap="2" alignItems="center">
          <Heading size="lg">{getCommunityName(community)}</Heading>
          <Text>Created by:</Text>
          <Flex gap="2">
            <UserAvatarLink pubkey={community.pubkey} size="xs" /> <UserLink pubkey={community.pubkey} />
          </Flex>
          <CommunityJoinButton community={community} ml="auto" />
        </Flex>
        <CommunityDescription community={community} />
        <Flex wrap="wrap" gap="2">
          <Text>Moderators:</Text>
          {mods.map((pubkey) => (
            <Flex gap="2">
              <UserAvatarLink pubkey={pubkey} size="xs" />
              <UserLink pubkey={pubkey} />
            </Flex>
          ))}
        </Flex>
        {communityRelays.length > 0 && (
          <Flex wrap="wrap" gap="2">
            <Text>Relays:</Text>
            <RelayIconStack relays={communityRelays} />
          </Flex>
        )}

        <IntersectionObserverProvider callback={callback}>
          {approvals.map((approval) => (
            <ApprovedEvent key={getEventUID(approval)} approval={approval} />
          ))}
        </IntersectionObserverProvider>
      </VerticalPageLayout>
    </AdditionalRelayProvider>
  );
}
