import { useNavigate, useParams } from "react-router-dom";
import { Kind, nip19 } from "nostr-tools";
import {
  Button,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Spacer,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";

import { ChevronLeftIcon } from "../../components/icons";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { EventRelays } from "../../components/note/note-relays";
import { getBadgeAwardPubkeys, getBadgeDescription, getBadgeImage, getBadgeName } from "../../helpers/nostr/badges";
import BadgeMenu from "./components/badge-menu";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import { NostrEvent } from "../../types/nostr-event";
import { getEventCoordinate } from "../../helpers/nostr/events";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import Timestamp from "../../components/timestamp";
import VerticalPageLayout from "../../components/vertical-page-layout";
import BadgeAwardCard from "./components/badge-award-card";
import TimelineLoader from "../../classes/timeline-loader";

function BadgeActivityTab({ timeline }: { timeline: TimelineLoader }) {
  const awards = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <Flex direction="column" gap="4">
      <IntersectionObserverProvider callback={callback}>
        {awards.map((award) => (
          <BadgeAwardCard key={award.id} award={award} showImage={false} />
        ))}
      </IntersectionObserverProvider>
    </Flex>
  );
}

function BadgeUsersTab({ timeline }: { timeline: TimelineLoader }) {
  const awards = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const pubkeys = new Set<string>();
  for (const award of awards) {
    for (const { pubkey } of getBadgeAwardPubkeys(award)) {
      pubkeys.add(pubkey);
    }
  }

  return (
    <SimpleGrid spacing={4} columns={[1, 2, 2, 3, 4, 5, 6]}>
      <IntersectionObserverProvider callback={callback}>
        {Array.from(pubkeys).map((pubkey) => (
          <Flex key={pubkey} gap="2" alignItems="center">
            <UserAvatarLink pubkey={pubkey} size="md" />
            <UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
          </Flex>
        ))}
      </IntersectionObserverProvider>
    </SimpleGrid>
  );
}

function BadgeDetailsPage({ badge }: { badge: NostrEvent }) {
  const navigate = useNavigate();

  const image = getBadgeImage(badge);
  const description = getBadgeDescription(badge);

  const readRelays = useReadRelayUrls();
  const coordinate = getEventCoordinate(badge);
  const awardsTimeline = useTimelineLoader(`${coordinate}-awards`, readRelays, {
    "#a": [coordinate],
    kinds: [Kind.BadgeAward],
  });

  if (!badge) return <Spinner />;

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />}>
          Back
        </Button>

        <UserAvatarLink pubkey={badge.pubkey} size="sm" />
        <UserLink fontWeight="bold" pubkey={badge.pubkey} />
        <Text>|</Text>
        <Heading size="md">{getBadgeName(badge)}</Heading>

        <Spacer />

        <EventRelays event={badge} />

        <BadgeMenu aria-label="More options" badge={badge} />
      </Flex>

      <Flex direction={{ base: "column", lg: "row" }} gap="4">
        {image && (
          <Image src={image.src} maxW="3in" mr="2" mb="2" mx={{ base: "auto", lg: "initial" }} borderRadius="lg" />
        )}
        <Flex direction="column">
          <Heading size="md">{getBadgeName(badge)}</Heading>
          <Text>
            Created by: <UserAvatarLink pubkey={badge.pubkey} size="xs" />{" "}
            <UserLink fontWeight="bold" pubkey={badge.pubkey} />
          </Text>
          <Text>
            Created: <Timestamp timestamp={badge.created_at} />
          </Text>
          {description && (
            <>
              <Heading size="md" mt="2">
                Description
              </Heading>
              <Text pb="2">{description}</Text>
            </>
          )}
        </Flex>
      </Flex>

      <Tabs colorScheme="primary" isLazy>
        <TabList>
          <Tab>Activity</Tab>
          <Tab>Users</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px="0">
            <BadgeActivityTab timeline={awardsTimeline} />
          </TabPanel>
          <TabPanel>
            <BadgeUsersTab timeline={awardsTimeline} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VerticalPageLayout>
  );
}

function useBadgeCoordinate() {
  const { naddr } = useParams() as { naddr: string };
  const parsed = nip19.decode(naddr);
  if (parsed.type !== "naddr") throw new Error(`Unknown type ${parsed.type}`);
  return parsed.data;
}

export default function BadgeDetailsView() {
  const pointer = useBadgeCoordinate();
  const badge = useReplaceableEvent(pointer);

  if (!badge) return <Spinner />;

  return <BadgeDetailsPage badge={badge} />;
}
