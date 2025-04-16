import { useCallback, useMemo } from "react";
import { Button, Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, LinkBox } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { getEventUID } from "nostr-idb";

import { useReadRelays } from "../../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import PeopleListProvider, { usePeopleListContext } from "../../../providers/local/people-list-provider";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import KeyboardShortcut from "../../../components/keyboard-shortcut";
import { ErrorBoundary } from "../../../components/error-boundary";
import { getStreamHost, getStreamStatus, getStreamTitle } from "../../../helpers/nostr/stream";

function LiveStream({ stream }: { stream: NostrEvent }) {
  const naddr = useShareableEventAddress(stream);

  const host = getStreamHost(stream);
  const title = getStreamTitle(stream);

  return (
    <Flex as={LinkBox} alignItems="center" gap="2">
      <UserAvatar pubkey={host} size="sm" />

      <HoverLinkOverlay as={RouterLink} to={`/streams/${naddr}`}></HoverLinkOverlay>
      {title || <UserName pubkey={host} />}
    </Flex>
  );
}

function StreamsCardContent({ ...props }: Omit<CardProps, "children">) {
  const navigate = useNavigate();
  const relays = useReadRelays();
  const userMuteFilter = useClientSideMuteFilter();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (userMuteFilter(event)) return false;
      return true;
    },
    [userMuteFilter],
  );

  const { filter, listId } = usePeopleListContext();
  const query = useMemo<Filter[] | undefined>(() => {
    if (!filter) return undefined;
    return [
      { authors: filter.authors, kinds: [kinds.LiveEvent] },
      { "#p": filter.authors, kinds: [kinds.LiveEvent] },
    ];
  }, [filter]);

  const { timeline } = useTimelineLoader(`${listId ?? "global"}-streams`, relays, query, { eventFilter });

  const streams = timeline.filter((stream) => getStreamStatus(stream) !== "ended").slice(0, 6);

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center" pb="2">
        <Heading size="lg">
          <Link as={RouterLink} to="/streams">
            Streams
          </Link>
        </Heading>
        <KeyboardShortcut letter="l" requireMeta ml="auto" onPress={() => navigate("/streams")} />
      </CardHeader>
      <CardBody overflowX="hidden" overflowY="auto" pt="4" display="flex" gap="2" flexDirection="column" maxH="50vh">
        {streams?.map((stream) => (
          <ErrorBoundary key={getEventUID(stream)} event={stream}>
            <LiveStream stream={stream} />
          </ErrorBoundary>
        ))}
        <Button as={RouterLink} to="/streams" flexShrink={0} variant="link" size="lg" py="4">
          View More
        </Button>
      </CardBody>
    </Card>
  );
}

export default function StreamsCard({ ...props }: Omit<CardProps, "children">) {
  return (
    <ErrorBoundary>
      <PeopleListProvider initList="following">
        <StreamsCardContent {...props} />
      </PeopleListProvider>
    </ErrorBoundary>
  );
}
