import { ReactNode, forwardRef } from "react";
import { kinds, NostrEvent } from "nostr-tools";

import { EmbedEventCard } from "../../../components/embed-event/card";
import { QuoteIcon } from "../../../components/icons";
import NotificationIconEntry from "./notification-icon-entry";
import { TimelineNote } from "../../../components/note/timeline-note";
import ArticleCard from "../../articles/components/article-card";

const QuoteNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    let content: ReactNode;
    switch (event.kind) {
      case kinds.LongFormArticle:
        content = <ArticleCard article={event} />;
        break;
      case kinds.ShortTextNote:
        content = <TimelineNote event={event} showReplyButton />;
        break;
      default:
        content = <EmbedEventCard event={event} />;
        break;
    }

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<QuoteIcon boxSize={6} color="teal.400" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={<>Quoted your note</>}
        onClick={onClick}
      >
        {content}
      </NotificationIconEntry>
    );
  },
);

export default QuoteNotification;
