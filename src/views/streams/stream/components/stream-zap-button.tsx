import { Button, IconButton, useDisclosure } from "@chakra-ui/react";
import { castEvent, Stream } from "applesauce-common/casts";
import { NostrEvent } from "nostr-tools";

import ZapModal from "../../../../components/event-zap-modal";
import { LightningIcon } from "../../../../components/icons";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import useUserLNURLMetadata from "../../../../hooks/use-user-lnurl-metadata";
import { eventStore } from "../../../../services/event-store";

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
  const host = castEvent(stream, Stream, eventStore).host.pubkey;
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
