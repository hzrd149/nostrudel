import { ReactNode, memo, useRef } from "react";
import { Kind } from "nostr-tools";
import { Box, Text } from "@chakra-ui/react";

import { ErrorBoundary } from "../../error-boundary";
import ReplyNote from "./reply-note";
import Note from "../../note";
import RepostNote from "./repost-note";
import ArticleNote from "./article-note";
import StreamNote from "./stream-note";
import RelayRecommendation from "./relay-recommendation";
import BadgeAwardCard from "../../../views/badges/components/badge-award-card";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";
import { getEventUID, isReply } from "../../../helpers/nostr/events";
import { STREAM_KIND } from "../../../helpers/nostr/stream";
import { NostrEvent } from "../../../types/nostr-event";

function GenericTimelineNote({
  event,
  visible,
  minHeight,
}: {
  event: NostrEvent;
  visible: boolean;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  let content: ReactNode | null = null;
  switch (event.kind) {
    case Kind.Text:
      content = isReply(event) ? <ReplyNote event={event} /> : <Note event={event} showReplyButton />;
      break;
    case Kind.Repost:
      content = <RepostNote event={event} />;
      break;
    case Kind.Article:
      content = <ArticleNote article={event} />;
      break;
    case STREAM_KIND:
      content = <StreamNote event={event} />;
      break;
    case Kind.RecommendRelay:
      content = <RelayRecommendation event={event} />;
      break;
    case Kind.BadgeAward:
      content = <BadgeAwardCard award={event} />;
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

export default memo(GenericTimelineNote);
