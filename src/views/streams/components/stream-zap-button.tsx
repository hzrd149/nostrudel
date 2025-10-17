import { Button, IconButton, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import ZapModal from "../../../components/event-zap-modal";
import { LightningIcon } from "../../../components/icons";
import { getStreamHost } from "../../../helpers/nostr/stream";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useUserLNURLMetadata from "../../../hooks/use-user-lnurl-metadata";

export default function StreamZapButton({
  stream,
  initComment,
  onZap,
  label,
}: {
  stream: NostrEvent;
  initComment?: string;
  onZap?: () => void;
  label?: string;
}) {
  const host = getStreamHost(stream);
  const zapModal = useDisclosure();
  const zapMetadata = useUserLNURLMetadata(host);
  const relays = useReadRelays();

  const commonProps = {
    "aria-label": "Zap stream",
    borderColor: "yellow.400",
    variant: "outline",
    onClick: zapModal.onOpen,
    isDisabled: !zapMetadata.metadata?.allowsNostr,
  };

  // const zapEvent = goal || stream.event
  const zapEvent = stream;

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
          pubkey={host}
          onZapped={async () => {
            if (onZap) onZap();
            zapModal.onClose();
          }}
          onClose={zapModal.onClose}
          initialComment={initComment}
          additionalRelays={relays}
          showEmbed
        />
      )}
    </>
  );
}
