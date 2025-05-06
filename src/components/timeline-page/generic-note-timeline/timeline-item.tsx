import { Box, Spinner } from "@chakra-ui/react";
import { PICTURE_POST_KIND } from "applesauce-core/helpers";
import { NostrEvent, kinds } from "nostr-tools";
import { ReactNode, Suspense, lazy, memo } from "react";

import { isReply } from "../../../helpers/nostr/event";
import { FLARE_VIDEO_KIND } from "../../../helpers/nostr/video";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import ArticleCard from "../../../views/articles/components/article-card";
import EmbeddedUnknown from "../../embed-event/card/embedded-unknown";
import { ErrorBoundary } from "../../error-boundary";
import { TimelineNote } from "../../note/timeline-note";
import PicturePost from "../../picture-post/picture-post-card";
import ReplyNote from "./reply-note";
import ShareEvent from "./share-event";

// other stuff
const StreamNote = lazy(() => import("./stream-note"));
const BadgeAwardCard = lazy(() => import("../../../views/badges/components/badge-award-card"));
const EmbeddedFlareVideo = lazy(() => import("../../embed-event/card/embedded-flare-video"));

function TimelineItem({ event, visible, minHeight }: { event: NostrEvent; visible: boolean; minHeight?: number }) {
  const ref = useEventIntersectionRef(event);

  let content: ReactNode | null = null;
  switch (event.kind) {
    case kinds.ShortTextNote:
      content = isReply(event) ? <ReplyNote event={event} /> : <TimelineNote event={event} showReplyButton />;
      break;
    case kinds.Repost:
    case kinds.GenericRepost:
      content = <ShareEvent event={event} />;
      break;
    case kinds.LiveEvent:
      content = <StreamNote stream={event} />;
      break;
    case kinds.BadgeAward:
      content = <BadgeAwardCard award={event} />;
      break;
    case FLARE_VIDEO_KIND:
      content = <EmbeddedFlareVideo video={event} />;
      break;
    case kinds.LongFormArticle:
      content = <ArticleCard article={event} />;
      break;
    case PICTURE_POST_KIND:
      content = <PicturePost post={event} />;
      break;
    default:
      content = <EmbeddedUnknown event={event} />;
      break;
  }

  return (
    <ErrorBoundary event={event}>
      <Box minHeight={minHeight + "px"} ref={ref}>
        {visible && <Suspense fallback={<Spinner />}>{content}</Suspense>}
      </Box>
    </ErrorBoundary>
  );
}

export default memo(TimelineItem);
