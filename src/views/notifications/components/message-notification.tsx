import { NostrEvent } from "nostr-tools";
import { forwardRef } from "react";

import { EmbedEventCard } from "../../../components/embed-event/card";
import { DirectMessagesIcon } from "../../../components/icons";
import NotificationIconEntry from "./notification-icon-entry";

const MessageNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    return (
      <NotificationIconEntry
        ref={ref}
        icon={<DirectMessagesIcon boxSize={6} color="gray.500" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={<>Direct Messaged</>}
        onClick={onClick}
      >
        <EmbedEventCard event={event} />
      </NotificationIconEntry>
    );
  },
);

export default MessageNotification;
