import { Heading, SimpleGrid } from "@chakra-ui/react";
import { getEventUID, isStreamURL } from "applesauce-core/helpers";
import { useObservableEagerMemo } from "applesauce-react/hooks";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useCallback, useMemo } from "react";
import { map, of, throttleTime } from "rxjs";

import { getStreamStatus, getStreamStreamingURLs } from "../../../../helpers/nostr/stream";
import { eventStore } from "../../../../services/event-store";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import StreamCard from "../stream-card";

const columns = { base: 1, md: 2, lg: 3, xl: 4, "2xl": 5 };

type Props = {
  filter: Filter | undefined;
};

export default function LiveStreamsSection({ filter }: Props) {
  const muteFilter = useClientSideMuteFilter();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (muteFilter(event)) return false;

      // only show streams that have video streams
      const urls = getStreamStreamingURLs(event);
      if (!urls.some(isStreamURL)) return false;

      return true;
    },
    [muteFilter],
  );

  const timelineFilter = useMemo(() => {
    if (!filter) return undefined;
    return {
      ...filter,
      kinds: [kinds.LiveEvent],
      "#p": filter.authors,
    };
  }, [filter]);

  // Subscribe to event store for timeline events
  const streams = useObservableEagerMemo(
    () =>
      timelineFilter
        ? eventStore.timeline(timelineFilter).pipe(
            throttleTime(500),
            map((events) => events.filter(eventFilter)),
          )
        : of([]),
    [timelineFilter, eventFilter],
  ) ?? [];

  const liveStreams = useMemo(() => streams.filter((stream) => getStreamStatus(stream) === "live"), [streams]);

  if (liveStreams.length === 0) return null;

  return (
    <>
      <Heading size="lg" mt="2">
        Live
      </Heading>
      <SimpleGrid columns={columns} spacing="2">
        {liveStreams.map((stream) => (
          <StreamCard key={getEventUID(stream)} stream={stream} />
        ))}
      </SimpleGrid>
    </>
  );
}

