import { useMemo } from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import moment from "moment";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useThrottle } from "react-use";
import { Kind } from "nostr-tools";
import { parseZapNote } from "../../helpers/nip-57";
import { NoteLink } from "../../components/note-link";

export default function PopularTab() {
  useAppTitle("popular");
  const relays = useReadRelayUrls();

  const {
    loading,
    events: zaps,
    loadMore,
  } = useTimelineLoader(
    "popular-zaps",
    relays,
    { since: moment().subtract(1, "hour").unix(), kinds: [Kind.Zap] },
    { pageSize: moment.duration(1, "hour").asSeconds() }
  );

  const throttledZaps = useThrottle(zaps, 1000);

  const groupedZaps = useMemo(() => {
    const dir: Record<string, ReturnType<typeof parseZapNote>[]> = {};
    for (const zap of throttledZaps) {
      try {
        const parsed = parseZapNote(zap);
        if (!parsed.eventId) continue;
        dir[parsed.eventId] = dir[parsed.eventId] || [];
        dir[parsed.eventId].push(parsed);
      } catch (e) {}
    }
    return dir;
  }, [throttledZaps]);

  return (
    <Flex direction="column" gap="2">
      <Button onClick={() => loadMore()} isLoading={loading}>
        Load More
      </Button>
      {Array.from(Object.entries(groupedZaps)).map(([eventId, parsedZaps]) => (
        <Box key={eventId}>
          <Text>{parsedZaps.length}</Text>
          <NoteLink noteId={eventId} />
        </Box>
      ))}
    </Flex>
  );
}
