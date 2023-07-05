import { useCallback, useRef } from "react";
import { Flex, FormControl, FormLabel, Switch, useDisclosure } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Kind } from "nostr-tools";
import { isReply, isRepost, truncatedId } from "../../helpers/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { RelayIconStack } from "../../components/relay-icon-stack";
import { NostrEvent } from "../../types/nostr-event";
import TimelineActionAndStatus from "../../components/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import GenericNoteTimeline from "../../components/timeline/generic-note-timeline";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { STREAM_KIND } from "../../helpers/nostr/stream";

const UserNotesTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { isOpen: showReplies, onToggle: toggleReplies } = useDisclosure();
  const { isOpen: hideReposts, onToggle: toggleReposts } = useDisclosure();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      if (hideReposts && isRepost(event)) return false;
      return true;
    },
    [showReplies, hideReposts]
  );
  const timeline = useTimelineLoader(
    truncatedId(pubkey) + "-notes",
    readRelays,
    {
      authors: [pubkey],
      kinds: [Kind.Text, Kind.Repost, STREAM_KIND],
    },
    { eventFilter }
  );

  const scrollBox = useRef<HTMLDivElement | null>(null);
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
