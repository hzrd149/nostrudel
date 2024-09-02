import { Box, ButtonGroup, Card, CardBody, CardHeader, CardProps, LinkBox, Text } from "@chakra-ui/react";
import { useMemo } from "react";

import { NostrEvent } from "../../../types/nostr-event";
import UserLink from "../../user/user-link";
import Timestamp from "../../timestamp";
import { getParsedZap, getZapRecipient } from "../../../helpers/nostr/zaps";
import TextNoteContents from "../../note/timeline-note/text-note-contents";
import UserAvatar from "../../user/user-avatar";
import { LightningIcon } from "../../icons";
import { readablizeSats } from "../../../helpers/bolt11";
import ZapReceiptMenu from "../../zap/zap-receipt-menu";
import { getPointerFromTag } from "../../../helpers/nip19";
import { EmbedEventPointer } from "../index";

export default function EmbeddedZapRecept({ zap, ...props }: Omit<CardProps, "children"> & { zap: NostrEvent }) {
  const parsed = useMemo(() => getParsedZap(zap), [zap]);
  if (!parsed) return null;
  const recipient = getZapRecipient(parsed.request);
  if (!recipient) return null;

  const eTag = parsed.request.tags.find((t) => t[0] === "e" && t[1]);
  const pointer = eTag && getPointerFromTag(eTag);

  return (
    <Card as={LinkBox} {...props}>
      <CardHeader display="flex" p="2" gap="2" alignItems="center">
        <UserAvatar pubkey={parsed.request.pubkey} size="sm" />
        <UserLink pubkey={parsed.request.pubkey} fontWeight="bold" />
        <Text>Zapped</Text>
        <UserLink pubkey={recipient} fontWeight="bold" />

        {parsed.payment.amount && (
          <>
            <LightningIcon color="yellow.500" boxSize={5} />
            <Text>{readablizeSats(parsed.payment.amount / 1000)}</Text>
          </>
        )}

        <Timestamp timestamp={parsed.event.created_at} ml="auto" />
        <ButtonGroup size="sm" variant="ghost">
          <ZapReceiptMenu zap={zap} aria-label="More Options" />
        </ButtonGroup>
      </CardHeader>
      <CardBody px="2" pb="2" pt="0" display="flex" flexDirection="column" gap="2">
        <Box>
          <TextNoteContents event={parsed.request} />
        </Box>

        {pointer && <EmbedEventPointer pointer={pointer} />}
      </CardBody>
    </Card>
  );
}
