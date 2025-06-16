import { Box, ButtonGroup, Card, CardBody, CardHeader, CardProps, LinkBox, Text } from "@chakra-ui/react";
import {
  DecodeResult,
  getZapAddressPointer,
  getZapEventPointer,
  getZapPayment,
  getZapRecipient,
  getZapRequest,
  getZapSender,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { humanReadableSats } from "../../../helpers/lightning";
import { LightningIcon } from "../../icons";
import TextNoteContents from "../../note/timeline-note/text-note-contents";
import Timestamp from "../../timestamp";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";
import ZapReceiptMenu from "../../zap/zap-receipt-menu";
import { EmbedEventPointerCard } from "./index";

export default function EmbeddedZapRecept({ zap, ...props }: Omit<CardProps, "children"> & { zap: NostrEvent }) {
  const sender = getZapSender(zap);
  const recipient = getZapRecipient(zap);
  const payment = getZapPayment(zap);
  const request = getZapRequest(zap);
  if (!recipient || !payment) return null;

  const pointer = useMemo(() => {
    const event = getZapEventPointer(zap);
    if (event) return { type: "nevent", data: event } satisfies DecodeResult;

    const address = getZapAddressPointer(zap);
    if (address) return { type: "naddr", data: address } satisfies DecodeResult;
  }, [zap]);

  return (
    <Card as={LinkBox} {...props}>
      <CardHeader display="flex" p="2" gap="2" alignItems="center">
        <UserAvatar pubkey={sender} size="sm" />
        <UserLink pubkey={sender} fontWeight="bold" />
        <Text>Zapped</Text>
        <UserLink pubkey={recipient} fontWeight="bold" />

        {payment.amount && (
          <>
            <LightningIcon color="yellow.500" boxSize={5} />
            <Text>{humanReadableSats(payment.amount / 1000)}</Text>
          </>
        )}

        <Timestamp timestamp={zap.created_at} ml="auto" />
        <ButtonGroup size="sm" variant="ghost">
          <ZapReceiptMenu zap={zap} aria-label="More Options" />
        </ButtonGroup>
      </CardHeader>
      <CardBody px="2" pb="2" pt="0" display="flex" flexDirection="column" gap="2">
        <Box>
          <TextNoteContents event={request} />
        </Box>

        {pointer && <EmbedEventPointerCard pointer={pointer} />}
      </CardBody>
    </Card>
  );
}
