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
import { isNote } from "../../helpers/nostr-event";
import useMergedUserRelays from "../../hooks/use-merged-user-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";

const UserNotesTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const userRelays = useMergedUserRelays(pubkey);
  const relays = userRelays
    .filter((r) => r.mode & RelayMode.WRITE)
    .map((r) => r.url)
    .filter(Boolean)
    .slice(0, 4) as string[];

  const { isOpen: showReplies, onToggle: toggleReplies } = useDisclosure();

  const { events, loading, loadMore } = useTimelineLoader(
    `${pubkey}-notes`,
    relays,
    { authors: [pubkey], kinds: [1], since: moment().subtract(1, "day").unix() },
    { pageSize: moment.duration(1, "day").asSeconds() }
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
        <Note key={event.id} event={event} maxHeight={300} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};

export default UserNotesTab;
