import { NostrEvent } from "nostr-tools";
import { forwardRef } from "react";
import { Text } from "@chakra-ui/react";

import NotificationIconEntry from "./notification-icon-entry";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import { EmbedEvent } from "../../../components/embed-event";
import { DirectMessagesIcon } from "../../../components/icons";

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
        <EmbedEvent event={event} />
      </NotificationIconEntry>
    );
  },
);

export default MessageNotification;
