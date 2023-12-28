import { Card, CardBody, CardHeader, CardProps, LinkBox, Text } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { TrustProvider } from "../../../providers/local/trust";
import UserAvatarLink from "../../user-avatar-link";
import UserLink from "../../user-link";
import Timestamp from "../../timestamp";
import DecryptPlaceholder from "../../../views/dms/components/decrypt-placeholder";
import useCurrentAccount from "../../../hooks/use-current-account";
import { getDMRecipient, getDMSender } from "../../../helpers/nostr/dms";
import DirectMessageContent from "../../../views/dms/components/direct-message-content";

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
