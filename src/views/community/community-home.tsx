import { Avatar, Box, Flex, Heading, Text } from "@chakra-ui/react";

import {
  COMMUNITY_APPROVAL_KIND,
  getCOmmunityRelays,
  getCommunityImage,
  getCommunityMods,
  getCommunityName,
} from "../../helpers/nostr/communities";
import { NostrEvent } from "../../types/nostr-event";
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
import IntersectionObserverProvider from "../../providers/intersection-observer";
import Note from "../../components/note";

export default function CommunityHomePage({ community }: { community: NostrEvent }) {
  const mods = getCommunityMods(community);
  const image = getCommunityImage(community);

  const readRelays = useReadRelayUrls(getCOmmunityRelays(community));
  const timeline = useTimelineLoader(`${getEventUID(community)}-appoved-posts`, readRelays, {
    authors: unique([community.pubkey, ...mods]),
    kinds: [COMMUNITY_APPROVAL_KIND],
    "#a": [getEventCoordinate(community)],
  });

  const approvals = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      {image && (
        <Box
          backgroundImage={getCommunityImage(community)}
          backgroundRepeat="no-repeat"
          backgroundSize="cover"
          backgroundPosition="center"
          aspectRatio={4 / 1}
        />
      )}
      <Flex wrap="wrap" gap="2" alignItems="center">
        <Heading size="lg">{getCommunityName(community)}</Heading>
        <Text>Created by:</Text>
        <Flex gap="2">
          <UserAvatarLink pubkey={community.pubkey} size="xs" /> <UserLink pubkey={community.pubkey} />
        </Flex>
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

      <IntersectionObserverProvider callback={callback}>
        {approvals.map((approval) => (
          <Note key={getEventUID(approval)} event={approval} />
        ))}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
