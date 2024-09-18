import { ReactNode, memo } from "react";
import { kinds } from "nostr-tools";
import { Box, Text } from "@chakra-ui/react";

import { ErrorBoundary } from "../../error-boundary";
import ReplyNote from "./reply-note";
import RepostEvent from "./repost-event";
import StreamNote from "./stream-note";
import RelayRecommendation from "./relay-recommendation";
import BadgeAwardCard from "../../../views/badges/components/badge-award-card";
import { isReply } from "../../../helpers/nostr/event";
import { STREAM_KIND } from "../../../helpers/nostr/stream";
import { NostrEvent } from "../../../types/nostr-event";
import { FLARE_VIDEO_KIND } from "../../../helpers/nostr/flare";
import EmbeddedFlareVideo from "../../embed-event/event-types/embedded-flare-video";
import { TimelineNote } from "../../note/timeline-note";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

function TimelineItem({ event, visible, minHeight }: { event: NostrEvent; visible: boolean; minHeight?: number }) {
  const ref = useEventIntersectionRef(event);

  let content: ReactNode | null = null;
  switch (event.kind) {
    case kinds.ShortTextNote:
      content = isReply(event) ? <ReplyNote event={event} /> : <TimelineNote event={event} showReplyButton />;
      break;
    case kinds.Repost:
    case kinds.GenericRepost:
      content = <RepostEvent event={event} />;
      break;
    case STREAM_KIND:
      content = <StreamNote event={event} />;
      break;
    case kinds.RecommendRelay:
      content = <RelayRecommendation event={event} />;
      break;
    case kinds.BadgeAward:
      content = <BadgeAwardCard award={event} />;
      break;
    case FLARE_VIDEO_KIND:
      content = <EmbeddedFlareVideo video={event} />;
      break;
    default:
      content = <Text>Unknown event kind: {event.kind}</Text>;
      break;
  }

  return (
    <ErrorBoundary>
      <Box minHeight={minHeight + "px"} ref={ref}>
        {visible && content}
      </Box>
    </ErrorBoundary>
  );
}

export default memo(TimelineItem);
