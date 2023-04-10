import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Switch,
  UnorderedList,
  useDisclosure,
} from "@chakra-ui/react";
import moment from "moment";
import { useOutletContext } from "react-router-dom";
import { RelayMode } from "../../classes/relay";
import { RelayIcon } from "../../components/icons";
import { Note } from "../../components/note";
import { isNote, truncatedId } from "../../helpers/nostr-event";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useFallbackUserRelays from "../../hooks/use-fallback-user-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import relayScoreboardService from "../../services/relay-scoreboard";

const UserNotesTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  // get user relays
  const userRelays = useFallbackUserRelays(pubkey)
    .filter((r) => r.mode & RelayMode.WRITE)
    .map((r) => r.url);
  // merge the users relays with client relays
  const readRelays = useReadRelayUrls();
  // find the top 4
  const relays = userRelays.length === 0 ? readRelays : relayScoreboardService.getRankedRelays(userRelays).slice(0, 4);

  const { isOpen: showReplies, onToggle: toggleReplies } = useDisclosure();

  const { events, loading, loadMore } = useTimelineLoader(
    `${truncatedId(pubkey)}-notes`,
    relays,
    { authors: [pubkey], kinds: [1] },
    { pageSize: moment.duration(2, "day").asSeconds(), startLimit: 20 }
  );
  const timeline = showReplies ? events : events.filter(isNote);

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="show-replies" mb="0">
          Show Replies
        </FormLabel>
        <Switch id="show-replies" isChecked={showReplies} onChange={toggleReplies} />
        <Box flexGrow={1} />
        <Popover>
          <PopoverTrigger>
            <Button variant="link" leftIcon={<RelayIcon />}>
              Using Relays
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverBody>
              <UnorderedList>
                {relays.map((url) => (
                  <ListItem key={url}>{url}</ListItem>
                ))}
              </UnorderedList>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </FormControl>
      {timeline.map((event) => (
        <Note key={event.id} event={event} maxHeight={1200} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};

export default UserNotesTab;
