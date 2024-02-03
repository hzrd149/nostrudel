import { Button, IconButton, useDisclosure } from "@chakra-ui/react";
import { ParsedStream } from "../../../helpers/nostr/stream";
import { LightningIcon } from "../../../components/icons";
import useUserLNURLMetadata from "../../../hooks/use-user-lnurl-metadata";
import ZapModal from "../../../components/event-zap-modal";
import useStreamGoal from "../../../hooks/use-stream-goal";
import { useReadRelays } from "../../../hooks/use-client-relays";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay-context";

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
  const zapMetadata = useUserLNURLMetadata(stream.host);
  const relays = useReadRelays(useAdditionalRelayContext());
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
          onZapped={async () => {
            if (onZap) onZap();
            zapModal.onClose();
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
