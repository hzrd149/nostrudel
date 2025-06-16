import { AvatarGroup, Flex, Text } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, nip25, NostrEvent } from "nostr-tools";
import { forwardRef } from "react";

import { EmbedEventPointerCard } from "../../../components/embed-event/card";
import ReactionIcon from "../../../components/event-reactions/reaction-icon";
import Heart from "../../../components/icons/heart";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import useSingleEvent from "../../../hooks/use-single-event";
import NotificationIconEntry from "./notification-icon-entry";

const ReactionNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    const account = useActiveAccount();
    const pointer = nip25.getReactedEventPointer(event);
    if (!pointer || (account?.pubkey && pointer.author !== account.pubkey)) return null;

    const reactedEvent = useSingleEvent(pointer);
    if (reactedEvent?.kind === kinds.EncryptedDirectMessage) return null;

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<Heart boxSize={6} color="red.400" />}
        id={event.id}
        pubkey={event.pubkey}
        timestamp={event.created_at}
        summary={
          <>
            <ReactionIcon emoji={event.content} />
            <Text fontStyle="italic" as="span" ml="2" mr="2" fontSize="sm">
              {reactedEvent?.content}
            </Text>
          </>
        }
        onClick={onClick}
      >
        <Flex gap="2" alignItems="center" pl="2">
          <AvatarGroup size="sm">
            <UserAvatarLink pubkey={event.pubkey} />
          </AvatarGroup>
          <Text>
            reacted with <ReactionIcon emoji={event.content} />
          </Text>
        </Flex>
        <EmbedEventPointerCard pointer={{ type: "nevent", data: pointer }} />
      </NotificationIconEntry>
    );
  },
);

export default ReactionNotification;
