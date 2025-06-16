import { IconButton, IconButtonProps, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { useReadRelays } from "../../hooks/use-client-relays";
import useUserLNURLMetadata from "../../hooks/use-user-lnurl-metadata";
import { zapsLoader } from "../../services/loaders";
import ZapModal from "../event-zap-modal";
import { LightningIcon } from "../icons";

export default function EventZapIconButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon" | "onClick">) {
  const { metadata } = useUserLNURLMetadata(event.pubkey);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const readRelays = useReadRelays();
  const onZapped = () => {
    onClose();
    zapsLoader(event, readRelays).subscribe();
  };

  const canZap = !!metadata?.allowsNostr || event.tags.some((t) => t[0] === "zap");

  return (
    <>
      <IconButton
        icon={<LightningIcon verticalAlign="sub" color="yellow.400" />}
        {...props}
        onClick={onOpen}
        isDisabled={!canZap}
      />

      {isOpen && <ZapModal isOpen={isOpen} pubkey={event.pubkey} event={event} onClose={onClose} onZapped={onZapped} />}
    </>
  );
}
