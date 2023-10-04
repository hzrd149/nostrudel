import { Button, IconButton, useDisclosure } from "@chakra-ui/react";
import { ParsedStream } from "../../../helpers/nostr/stream";
import { LightningIcon } from "../../../components/icons";
import { useInvoiceModalContext } from "../../../providers/invoice-modal";
import useUserLNURLMetadata from "../../../hooks/use-user-lnurl-metadata";
import ZapModal from "../../../components/event-zap-modal";
import { useRelaySelectionRelays } from "../../../providers/relay-selection-provider";
import useStreamGoal from "../../../hooks/use-stream-goal";

export default function StreamZapButton({
  stream,
  initComment,
  onZap,
  label,
}: {
  stream: ParsedStream;
  initComment?: string;
  onZap?: () => void;
  label?: string;
}) {
  const zapModal = useDisclosure();
  const { requestPay } = useInvoiceModalContext();
  const zapMetadata = useUserLNURLMetadata(stream.host);
  const relays = useRelaySelectionRelays();
  const goal = useStreamGoal(stream);

  const commonProps = {
    "aria-label": "Zap stream",
    borderColor: "yellow.400",
    variant: "outline",
    onClick: zapModal.onOpen,
    isDisabled: !zapMetadata.metadata?.allowsNostr,
  };

  // const zapEvent = goal || stream.event
  const zapEvent = stream.event;

  return (
    <>
      {label ? (
        <Button leftIcon={<LightningIcon color="yellow.400" />} {...commonProps}>
          {label}
        </Button>
      ) : (
        <IconButton icon={<LightningIcon color="yellow.400" />} {...commonProps} />
      )}

      {zapModal.isOpen && (
        <ZapModal
          isOpen
          event={zapEvent}
          pubkey={stream.host}
          onInvoice={async (invoice) => {
            if (onZap) onZap();
            zapModal.onClose();
            await requestPay(invoice);
          }}
          onClose={zapModal.onClose}
          initialComment={initComment}
          additionalRelays={relays}
          showEmbed
          embedProps={{ goalProps: { showActions: false } }}
        />
      )}
    </>
  );
}
