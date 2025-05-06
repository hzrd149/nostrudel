import { NostrEvent } from "nostr-tools";
import { forwardRef } from "react";
import { Text } from "@chakra-ui/react";

import NotificationIconEntry from "./notification-icon-entry";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import { EmbedEventCard } from "../../../components/embed-event/card";
import HelpCircle from "../../../components/icons/help-circle";

const UnknownNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    return (
      <NotificationIconEntry
        ref={ref}
        icon={<HelpCircle boxSize={6} color="gray.500" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={<>Unknown kind:{event.kind}</>}
        onClick={onClick}
      >
        <Text>
          <UserAvatar size="xs" pubkey={event.pubkey} /> <UserName pubkey={event.pubkey} /> reposted:
        </Text>
        <EmbedEventCard event={event} />
      </NotificationIconEntry>
    );
  },
);

export default UnknownNotification;
