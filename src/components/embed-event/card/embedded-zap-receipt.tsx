import { Box, ButtonGroup, Card, CardBody, CardHeader, CardProps, LinkBox, Text } from "@chakra-ui/react";
import { Zap } from "applesauce-common/casts";
import { DecodeResult, KnownEvent } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { useMemo } from "react";

import useCastEvent from "../../../hooks/use-cast-event";

import { LightningIcon } from "../../icons";
import TextNoteContents from "../../timeline/note/text-note-contents";
import Timestamp from "../../timestamp";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";
import ValueDisplay from "../../value-display";
import ZapReceiptMenu from "../../zap/zap-receipt-menu";
import { EmbedEventPointerCard } from "./index";

export default function EmbeddedZapRecept({
  zap,
  ...props
}: Omit<CardProps, "children"> & { zap: KnownEvent<kinds.Zap> }) {
  const cast = useCastEvent(zap, Zap);

  const pointer = useMemo(() => {
    if (!cast) return;
    if (cast.eventPointer) return { type: "nevent", data: cast.eventPointer } satisfies DecodeResult;
    if (cast.addressPointer) return { type: "naddr", data: cast.addressPointer } satisfies DecodeResult;
  }, [cast]);

  if (!cast) return null;

  return (
    <Card as={LinkBox} {...props}>
      <CardHeader display="flex" p="2" gap="2" alignItems="center">
        <UserAvatar pubkey={cast.sender.pubkey} size="sm" />
        <UserLink pubkey={cast.sender.pubkey} fontWeight="bold" />
        <Text>Zapped</Text>
        <UserLink pubkey={cast.recipient.pubkey} fontWeight="bold" />

        {cast.amount && (
          <>
            <LightningIcon color="yellow.500" boxSize={5} />
            <ValueDisplay sats={cast.amount / 1000} />
          </>
        )}

        <Timestamp timestamp={zap.created_at} ml="auto" />
        <ButtonGroup size="sm" variant="ghost">
          <ZapReceiptMenu zap={zap} aria-label="More Options" />
        </ButtonGroup>
      </CardHeader>
      <CardBody px="2" pb="2" pt="0" display="flex" flexDirection="column" gap="2">
        <Box>
          <TextNoteContents event={cast.request} />
        </Box>

        {pointer && <EmbedEventPointerCard pointer={pointer} />}
      </CardBody>
    </Card>
  );
}
