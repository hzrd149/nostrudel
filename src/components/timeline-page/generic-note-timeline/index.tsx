import { ReactNode, memo } from "react";
import { Text } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import useSubject from "../../../hooks/use-subject";
import { TimelineLoader } from "../../../classes/timeline-loader";
import RepostNote from "./repost-note";
import { Note } from "../../note";
import { NostrEvent } from "../../../types/nostr-event";
import { STREAM_KIND } from "../../../helpers/nostr/stream";
import StreamNote from "./stream-note";
import { ErrorBoundary } from "../../error-boundary";
import EmbeddedArticle from "../../embed-event/event-types/embedded-article";
import { isReply } from "../../../helpers/nostr/events";
import ReplyNote from "./reply-note";
import RelayRecommendation from "./relay-recommendation";

function RenderEvent({ event }: { event: NostrEvent }) {
  let content: ReactNode | null = null;
  switch (event.kind) {
    case Kind.Text:
      content = isReply(event) ? <ReplyNote event={event} /> : <Note event={event} showReplyButton />;
      break;
    case Kind.Repost:
      content = <RepostNote event={event} />;
      break;
    case Kind.Article:
      content = <EmbeddedArticle article={event} />;
      break;
    case STREAM_KIND:
      content = <StreamNote event={event} />;
      break;
    case Kind.RecommendRelay:
      content = <RelayRecommendation event={event} />;
      break;
    default:
      content = <Text>Unknown event kind: {event.kind}</Text>;
      break;
  }

  return content && <ErrorBoundary>{content}</ErrorBoundary>;
}
const RenderEventMemo = memo(RenderEvent);

function GenericNoteTimeline({ timeline }: { timeline: TimelineLoader }) {
  const notes = useSubject(timeline.timeline);

  return (
    <>
      {notes.map((note) => (
        <RenderEventMemo key={note.id} event={note} />
      ))}
    </>
  );
}

export default memo(GenericNoteTimeline);
