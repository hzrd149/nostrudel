import { Button, Flex, FormControl, FormLabel, Select, Spinner, Switch, useDisclosure } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { Note } from "../../components/note";
import { unique } from "../../helpers/array";
import { isReply } from "../../helpers/nostr-event";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";

export default function GlobalTab() {
  useAppTitle("global");
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
    `global`,
    selectedRelay ? [selectedRelay] : [],
    { kinds: [1] },
    { pageSize: 60*10 }
  );

  const timeline = showReplies ? events : events.filter((e) => !isReply(e));

  return (
    <Flex direction="column" gap="2">
      <Flex gap="2">
        <Select
          placeholder="Select Relay"
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
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
}
