import { ReactNode, forwardRef } from "react";
import { AvatarGroup, ButtonGroup, Flex, Text } from "@chakra-ui/react";
import {
  getZapAddressPointer,
  getZapEventPointer,
  getZapPayment,
  getZapRequest,
  getZapSender,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import { humanReadableSats } from "../../../helpers/lightning";
import { EmbedEventPointerCard } from "../../../components/embed-event/card";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import { LightningIcon } from "../../../components/icons";
import NotificationIconEntry from "./notification-icon-entry";
import ZapReceiptMenu from "../../../components/zap/zap-receipt-menu";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";

const ZapNotification = forwardRef<HTMLDivElement, { zap: NostrEvent; onClick?: () => void }>(
  ({ zap, onClick }, ref) => {
    const payment = getZapPayment(zap);
    const request = getZapRequest(zap);
    if (!payment?.amount) return null;

    const sender = getZapSender(zap);
    const nevent = getZapEventPointer(zap);
    const naddr = getZapAddressPointer(zap);

    let eventJSX: ReactNode | null = null;
    if (naddr) {
      eventJSX = (
        <EmbedEventPointerCard
          pointer={{
            type: "naddr",
            data: naddr,
          }}
        />
      );
    } else if (nevent) {
      eventJSX = <EmbedEventPointerCard pointer={{ type: "nevent", data: nevent }} />;
    }

    return (
      <NotificationIconEntry
        ref={ref}
        icon={<LightningIcon boxSize={6} color="yellow.400" />}
        id={zap.id}
        pubkey={sender}
        timestamp={request.created_at}
        summary={
          <>
            {humanReadableSats(payment.amount / 1000)} {request.content}
          </>
        }
        onClick={onClick}
      >
        <Flex gap="2" alignItems="center" pl="2">
          <AvatarGroup size="sm">
            <UserAvatarLink pubkey={sender} />
          </AvatarGroup>
          <Text>zapped {humanReadableSats(payment.amount / 1000)} sats</Text>
          <ButtonGroup size="sm" variant="ghost" ml="auto">
            <ZapReceiptMenu zap={zap} aria-label="More Options" />
          </ButtonGroup>
        </Flex>
        <TextNoteContents event={request} />
        {eventJSX}
      </NotificationIconEntry>
    );
  },
);

export default ZapNotification;
