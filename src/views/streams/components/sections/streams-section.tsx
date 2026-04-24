import { Box, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";
import { castTimelineStream } from "applesauce-common/observable";
import { isStreamURL } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { Filter, kinds } from "nostr-tools";
import { useCallback, useMemo } from "react";
import { of, throttleTime } from "rxjs";

import type { StreamStatus } from "../../../../helpers/nostr/stream";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import { eventStore } from "../../../../services/event-store";
import StreamCard from "../stream-card";

const columns = { base: 1, md: 2, lg: 3, xl: 4, "2xl": 5 };

type Props = {
  title: string;
  status: StreamStatus;
  filter: Filter | undefined;
  /** Shown when there are no streams of this status. Pass `null` to hide the section entirely. */
  emptyState?: React.ReactNode;
  mt?: number | string;
};

export default function StreamsSection({ title, status, filter, emptyState = null, mt = 2 }: Props) {
  const muteFilter = useClientSideMuteFilter();

  const timelineFilter = useMemo(() => {
    if (!filter) return undefined;
    return [
      {
        kinds: [kinds.LiveEvent],
        "#p": filter.authors,
      },
      {
        kinds: [kinds.LiveEvent],
        authors: filter.authors,
      },
    ];
  }, [filter]);

  // Build a typed stream timeline from the event store
  const streams =
    use$(
      () =>
        timelineFilter
          ? eventStore.timeline(timelineFilter).pipe(throttleTime(500), castTimelineStream(Stream, eventStore))
          : of<Stream[]>([]),
      [timelineFilter],
    ) ?? [];

  const filterStream = useCallback(
    (stream: Stream) => {
      if (muteFilter(stream.event)) return false;
      if (stream.status !== status) return false;
      // Only include streams that actually have a playable video (matches the previous behavior)
      if (stream.streamingVideos.length === 0 && !stream.streamingURLs.some(isStreamURL)) return false;
      return true;
    },
    [muteFilter, status],
  );

  const visible = useMemo(() => streams.filter(filterStream), [streams, filterStream]);

  if (visible.length === 0) {
    if (emptyState === null) return null;
    return (
      <Box mt={mt}>
        <Heading size="lg">{title}</Heading>
        {typeof emptyState === "string" ? (
          <Text color="GrayText" mt="2">
            {emptyState}
          </Text>
        ) : (
          emptyState
        )}
      </Box>
    );
  }

  return (
    <>
      <Heading size="lg" mt={mt}>
        {title}
      </Heading>
      <SimpleGrid columns={columns} spacing="2">
        {visible.map((stream) => (
          <StreamCard key={stream.uid} stream={stream} />
        ))}
      </SimpleGrid>
    </>
  );
}
