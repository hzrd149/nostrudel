import { Button, ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";

import { readablizeSats } from "../../helpers/bolt11";
import { totalZaps } from "../../helpers/zaps";
import { useCurrentAccount } from "../../hooks/use-current-account";
import useEventZaps from "../../hooks/use-event-zaps";
import clientRelaysService from "../../services/client-relays";
import eventZapsService from "../../services/event-zaps";
import { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";
import ZapModal from "../zap-modal";
import { useInvoiceModalContext } from "../../providers/invoice-modal";
import useUserLNURLMetadata from "../../hooks/use-user-lnurl-metadata";

export type NoteZapButtonProps = Omit<ButtonProps, "children"> & {
  event: NostrEvent;
  allowComment?: boolean;
  showEventPreview?: boolean;
};

export default function NoteZapButton({ event, allowComment, showEventPreview, ...props }: NoteZapButtonProps) {
  const account = useCurrentAccount();
  const { metadata } = useUserLNURLMetadata(event.pubkey);
  const { requestPay } = useInvoiceModalContext();
  const zaps = useEventZaps(event.id);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const hasZapped = !!account && zaps.some((zap) => zap.request.pubkey === account.pubkey);

  const handleInvoice = async (invoice: string) => {
    onClose();
    await requestPay(invoice);
    eventZapsService.requestZaps(event.id, clientRelaysService.getReadUrls(), true);
  };

  const total = totalZaps(zaps);

  return (
    <>
      {total > 0 ? (
        <Button
          leftIcon={<LightningIcon />}
          aria-label="Zap Note"
          title="Zap Note"
          colorScheme={hasZapped ? "brand" : undefined}
          {...props}
          onClick={onOpen}
          isDisabled={!metadata?.allowsNostr}
        >
          {readablizeSats(total / 1000)}
        </Button>
      ) : (
        <IconButton
          icon={<LightningIcon />}
          aria-label="Zap Note"
          title="Zap Note"
          {...props}
          onClick={onOpen}
          isDisabled={!metadata?.allowsNostr}
        />
      )}

      {isOpen && (
        <ZapModal
          isOpen={isOpen}
          onClose={onClose}
          event={event}
          onInvoice={handleInvoice}
          pubkey={event.pubkey}
          allowComment={allowComment}
          showEventPreview={showEventPreview}
        />
      )}
    </>
  );
}
