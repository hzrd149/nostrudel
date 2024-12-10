import { IconButton, IconButtonProps, useDisclosure } from "@chakra-ui/react";
import { getZapSender } from "applesauce-core/helpers";

import useCurrentAccount from "../../hooks/use-current-account";
import useEventZaps from "../../hooks/use-event-zaps";
import eventZapsService from "../../services/event-zaps";
import { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";
import ZapModal from "../event-zap-modal";
import useUserLNURLMetadata from "../../hooks/use-user-lnurl-metadata";
import { getEventUID } from "../../helpers/nostr/event";
import { useReadRelays } from "../../hooks/use-client-relays";

export default function EventZapIconButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon" | "onClick">) {
  const account = useCurrentAccount();
  const { metadata } = useUserLNURLMetadata(event.pubkey);
  const zaps = useEventZaps(getEventUID(event)) ?? [];
  const { isOpen, onOpen, onClose } = useDisclosure();

  const readRelays = useReadRelays();
  const onZapped = () => {
    onClose();
    eventZapsService.requestZaps(getEventUID(event), readRelays, true);
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
