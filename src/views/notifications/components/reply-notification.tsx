import { forwardRef, useMemo } from "react";
import { NostrEvent } from "nostr-tools";
import { DecodeResult } from "nostr-tools/nip19";

import { getThreadReferences } from "../../../helpers/nostr/event";
import { EmbedEventPointer } from "../../../components/embed-event";
import { ReplyIcon } from "../../../components/icons";
import NotificationIconEntry from "./notification-icon-entry";
import { TimelineNote } from "../../../components/note/timeline-note";

const ReplyNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    const refs = getThreadReferences(event);

    const pointer = useMemo<DecodeResult | undefined>(() => {
      if (refs.reply?.a) return { type: "naddr", data: refs.reply.a };
      if (refs.reply?.e) return { type: "nevent", data: refs.reply.e };
    }, [refs.reply?.e, refs.reply?.a]);

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<ReplyIcon boxSize={6} color="green.400" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={event.content}
        onClick={onClick}
      >
        {pointer && <EmbedEventPointer pointer={pointer} />}
        <TimelineNote event={event} showReplyLine={false} showReplyButton />
      </NotificationIconEntry>
    );
  },
);

export default ReplyNotification;
