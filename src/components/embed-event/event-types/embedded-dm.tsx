import { Card, CardBody, CardHeader, CardProps, LinkBox, Spacer, Text } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { TrustProvider } from "../../../providers/trust";
import UserAvatarLink from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import Timestamp from "../../timestamp";
import DecryptPlaceholder from "../../../views/messages/decrypt-placeholder";
import { MessageContent } from "../../../views/messages/message";
import { getMessageRecipient } from "../../../services/direct-messages";
import useCurrentAccount from "../../../hooks/use-current-account";

export default function EmbeddedDM({ dm, ...props }: Omit<CardProps, "children"> & { dm: NostrEvent }) {
  const account = useCurrentAccount();
  const isOwnMessage = account?.pubkey === dm.pubkey;

  const sender = dm.pubkey;
  const receiver = getMessageRecipient(dm);

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
        </CardHeader>
        <CardBody px="2" pt="0" pb="2">
          <DecryptPlaceholder data={dm.content} pubkey={isOwnMessage ? getMessageRecipient(dm) ?? "" : dm.pubkey}>
            {(text) => <MessageContent event={dm} text={text} />}
          </DecryptPlaceholder>
        </CardBody>
      </Card>
    </TrustProvider>
  );
}
