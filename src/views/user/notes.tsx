import { Flex, FormControl, FormLabel, Switch, useDisclosure } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Note } from "../../components/note";
import RepostNote from "../../components/repost-note";
import { isReply, isRepost } from "../../helpers/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import userTimelineService from "../../services/user-timeline";
import { useCallback, useEffect, useMemo, useRef } from "react";
import useSubject from "../../hooks/use-subject";
import { useInterval, useMount, useUnmount } from "react-use";
import { RelayIconStack } from "../../components/relay-icon-stack";
import { NostrEvent } from "../../types/nostr-event";
import useScrollPosition from "../../hooks/use-scroll-position";
import LoadMoreButton from "../../components/load-more-button";

const UserNotesTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { isOpen: showReplies, onToggle: toggleReplies } = useDisclosure();
  const { isOpen: hideReposts, onToggle: toggleReposts } = useDisclosure();

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const scrollPosition = useScrollPosition(scrollBox);

  const timeline = useMemo(() => userTimelineService.getTimeline(pubkey), [pubkey]);
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      if (hideReposts && isRepost(event)) return false;
      return true;
    },
    [showReplies, hideReposts]
  );
  useEffect(() => {
    timeline.setFilter(eventFilter);
  }, [timeline, eventFilter]);
  useEffect(() => {
    timeline.setRelays(readRelays);
  }, [timeline, readRelays.join("|")]);

  useMount(() => timeline.open());
  useUnmount(() => timeline.close());

  useInterval(() => {
    const events = timeline.timeline.value;
    if (events.length > 0) {
      const eventAtScrollPos = events[Math.floor(scrollPosition * (events.length - 1))];
      timeline.setCursor(eventAtScrollPos.created_at);
    }

    timeline.loadNextBlocks();
  }, 1000);

  const eventsTimeline = useSubject(timeline.timeline);

  return (
    <Flex direction="column" gap="2" pt="4" pb="8" h="full" overflowY="auto" overflowX="hidden" ref={scrollBox}>
      <FormControl display="flex" alignItems="center" mx="2">
        <Switch id="replies" mr="2" isChecked={showReplies} onChange={toggleReplies} />
        <FormLabel htmlFor="replies" mb="0">
          Replies
        </FormLabel>
        <Switch id="reposts" mr="2" isChecked={!hideReposts} onChange={toggleReposts} />
        <FormLabel htmlFor="reposts" mb="0">
          Reposts
        </FormLabel>
        <RelayIconStack ml="auto" relays={readRelays} direction="row-reverse" mr="4" maxRelays={4} />
      </FormControl>
      {eventsTimeline.map((event) =>
        event.kind === 6 ? (
          <RepostNote key={event.id} event={event} maxHeight={1200} />
        ) : (
          <Note key={event.id} event={event} maxHeight={1200} />
        )
      )}

      <LoadMoreButton timeline={timeline} />
    </Flex>
  );
};

export default UserNotesTab;
