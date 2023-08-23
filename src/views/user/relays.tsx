import { useOutletContext, Link as RouterLink } from "react-router-dom";
import { Button, Flex, Heading, Spacer, StackDivider, Tag, VStack } from "@chakra-ui/react";

import { useUserRelays } from "../../hooks/use-user-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { truncatedId } from "../../helpers/nostr/events";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import { NostrEvent } from "../../types/nostr-event";
import RelayReviewNote from "../relays/components/relay-review-note";
import { RelayFavicon } from "../../components/relay-favicon";
import { RelayDebugButton, RelayJoinAction, RelayMetadata, RelayShareButton } from "../relays/components/relay-card";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useRelayInfo } from "../../hooks/use-relay-info";

function Relay({ url, reviews }: { url: string; reviews: NostrEvent[] }) {
  const { info } = useRelayInfo(url);

  return (
    <Flex p="2" gap="2" direction="column">
      <Flex gap="2" alignItems="center">
        <RelayFavicon relay={url} size="xs" />
        <Heading size="md" isTruncated>
          <RouterLink to={`/r/${encodeURIComponent(url)}`}>{url}</RouterLink>
          {info?.payments_url && (
            <Tag as="a" variant="solid" colorScheme="green" size="sm" ml="2" target="_blank" href={info.payments_url}>
              Paid
            </Tag>
          )}
        </Heading>
        <Spacer />
        <RelayDebugButton url={url} size="sm" />
        <RelayShareButton relay={url} size="sm" />
        <Button as={RouterLink} to={`/global?relay=${url}`} size="sm">
          Notes
        </Button>
        <RelayJoinAction url={url} size="sm" />
      </Flex>
      <RelayMetadata url={url} />
      <Flex py="0" direction="column" gap="2">
        {reviews.map((event) => (
          <RelayReviewNote key={event.id} event={event} />
        ))}
      </Flex>
    </Flex>
  );
}

function getRelayReviews(url: string, events: NostrEvent[]) {
  return events.filter((e) => e.tags.some((t) => t[0] === "r" && t[1] === url));
}

const UserRelaysTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const userRelays = useUserRelays(pubkey);

  const readRelays = useReadRelayUrls(userRelays.map((r) => r.url));
  const timeline = useTimelineLoader(`${truncatedId(pubkey)}-relay-reviews`, readRelays, {
    authors: [pubkey],
    kinds: [1985],
    "#l": ["review/relay"],
  });

  const reviews = useSubject(timeline.timeline);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  const otherReviews = reviews.filter((e) => {
    const url = e.tags.find((t) => t[0] === "r")?.[1];
    return !userRelays.some((r) => r.url === url);
  });

  return (
    <IntersectionObserverProvider<string> callback={callback}>
      <VStack divider={<StackDivider />} py="2" align="stretch">
        {userRelays.map((relayConfig) => (
          <Relay url={relayConfig.url} reviews={getRelayReviews(relayConfig.url, reviews)} />
        ))}
      </VStack>
      {otherReviews.length > 0 && (
        <>
          <Heading>Other Reviews</Heading>
          <Flex direction="column" gap="2" pb="8">
            {otherReviews.map((event) => (
              <RelayReviewNote key={event.id} event={event} />
            ))}
          </Flex>
        </>
      )}
    </IntersectionObserverProvider>
  );
};

export default UserRelaysTab;
