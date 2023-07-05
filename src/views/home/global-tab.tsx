import { useCallback, useRef } from "react";
import { Flex, FormControl, FormLabel, Switch, useDisclosure } from "@chakra-ui/react";
import { isReply } from "../../helpers/nostr-event";
import { useAppTitle } from "../../hooks/use-app-title";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import TimelineActionAndStatus from "../../components/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import GenericNoteTimeline from "../../components/timeline/generic-note-timeline";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useRelaysChanged from "../../hooks/use-relays-changed";

function GlobalPage() {
  const readRelays = useRelaySelectionRelays();
  const { isOpen: showReplies, onToggle } = useDisclosure();

  useAppTitle("global");

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      return true;
    },
    [showReplies]
  );
  const timeline = useTimelineLoader(`global`, readRelays, { kinds: [1] }, { eventFilter });

  useRelaysChanged(readRelays, () => timeline.reset());

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback} root={scrollBox}>
      <Flex py="4" direction="column" gap="2" overflowY="auto" overflowX="hidden" ref={scrollBox}>
        <Flex gap="2">
          <RelaySelectionButton />
          <FormControl display="flex" alignItems="center">
            <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} mr="2" />
            <FormLabel htmlFor="show-replies" mb="0">
              Show Replies
            </FormLabel>
          </FormControl>
        </Flex>

        <GenericNoteTimeline timeline={timeline} />
        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
}
export default function GlobalTab() {
  // wrap the global page with another relay selection so it dose not effect the rest of the app
  return (
    <RelaySelectionProvider overrideDefault={["wss://welcome.nostr.wine"]}>
      <GlobalPage />
    </RelaySelectionProvider>
  );
}
