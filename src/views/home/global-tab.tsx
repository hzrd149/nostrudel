import { useCallback } from "react";
import { Flex, FormControl, FormLabel, Switch, useDisclosure } from "@chakra-ui/react";
import { isReply } from "../../helpers/nostr/events";
import { useAppTitle } from "../../hooks/use-app-title";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useRelaysChanged from "../../hooks/use-relays-changed";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import { useSearchParams } from "react-router-dom";
import { safeUrl } from "../../helpers/parse";

function GlobalPage() {
  const readRelays = useRelaySelectionRelays();
  const { isOpen: showReplies, onToggle } = useDisclosure();

  useAppTitle("global");

  const timelineEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      return timelineEventFilter(event);
    },
    [showReplies, timelineEventFilter],
  );
  const timeline = useTimelineLoader(`global`, readRelays, { kinds: [1] }, { eventFilter });
  useRelaysChanged(readRelays, () => timeline.reset());

  const header = (
    <Flex gap="2" pr="2">
      <RelaySelectionButton />
      <FormControl display="flex" alignItems="center">
        <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} mr="2" />
        <FormLabel htmlFor="show-replies" mb="0">
          Show Replies
        </FormLabel>
      </FormControl>
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage timeline={timeline} header={header} pt="4" pb="8" />;
}

export default function GlobalTab() {
  const [params] = useSearchParams();

  // wrap the global page with another relay selection so it dose not effect the rest of the app
  let relays = ["wss://welcome.nostr.wine"];

  const setRelay = params.get("relay");
  if (setRelay) {
    const url = safeUrl(setRelay);
    relays = [setRelay];
  }

  return (
    <RelaySelectionProvider overrideDefault={relays}>
      <GlobalPage />
    </RelaySelectionProvider>
  );
}
