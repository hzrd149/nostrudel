import { Box, Button, Flex, FormControl, FormLabel, Spinner, Switch, useDisclosure } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Note } from "../../components/note";
import RepostNote from "../../components/repost-note";
import { isReply, isRepost } from "../../helpers/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import userTimelineService from "../../services/user-timeline";
import { useEffect, useMemo } from "react";
import useSubject from "../../hooks/use-subject";
import { useMount, useUnmount } from "react-use";

const UserNotesTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const { isOpen: showReplies, onToggle: toggleReplies } = useDisclosure();
  const { isOpen: hideReposts, onToggle: toggleReposts } = useDisclosure();

  const timeline = useMemo(() => userTimelineService.getTimeline(pubkey), [pubkey]);

  const events = useSubject(timeline.events);
  const loading = useSubject(timeline.loading);

  useEffect(() => {
    timeline.setRelays(contextRelays);
  }, [timeline, contextRelays.join("|")]);

  useMount(() => timeline.open());
  useUnmount(() => timeline.close());

  const filteredEvents = events.filter((event) => {
    if (!showReplies && isReply(event)) return false;
    if (hideReposts && isRepost(event)) return false;
    return true;
  });

  return (
    <Flex direction="column" gap="2" pt="4" pb="8" h="full" overflowY="auto" overflowX="hidden">
      <FormControl display="flex" alignItems="center" mx="2">
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
      {filteredEvents.map((event) =>
        event.kind === 6 ? (
          <RepostNote key={event.id} event={event} maxHeight={1200} />
        ) : (
          <Note key={event.id} event={event} maxHeight={1200} />
        )
      )}
      {loading ? (
        <Spinner ml="auto" mr="auto" mt="8" mb="8" flexShrink={0} />
      ) : (
        <Button onClick={() => timeline.loadMore()} flexShrink={0}>
          Load More
        </Button>
      )}
    </Flex>
  );
};

export default UserNotesTab;
