import { Card, CardBody, CardHeader, Flex, Text } from "@chakra-ui/react";
import { getZapPayment, getZapRequest, getZapSender, KnownEvent } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import { LightningIcon } from "../../../components/icons";
import TextNoteContents from "../../../components/timeline/note/text-note-contents";
import Timestamp from "../../../components/timestamp";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentityIcon from "../../../components/user/user-dns-identity-icon";
import UserLink from "../../../components/user/user-link";
import ZapReceiptMenu from "../../../components/zap/zap-receipt-menu";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";

export function OtherZap({ zap }: { zap: KnownEvent<kinds.Zap> }) {
  const sender = getZapSender(zap);
  const request = getZapRequest(zap);
  const payment = getZapPayment(zap);

  const ref = useEventIntersectionRef(zap);

  return (
    <Card maxW="xl" w="full" ref={ref}>
      <CardHeader display="flex" gap="2" p="4" alignItems="flex-start">
        <Flex gap="2">
          <UserAvatar pubkey={sender} size="sm" />
          <Flex direction="column">
            <Flex alignItems="center" gap="2">
              <UserLink pubkey={sender} fontWeight="bold" />
              <UserDnsIdentityIcon pubkey={sender} />
              <LightningIcon color="yellow.400" />
              {payment?.amount && <Text fontSize="md">{(payment.amount / 1000).toLocaleString()}</Text>}
            </Flex>
          </Flex>
        </Flex>

        <Flex gap="2" ml="auto" alignItems="center">
          <Timestamp timestamp={zap.created_at} />
          <ZapReceiptMenu zap={zap} size="sm" variant="ghost" aria-label="More options" />
        </Flex>
      </CardHeader>

      {request.content && (
        <CardBody px="4" pt="0" pb="4">
          <ContentSettingsProvider event={request}>
            <TextNoteContents event={request} />
          </ContentSettingsProvider>
        </CardBody>
      )}
    </Card>
  );
}
