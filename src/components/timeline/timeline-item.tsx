import { Spinner } from "@chakra-ui/react";
import { PICTURE_POST_KIND } from "applesauce-core/helpers";
import { NostrEvent, kinds } from "nostr-tools";
import { Suspense, lazy, memo } from "react";

import { isReply } from "../../helpers/nostr/event";
import { FLARE_VIDEO_KIND } from "../../helpers/nostr/video";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import ArticleCard from "../../views/articles/components/article-card";
import EmbeddedUnknown from "../embed-event/card/embedded-unknown";
import { ErrorBoundary } from "../error-boundary";
import PicturePost from "../picture-post/picture-post-card";
import { TimelineHighlight } from "./highlight";
import { TimelineNote } from "./note";
import TimelineShare from "./share";
import ReplyNote from "./reply";

// other stuff
const StreamNote = lazy(() => import("./stream"));
const BadgeAwardCard = lazy(() => import("../../views/badges/components/badge-award-card"));
const EmbeddedFlareVideo = lazy(() => import("../embed-event/card/embedded-flare-video"));

export function TimelineItemContent({ event }: { event: NostrEvent }) {
  switch (event.kind) {
    case kinds.ShortTextNote:
      return isReply(event) ? <ReplyNote event={event} /> : <TimelineNote event={event} showReplyButton />;
    case kinds.Repost:
    case kinds.GenericRepost:
      return <TimelineShare event={event} />;
    case kinds.Highlights:
      return <TimelineHighlight event={event} clickable={false} />;
    case kinds.LiveEvent:
      return <StreamNote stream={event} />;
    case kinds.BadgeAward:
      return <BadgeAwardCard award={event} />;
    case FLARE_VIDEO_KIND:
      return <EmbeddedFlareVideo video={event} />;
    case kinds.LongFormArticle:
      return <ArticleCard article={event} />;
    case PICTURE_POST_KIND:
      return <PicturePost post={event} />;
    default:
      return <EmbeddedUnknown event={event} />;
  }
}

function TimelineItem({ event, visible, minHeight }: { event: NostrEvent; visible: boolean; minHeight?: number }) {
  const ref = useEventIntersectionRef(event);

  return (
    <ErrorBoundary event={event}>
      <div style={{ minHeight: minHeight + "px" }} ref={ref}>
        {visible && (
          <Suspense fallback={<Spinner />}>
            <TimelineItemContent event={event} />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(TimelineItem);
