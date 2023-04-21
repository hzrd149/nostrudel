import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Spinner,
  Switch,
  useDisclosure,
} from "@chakra-ui/react";
import { useParams, useSearchParams } from "react-router-dom";
import moment from "moment";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { unique } from "../../helpers/array";
import { isReply } from "../../helpers/nostr-event";
import { Note } from "../../components/note";

export default function HashTagView() {
  const { hashtag } = useParams() as { hashtag: string };
  useAppTitle("#" + hashtag);

  const defaultRelays = useReadRelayUrls();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRelay = searchParams.get("relay") ?? "";
  const setSelectedRelay = (url: string) => {
    if (url) {
      setSearchParams({ relay: url });
    } else setSearchParams({});
  };

  const availableRelays = unique([...defaultRelays, selectedRelay]).filter(Boolean);

  const { isOpen: showReplies, onToggle } = useDisclosure();
  const { events, loading, loadMore, loader } = useTimelineLoader(
    `${hashtag}-hashtag`,
    selectedRelay ? [selectedRelay] : defaultRelays,
    { kinds: [1], "#t": [hashtag] },
    { pageSize: moment.duration(5, "minutes").asSeconds() }
  );

  const timeline = showReplies ? events : events.filter((e) => !isReply(e));

  return (
    <Flex direction="column" gap="4" overflow="auto" flex={1} pb="4" pt="4" pl="1" pr="1">
      <Heading>#{hashtag}</Heading>
      <Flex gap="2">
        <Select
          placeholder="All Relays"
          maxWidth="250"
          value={selectedRelay}
          onChange={(e) => {
            setSelectedRelay(e.target.value);
            loader.forgetEvents();
          }}
        >
          {availableRelays.map((url) => (
            <option key={url} value={url}>
              {url}
            </option>
          ))}
        </Select>
        <FormControl display="flex" alignItems="center">
          <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} mr="2" />
          <FormLabel htmlFor="show-replies" mb="0">
            Show Replies
          </FormLabel>
        </FormControl>
      </Flex>
      {timeline.map((event) => (
        <Note key={event.id} event={event} maxHeight={600} />
      ))}
      {loading ? (
        <Spinner ml="auto" mr="auto" mt="8" mb="8" flexShrink={0} />
      ) : (
        <Button onClick={() => loadMore()} flexShrink={0}>
          Load More
        </Button>
      )}
    </Flex>
  );
}
