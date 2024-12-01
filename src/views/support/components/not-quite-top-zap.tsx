import { Box, Card, CardBody, CardHeader, Flex, Grid, Spacer, Text, TextProps } from "@chakra-ui/react";
import { getZapPayment, getZapRequest, getZapSender } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";
import { LightningIcon } from "../../../components/icons";
import Timestamp from "../../../components/timestamp";
import UserDnsIdentityIcon from "../../../components/user/user-dns-identity-icon";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { TrustProvider } from "../../../providers/local/trust-provider";

export function NotQuiteTopZap({ zap, color }: { zap: NostrEvent; color: TextProps["color"] }) {
  const sender = getZapSender(zap);
  const request = getZapRequest(zap);
  const payment = getZapPayment(zap);

  const ref = useEventIntersectionRef(zap);

  return (
    <Card maxW="2xl" w="full" ref={ref} borderColor={color} variant="outline" mt="6">
      <CardHeader display="flex" gap="2" px="4" py="2" alignItems="flex-start">
        <UserAvatar pubkey={sender} size="lg" ml="-8" mt="-8" />
        <Flex alignItems="center" gap="2">
          <UserLink pubkey={sender} fontWeight="bold" fontSize="lg" />
          <UserDnsIdentityIcon pubkey={sender} />
        </Flex>
        <Flex gap="2">
          <LightningIcon color="yellow.400" boxSize={6} />
          {payment?.amount && (
            <Text color={color} fontSize="lg" fontWeight="bold">
              {(payment.amount / 1000).toLocaleString()}
            </Text>
          )}
        </Flex>

        <Flex gap="2" ml="auto" alignItems="center">
          <Timestamp timestamp={zap.created_at} />
          <DebugEventButton event={zap} size="sm" variant="ghost" />
        </Flex>
      </CardHeader>

      {request.content && (
        <CardBody px="4" pt="0" pb="4">
          <TrustProvider event={request}>
            <TextNoteContents event={request} />
          </TrustProvider>
        </CardBody>
      )}
    </Card>
  );
}
