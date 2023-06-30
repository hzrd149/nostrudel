import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Flex, FormControl, FormLabel, Switch, useDisclosure } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Note } from "../../components/note";
import RepostNote from "../../components/repost-note";
import { isReply, isRepost } from "../../helpers/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import userTimelineService from "../../services/user-timeline";
import useSubject from "../../hooks/use-subject";
import { useMount, useUnmount } from "react-use";
import { RelayIconStack } from "../../components/relay-icon-stack";
import { NostrEvent } from "../../types/nostr-event";
import TimelineActionAndStatus from "../../components/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { TimelineLoader } from "../../classes/timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import GenericNoteTimeline from "../../components/generric-note-timeline";

const UserNotesTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { isOpen: showReplies, onToggle: toggleReplies } = useDisclosure();
  const { isOpen: hideReposts, onToggle: toggleReposts } = useDisclosure();

  const scrollBox = useRef<HTMLDivElement | null>(null);

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

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider<string> root={scrollBox} callback={callback}>
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

        <GenericNoteTimeline timeline={timeline} />
        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
};

export default UserNotesTab;
