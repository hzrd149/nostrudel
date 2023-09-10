import { useCallback } from "react";
import { Flex, FormControl, FormLabel, Spacer, Switch, useDisclosure } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Kind } from "nostr-tools";
import { isReply, isRepost, truncatedId } from "../../helpers/nostr/events";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { RelayIconStack } from "../../components/relay-icon-stack";
import { NostrEvent } from "../../types/nostr-event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { STREAM_KIND } from "../../helpers/nostr/stream";
import TimelineViewType from "../../components/timeline-page/timeline-view-type";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";

export default function UserNotesTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { isOpen: showReplies, onToggle: toggleReplies } = useDisclosure();
  const { isOpen: hideReposts, onToggle: toggleReposts } = useDisclosure();

  const timelineEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      if (hideReposts && isRepost(event)) return false;
      return timelineEventFilter(event);
    },
    [showReplies, hideReposts, timelineEventFilter],
  );
  const timeline = useTimelineLoader(
    truncatedId(pubkey) + "-notes",
    readRelays,
    {
      authors: [pubkey],
      kinds: [Kind.Text, Kind.Repost, Kind.Article, STREAM_KIND, 2],
    },
    { eventFilter },
  );

  const header = (
    <Flex gap="2" px="2" alignItems="center">
      <Switch id="replies" mr="2" isChecked={showReplies} onChange={toggleReplies} size="sm">
        Replies
      </Switch>
      <Switch id="reposts" mr="2" isChecked={!hideReposts} onChange={toggleReposts} size="sm">
        Reposts
      </Switch>
      <Spacer />
      <RelayIconStack relays={readRelays} direction="row-reverse" maxRelays={4} />
      <TimelineViewType />
    </Flex>
  );

  return <TimelinePage header={header} timeline={timeline} pt="2" pb="8" />;
}
