import { useOutletContext, Link as RouterLink } from "react-router";
import { Button, Flex, Heading, Spacer, StackDivider, Tag, VStack } from "@chakra-ui/react";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import { NostrEvent } from "../../types/nostr-event";
import RelayReviewNote from "../relays/components/relay-review-note";
import { RelayFavicon } from "../../components/relay-favicon";
import { RelayDebugButton, RelayMetadata } from "../relays/components/relay-card";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useRelayInfo } from "../../hooks/use-relay-info";
import { ErrorBoundary } from "../../components/error-boundary";
import { RelayShareButton } from "../relays/components/relay-share-button";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import { truncateId } from "../../helpers/string";

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
        {/* <RelayJoinAction url={url} size="sm" /> */}
      </Flex>
      <RelayMetadata url={url} />
      {reviews.length > 0 && (
        <Flex py="0" direction="column" gap="2">
          {reviews.map((event) => (
            <RelayReviewNote key={event.id} event={event} />
          ))}
        </Flex>
      )}
    </Flex>
  );
}

function getRelayReviews(url: string, events: NostrEvent[]) {
  return events.filter((e) => e.tags.some((t) => t[0] === "r" && t[1] === url));
}

const UserRelaysTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const mailboxes = useUserMailboxes(pubkey);

  const readRelays = useReadRelays(mailboxes?.outboxes);
  const { loader, timeline: reviews } = useTimelineLoader(`${truncateId(pubkey)}-relay-reviews`, readRelays, {
    authors: [pubkey],
    kinds: [1985],
    "#l": ["review/relay"],
  });

  const callback = useTimelineCurserIntersectionCallback(loader);

  const otherReviews = reviews.filter((e) => {
    const url = e.tags.find((t) => t[0] === "r")?.[1];
    return url && !mailboxes?.inboxes.includes(url) && !mailboxes?.outboxes.includes(url);
  });

  return (
    <IntersectionObserverProvider callback={callback}>
      <Heading size="lg" ml="2" mt="2">
        Inboxes
      </Heading>
      <VStack divider={<StackDivider />} py="2" align="stretch">
        {Array.from(mailboxes?.inboxes ?? []).map((url) => (
          <ErrorBoundary key={url}>
            <Relay url={url} reviews={getRelayReviews(url, reviews)} />
          </ErrorBoundary>
        ))}
      </VStack>
      <Heading size="lg" ml="2" mt="2">
        Outboxes
      </Heading>
      <VStack divider={<StackDivider />} py="2" align="stretch">
        {Array.from(mailboxes?.outboxes ?? []).map((url) => (
          <ErrorBoundary key={url}>
            <Relay url={url} reviews={getRelayReviews(url, reviews)} />
          </ErrorBoundary>
        ))}
      </VStack>
      {otherReviews.length > 0 && (
        <>
          <Heading size="lg" ml="2" mt="2">
            Reviews
          </Heading>
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
