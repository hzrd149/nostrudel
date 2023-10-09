import { useNavigate, useParams } from "react-router-dom";
import { Kind, nip19 } from "nostr-tools";
import { Box, Button, Divider, Flex, Heading, Image, SimpleGrid, Spacer, Spinner, Text } from "@chakra-ui/react";

import { ChevronLeftIcon } from "../../components/icons";
import { useDeleteEventContext } from "../../providers/delete-event-provider";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { EventRelays } from "../../components/note/note-relays";
import { getBadgeAwardPubkey, getBadgeDescription, getBadgeImage, getBadgeName } from "../../helpers/nostr/badges";
import BadgeMenu from "./components/badge-menu";
import BadgeAwardCard from "./components/award-card";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useCurrentAccount } from "../../hooks/use-current-account";
import useSubject from "../../hooks/use-subject";
import { NostrEvent } from "../../types/nostr-event";
import { getEventCoordinate } from "../../helpers/nostr/events";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import { ErrorBoundary } from "../../components/error-boundary";
import Timestamp from "../../components/timestamp";
import VerticalPageLayout from "../../components/vertical-page-layout";

function BadgeDetailsPage({ badge }: { badge: NostrEvent }) {
  const navigate = useNavigate();
  const { deleteEvent } = useDeleteEventContext();
  const account = useCurrentAccount();

  const image = getBadgeImage(badge);
  const description = getBadgeDescription(badge);

  const readRelays = useReadRelayUrls();
  const coordinate = getEventCoordinate(badge);
  const awardsTimeline = useTimelineLoader(`${coordinate}-awards`, readRelays, {
    "#a": [coordinate],
    kinds: [Kind.BadgeAward],
  });

  const awards = useSubject(awardsTimeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(awardsTimeline);

  if (!badge) return <Spinner />;

  const isAuthor = account?.pubkey === badge.pubkey;
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

        {isAuthor && (
          <Button colorScheme="red" onClick={() => deleteEvent(badge).then(() => navigate("/lists"))}>
            Delete
          </Button>
        )}
        <BadgeMenu aria-label="More options" badge={badge} />
      </Flex>

      <Flex direction={{ base: "column", lg: "row" }} gap="2">
        {image && <Image src={image.src} maxW="3in" mr="2" mb="2" mx={{ base: "auto", lg: "initial" }} />}
        <Flex direction="column" gap="2">
          <Heading size="md">{getBadgeName(badge)}</Heading>
          <Text>
            Created by: <UserAvatarLink pubkey={badge.pubkey} size="xs" />{" "}
            <UserLink fontWeight="bold" pubkey={badge.pubkey} />
          </Text>
          <Text>
            Created: <Timestamp timestamp={badge.created_at} />
          </Text>
          {description && <Text pb="2">{description}</Text>}
        </Flex>
      </Flex>

      {awards.length > 0 && (
        <>
          <IntersectionObserverProvider callback={callback}>
            <Heading size="md">Awarded to</Heading>
            <Divider />
            <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
              {awards.map((award) => (
                <>
                  {getBadgeAwardPubkey(award).map(({ pubkey }) => (
                    <BadgeAwardCard award={award} pubkey={pubkey} />
                  ))}
                </>
              ))}
            </SimpleGrid>
          </IntersectionObserverProvider>
        </>
      )}
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
