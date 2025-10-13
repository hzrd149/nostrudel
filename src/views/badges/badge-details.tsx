import {
  Button,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { useNavigate } from "react-router-dom";

import { useDisclosure } from "@chakra-ui/react";
import { getReplaceableAddress } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import GenericCommentForm from "../../components/comment/generic-comment-form";
import { GenericComments } from "../../components/comment/generic-comments";
import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import Timestamp from "../../components/timestamp";
import UserAvatar from "../../components/user/user-avatar";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import UserName from "../../components/user/user-name";
import { getBadgeAwardPubkeys, getBadgeDescription, getBadgeImage, getBadgeName } from "../../helpers/nostr/badges";
import { useReadRelays } from "../../hooks/use-client-relays";
import useParamsAddressPointer from "../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import BadgeAwardCard from "./components/badge-award-card";
import BadgeMenu from "./components/badge-menu";

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

function BadgeCommentsTab({ badge }: { badge: NostrEvent }) {
  const comment = useDisclosure();

  return (
    <Flex direction="column" gap="4">
      {comment.isOpen ? (
        <GenericCommentForm
          event={badge}
          onCancel={comment.onClose}
          onSubmitted={comment.onClose}
          aria-label="Add comment form"
        />
      ) : (
        <Button onClick={comment.onOpen} mr="auto">
          Add Comment
        </Button>
      )}

      <GenericComments event={badge} aria-label="Badge comments" />
    </Flex>
  );
}

function BadgeDetailsPage({ badge }: { badge: NostrEvent }) {
  const navigate = useNavigate();

  const image = getBadgeImage(badge);
  const description = getBadgeDescription(badge);

  const readRelays = useReadRelays();
  const coordinate = getReplaceableAddress(badge);
  const { loader, timeline } = useTimelineLoader(`${coordinate}-awards`, readRelays, {
    "#a": [coordinate],
    kinds: [kinds.BadgeAward],
  });

  const callback = useTimelineCurserIntersectionCallback(loader);

  if (!badge) return <Spinner />;

  return (
    <SimpleView
      icon={<UserAvatar pubkey={badge.pubkey} size="sm" />}
      title={
        <>
          <UserName pubkey={badge.pubkey} /> | {getBadgeName(badge)}
        </>
      }
      actions={<BadgeMenu aria-label="More options" badge={badge} variant="ghost" ms="auto" />}
    >
      <IntersectionObserverProvider callback={callback}>
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
            <Tab>Comments</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px="0">
              <BadgeActivityTab awards={timeline} />
            </TabPanel>
            <TabPanel>
              <BadgeUsersTab awards={timeline} />
            </TabPanel>
            <TabPanel px="0">
              <BadgeCommentsTab badge={badge} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </IntersectionObserverProvider>
    </SimpleView>
  );
}

export default function BadgeDetailsView() {
  const pointer = useParamsAddressPointer("naddr");
  const badge = useReplaceableEvent(pointer);

  if (!badge) return <Spinner />;

  return <BadgeDetailsPage badge={badge} />;
}
