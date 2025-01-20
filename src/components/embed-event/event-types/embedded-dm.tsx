import { Card, CardBody, CardHeader, CardProps, IconButton, LinkBox, Text, useDisclosure } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { TrustProvider } from "../../../providers/local/trust-provider";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";
import Timestamp from "../../timestamp";
import DecryptPlaceholder from "../../../views/messages/components/decrypt-placeholder";
import useCurrentAccount from "../../../hooks/use-current-account";
import { getDMRecipient, getDMSender } from "../../../helpers/nostr/dms";
import DirectMessageContent from "../../../views/messages/components/direct-message-content";
import DebugEventButton from "../../debug-modal/debug-event-button";

export default function EmbeddedDM({ dm, ...props }: Omit<CardProps, "children"> & { dm: NostrEvent }) {
  const account = useCurrentAccount();
  const sender = getDMSender(dm);
  const receiver = getDMRecipient(dm);

  if (!receiver) return "Broken DM";

  return (
    <TrustProvider event={dm}>
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
            <DecryptPlaceholder message={dm}>
              {(plaintext) => <DirectMessageContent event={dm} text={plaintext} />}
            </DecryptPlaceholder>
          </CardBody>
        )}
      </Card>
    </TrustProvider>
  );
}
