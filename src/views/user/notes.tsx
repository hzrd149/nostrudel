import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Spinner,
  Switch,
  useDisclosure,
} from "@chakra-ui/react";
import moment from "moment";
import { useOutletContext } from "react-router-dom";
import { Note } from "../../components/note";
import RepostNote from "../../components/note/repost-note";
import { isReply, isRepost, truncatedId } from "../../helpers/nostr-event";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";

const UserNotesTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const { isOpen: showReplies, onToggle: toggleReplies } = useDisclosure();
  const { isOpen: hideReposts, onToggle: toggleReposts } = useDisclosure();

  const { events, loading, loadMore } = useTimelineLoader(
    `${truncatedId(pubkey)}-notes`,
    contextRelays,
    { authors: [pubkey], kinds: [1, 6] },
    { pageSize: moment.duration(2, "day").asSeconds(), startLimit: 20 }
  );
  const timeline = events.filter((event) => {
    if (!showReplies && isReply(event)) return false;
    if (hideReposts && isRepost(event)) return false;
    return true;
  });

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      <FormControl display="flex" alignItems="center">
        <Switch id="replies" mr="2" isChecked={showReplies} onChange={toggleReplies} />
        <FormLabel htmlFor="replies" mb="0">
          Replies
        </FormLabel>
        <Switch id="reposts" mr="2" isChecked={!hideReposts} onChange={toggleReposts} />
        <FormLabel htmlFor="reposts" mb="0">
          Reposts
        </FormLabel>
        <Box flexGrow={1} />
      </FormControl>
      {timeline.map((event) =>
        event.kind === 6 ? (
          <RepostNote key={event.id} event={event} maxHeight={1200} />
        ) : (
          <Note key={event.id} event={event} maxHeight={1200} />
        )
      )}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};

export default UserNotesTab;
