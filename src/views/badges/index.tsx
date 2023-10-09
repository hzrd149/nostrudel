import { useRef } from "react";
import {
  AvatarGroup,
  Button,
  Card,
  Flex,
  Heading,
  Image,
  Link,
  LinkBox,
  LinkOverlay,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { Navigate, Link as RouterLink } from "react-router-dom";
import { Kind } from "nostr-tools";

import { ExternalLinkIcon } from "../../components/icons";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import { NostrEvent, isPTag } from "../../types/nostr-event";
import { UserLink } from "../../components/user-link";
import { UserAvatar } from "../../components/user-avatar";
import { getBadgeAwardBadge, getBadgeImage, getBadgeName } from "../../helpers/nostr/badges";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { getEventUID } from "../../helpers/nostr/events";
import { getSharableEventAddress } from "../../helpers/nip19";
import { UserAvatarLink } from "../../components/user-avatar-link";
import Timestamp from "../../components/timestamp";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";

function BadgeAwardCard({ award }: { award: NostrEvent }) {
  const badge = useReplaceableEvent(getBadgeAwardBadge(award));

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, badge && getEventUID(badge));

  if (!badge) return null;

  const naddr = getSharableEventAddress(badge);
  return (
    <Card p="2" variant="outline" gap="2" flexDirection={["column", null, "row"]} ref={ref}>
      <Flex as={LinkBox} direction="column" overflow="hidden" gap="2" w="40" mx="auto">
        <Image aspectRatio={1} src={getBadgeImage(badge)?.src ?? ""} w="40" />
        <Heading size="sm" isTruncated>
          <LinkOverlay as={RouterLink} to={`/badges/${naddr}`}>
            {getBadgeName(badge)}
          </LinkOverlay>
        </Heading>
      </Flex>
      <Flex gap="2" direction="column" flex={1}>
        <Flex gap="2" alignItems="center">
          <UserAvatar pubkey={award.pubkey} size="sm" />
          <UserLink pubkey={award.pubkey} fontWeight="bold" />
          <Text>Awarded:</Text>
          <Spacer />
          <Timestamp timestamp={award.created_at} />
        </Flex>
        <Flex gap="2" wrap="wrap">
          {award.tags.filter(isPTag).map((t) => (
            <Flex key={t[1]} gap="2" alignItems="center">
              <UserAvatarLink pubkey={t[1]} size="sm" />
              <UserLink pubkey={t[1]} fontWeight="bold" />
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}

function BadgesPage() {
  const { filter, listId } = usePeopleListContext();
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(`${listId}-lists`, readRelays, {
    ...filter,
    kinds: [Kind.BadgeAward],
  });

  const awards = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap">
        <Button as={RouterLink} to="/badges/browse">
          Browse Badges
        </Button>
        <Spacer />
        <Button
          as={Link}
          href="https://badges.page/"
          isExternal
          rightIcon={<ExternalLinkIcon />}
          leftIcon={<Image src="https://badges.page/favicon.ico" w="1.2em" />}
        >
          Badges
        </Button>
      </Flex>
      <Flex gap="2" alignItems="center">
        <Heading size="lg">Recent awards</Heading>
        <PeopleListSelection />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        {awards.map((award) => (
          <BadgeAwardCard key={award.id} award={award} />
        ))}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function BadgesView() {
  // const account = useCurrentAccount();
  // return account ? <BadgesPage /> : <Navigate to="/lists/browse" />;
  return (
    <PeopleListProvider initList="global">
      <BadgesPage />
    </PeopleListProvider>
  );
}
