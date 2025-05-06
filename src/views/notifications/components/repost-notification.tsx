import { forwardRef } from "react";
import { Text } from "@chakra-ui/react";
import { nip18, NostrEvent } from "nostr-tools";

import { EmbedEventPointerCard } from "../../../components/embed-event/card";
import { RepostIcon } from "../../../components/icons";
import NotificationIconEntry from "./notification-icon-entry";
import UserAvatar from "../../../components/user/user-avatar";
import { truncateId } from "../../../helpers/string";
import UserLink from "../../../components/user/user-link";

const RepostNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    const pointer = nip18.getRepostedEventPointer(event);
    if (!pointer) return null;

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<RepostIcon boxSize={6} color="blue.400" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={<>Reposted {truncateId(pointer.id)}</>}
        onClick={onClick}
      >
        <Text>
          <UserAvatar size="xs" pubkey={event.pubkey} /> <UserLink pubkey={event.pubkey} /> reposted:
        </Text>
        <EmbedEventPointerCard pointer={{ type: "nevent", data: pointer }} />
      </NotificationIconEntry>
    );
  },
);

export default RepostNotification;
