import { Box, Button, Card, CardBody, CardHeader, CardProps, Heading, Link } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useCallback, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import TimePeriodSelect, { getTimePeriodTimestamp, TimePeriod } from "./time-period-select";

import { ErrorBoundary } from "../../../components/error-boundary";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import SimpleNavBox from "../../../components/layout/box-layout/simple-nav-box";
import { getStreamHost, getStreamStatus, getStreamTitle } from "../../../helpers/nostr/stream";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import PeopleListProvider, { usePeopleListContext } from "../../../providers/local/people-list-provider";

function LiveStream({ stream }: { stream: NostrEvent }) {
  const naddr = useShareableEventAddress(stream);

  const host = getStreamHost(stream);
  const title = getStreamTitle(stream);

  return (
    <SimpleNavBox
      icon={<UserAvatar pubkey={host} size="sm" />}
      title={title || <UserName pubkey={host} />}
      to={`/streams/${naddr}`}
    />
  );
}

function StreamsCardContent({ ...props }: Omit<CardProps, "children">) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("today");
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
    const since = getTimePeriodTimestamp(timePeriod);
    return [
      { authors: filter.authors, kinds: [kinds.LiveEvent], since },
      { "#p": filter.authors, kinds: [kinds.LiveEvent], since },
    ];
  }, [filter, timePeriod]);

  const { timeline } = useTimelineLoader(`${listId ?? "global"}-streams`, relays, query, { eventFilter });

  const streams = timeline.filter((stream) => getStreamStatus(stream) !== "ended").slice(0, 6);

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="md">
          <Link as={RouterLink} to="/streams">
            Streams
          </Link>
        </Heading>
        <TimePeriodSelect value={timePeriod} onChange={setTimePeriod} />
      </CardHeader>
      <CardBody p="0" overflowY="auto" maxH="50vh" borderTopWidth={1}>
        {streams?.map((stream) => (
          <ErrorBoundary key={getEventUID(stream)} event={stream}>
            <LiveStream stream={stream} />
          </ErrorBoundary>
        ))}
        <Button as={RouterLink} to="/streams" w="full" flexShrink={0} variant="link" size="lg" py="4">
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
