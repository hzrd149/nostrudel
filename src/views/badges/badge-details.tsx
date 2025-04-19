import { useNavigate } from "react-router-dom";
import { kinds } from "nostr-tools";
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
import { getBadgeAwardPubkeys, getBadgeDescription, getBadgeImage, getBadgeName } from "../../helpers/nostr/badges";
import BadgeMenu from "./components/badge-menu";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { NostrEvent } from "nostr-tools";
import { getEventCoordinate } from "../../helpers/nostr/event";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import Timestamp from "../../components/timestamp";
import VerticalPageLayout from "../../components/vertical-page-layout";
import BadgeAwardCard from "./components/badge-award-card";
import { ErrorBoundary } from "../../components/error-boundary";
import useParamsAddressPointer from "../../hooks/use-params-address-pointer";

function BadgeActivityTab({ awards }: { awards: NostrEvent[] }) {
  return (
    <Flex direction="column" gap="4">
      {awards?.map((award) => (
        <ErrorBoundary key={award.id}>
          <BadgeAwardCard award={award} showImage={false} />
        </ErrorBoundary>
      ))}
    </Flex>
  );
}

function BadgeUsersTab({ awards }: { awards: NostrEvent[] }) {
  const pubkeys = new Set<string>();
  if (awards) {
    for (const award of awards) {
      for (const { pubkey } of getBadgeAwardPubkeys(award)) {
        pubkeys.add(pubkey);
      }
    }
  }

  return (
    <SimpleGrid spacing={4} columns={[1, 2, 2, 3, 4, 5, 6]}>
      {Array.from(pubkeys).map((pubkey) => (
        <Flex key={pubkey} gap="2" alignItems="center">
          <UserAvatarLink pubkey={pubkey} size="md" />
          <UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
        </Flex>
      ))}
    </SimpleGrid>
  );
}

function BadgeDetailsPage({ badge }: { badge: NostrEvent }) {
  const navigate = useNavigate();

  const image = getBadgeImage(badge);
  const description = getBadgeDescription(badge);

  const readRelays = useReadRelays();
  const coordinate = getEventCoordinate(badge);
  const { loader, timeline } = useTimelineLoader(`${coordinate}-awards`, readRelays, {
    "#a": [coordinate],
    kinds: [kinds.BadgeAward],
  });

  const callback = useTimelineCurserIntersectionCallback(loader);

  if (!badge) return <Spinner />;

  return (
    <VerticalPageLayout>
      <IntersectionObserverProvider callback={callback}>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />}>
            Back
          </Button>

          <UserAvatarLink pubkey={badge.pubkey} size="sm" />
          <UserLink fontWeight="bold" pubkey={badge.pubkey} />
          <Text>|</Text>
          <Heading size="md">{getBadgeName(badge)}</Heading>

          <Spacer />

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
              <BadgeActivityTab awards={timeline} />
            </TabPanel>
            <TabPanel>
              <BadgeUsersTab awards={timeline} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function BadgeDetailsView() {
  const pointer = useParamsAddressPointer("naddr");
  const badge = useReplaceableEvent(pointer);

  if (!badge) return <Spinner />;

  return <BadgeDetailsPage badge={badge} />;
}
