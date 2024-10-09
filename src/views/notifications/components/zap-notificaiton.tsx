import { ReactNode, forwardRef, useMemo } from "react";
import { AvatarGroup, ButtonGroup, Flex, Text } from "@chakra-ui/react";

import { NostrEvent, isATag, isETag } from "../../../types/nostr-event";
import { getParsedZap } from "../../../helpers/nostr/zaps";
import { readablizeSats } from "../../../helpers/bolt11";
import { parseCoordinate } from "../../../helpers/nostr/event";
import { EmbedEventPointer } from "../../../components/embed-event";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import { LightningIcon } from "../../../components/icons";
import NotificationIconEntry from "./notification-icon-entry";
import ZapReceiptMenu from "../../../components/zap/zap-receipt-menu";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";

const ZapNotification = forwardRef<HTMLDivElement, { event: NostrEvent; onClick?: () => void }>(
  ({ event, onClick }, ref) => {
    const zap = useMemo(() => getParsedZap(event), [event]);

    if (!zap || !zap.payment.amount) return null;

    const eventId = zap?.request.tags.find(isETag)?.[1];
    const coordinate = zap?.request.tags.find(isATag)?.[1];
    const parsedCoordinate = coordinate ? parseCoordinate(coordinate) : null;

    let eventJSX: ReactNode | null = null;
    if (parsedCoordinate && parsedCoordinate.identifier) {
      eventJSX = (
        <EmbedEventPointer
          pointer={{
            type: "naddr",
            data: {
              pubkey: parsedCoordinate.pubkey,
              identifier: parsedCoordinate.identifier,
              kind: parsedCoordinate.kind,
            },
          }}
        />
      );
    } else if (eventId) {
      eventJSX = <EmbedEventPointer pointer={{ type: "note", data: eventId }} />;
    }

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<LightningIcon boxSize={6} color="yellow.400" />}
        id={event.id}
        pubkey={zap.request.pubkey}
        timestamp={zap.request.created_at}
        summary={
          <>
            {readablizeSats(zap.payment.amount / 1000)} {zap.request.content}
          </>
        }
        onClick={onClick}
      >
        <Flex gap="2" alignItems="center" pl="2">
          <AvatarGroup size="sm">
            <UserAvatarLink pubkey={zap.request.pubkey} />
          </AvatarGroup>
          <Text>zapped {readablizeSats(zap.payment.amount / 1000)} sats</Text>
          <ButtonGroup size="sm" variant="ghost" ml="auto">
            <ZapReceiptMenu zap={zap.event} aria-label="More Options" />
          </ButtonGroup>
        </Flex>
        <TextNoteContents event={zap.request} />
        {eventJSX}
      </NotificationIconEntry>
    );
  },
);

export default ZapNotification;
