import { useCallback } from "react";
import { ButtonGroup, Flex, IconButton, Spacer, useDisclosure } from "@chakra-ui/react";
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
import { ReplyIcon, RepostIcon } from "../../components/icons";

export default function UserNotesTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const showReplies = useDisclosure();
  const showReposts = useDisclosure({ defaultIsOpen: true });

  const timelineEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelineEventFilter(event);
    },
    [showReplies.isOpen, showReposts.isOpen, timelineEventFilter],
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
    <Flex gap="2" alignItems="center">
      <ButtonGroup variant="outline">
        <IconButton
          icon={<ReplyIcon boxSize={5} />}
          colorScheme={showReplies.isOpen ? "primary" : undefined}
          aria-label="Toggle replies"
          title="Toggle replies"
          onClick={showReplies.onToggle}
        />
        <IconButton
          icon={<RepostIcon boxSize={5} />}
          colorScheme={showReposts.isOpen ? "primary" : undefined}
          aria-label="Toggle reposts"
          title="Toggle reposts"
          onClick={showReposts.onToggle}
        />
      </ButtonGroup>
      <Spacer />
      <RelayIconStack relays={readRelays} direction="row-reverse" maxRelays={4} />
      <TimelineViewType />
    </Flex>
  );

  return <TimelinePage header={header} timeline={timeline} pt="2" pb="12" px="2" />;
}
