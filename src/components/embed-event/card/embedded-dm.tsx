import { Card, CardBody, CardHeader, CardProps, LinkBox, Text } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import { getDMRecipient, getDMSender } from "../../../helpers/nostr/dms";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import DirectMessageContent from "../../../views/messages/components/direct-message-content";
import DebugEventButton from "../../debug-modal/debug-event-button";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedDM({ dm, ...props }: Omit<CardProps, "children"> & { dm: NostrEvent }) {
  const account = useActiveAccount();
  const sender = getDMSender(dm);
  const receiver = getDMRecipient(dm);

  if (!receiver) return "Broken DM";

  return (
    <ContentSettingsProvider event={dm}>
      <Card as={LinkBox} variant="outline" {...props}>
        <CardHeader display="flex" gap="2" p="2" alignItems="center">
          <UserAvatarLink pubkey={sender} size="xs" />
          <UserLink pubkey={sender} fontWeight="bold" isTruncated fontSize="lg" />
          <Text mx="2">Messaged</Text>
          <UserAvatarLink pubkey={receiver} size="xs" />
          <UserLink pubkey={receiver} fontWeight="bold" isTruncated fontSize="lg" />
          <Timestamp timestamp={dm.created_at} />
          <DebugEventButton event={dm} size="sm" variant="outline" ml="auto" />
        </CardHeader>
        {(sender === account?.pubkey || receiver === account?.pubkey) && (
          <CardBody px="2" pt="0" pb="2">
            <DirectMessageContent message={dm} />
          </CardBody>
        )}
      </Card>
    </ContentSettingsProvider>
  );
}
