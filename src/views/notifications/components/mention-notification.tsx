import { ReactNode, forwardRef } from "react";
import { kinds, NostrEvent } from "nostr-tools";

import { EmbedEvent } from "../../../components/embed-event";
import { AtIcon } from "../../../components/icons";
import NotificationIconEntry from "./notification-icon-entry";
import { TimelineNote } from "../../../components/note/timeline-note";
import ArticleCard from "../../articles/components/article-card";

const MentionNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
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
        content = <EmbedEvent event={event} />;
        break;
    }

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<AtIcon boxSize={6} color="purple.400" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={event.content}
        onClick={onClick}
      >
        {content}
      </NotificationIconEntry>
    );
  },
);

export default MentionNotification;
