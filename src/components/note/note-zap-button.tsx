import { Button, ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";
import { getZapSender } from "applesauce-core/helpers";

import { humanReadableSats } from "../../helpers/lightning";
import { totalZaps } from "../../helpers/nostr/zaps";
import useCurrentAccount from "../../hooks/use-current-account";
import useEventZaps from "../../hooks/use-event-zaps";
import eventZapsService from "../../services/event-zaps";
import { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";
import ZapModal from "../event-zap-modal";
import useUserLNURLMetadata from "../../hooks/use-user-lnurl-metadata";
import { getEventUID } from "../../helpers/nostr/event";
import { useReadRelays } from "../../hooks/use-client-relays";

export type NoteZapButtonProps = Omit<ButtonProps, "children"> & {
  event: NostrEvent;
  allowComment?: boolean;
  showEventPreview?: boolean;
};

export default function NoteZapButton({ event, allowComment, showEventPreview, ...props }: NoteZapButtonProps) {
  const account = useCurrentAccount();
  const { metadata } = useUserLNURLMetadata(event.pubkey);
  const zaps = useEventZaps(getEventUID(event)) ?? [];
  const { isOpen, onOpen, onClose } = useDisclosure();

  const hasZapped = !!account && zaps.some((zap) => getZapSender(zap) === account.pubkey);

  const readRelays = useReadRelays();
  const onZapped = () => {
    onClose();
    eventZapsService.requestZaps(getEventUID(event), readRelays, true);
  };

  const total = totalZaps(zaps);
  const canZap = !!metadata?.allowsNostr || event.tags.some((t) => t[0] === "zap");

  return (
    <>
      {total > 0 ? (
        <Button
          leftIcon={<LightningIcon verticalAlign="sub" />}
          aria-label="Zap Note"
          title="Zap Note"
          colorScheme={hasZapped ? "primary" : undefined}
          {...props}
          onClick={onOpen}
          isDisabled={!canZap}
        >
          {humanReadableSats(total / 1000)}
        </Button>
      ) : (
        <IconButton
          icon={<LightningIcon verticalAlign="sub" />}
          aria-label="Zap Note"
          title="Zap Note"
          {...props}
          onClick={onOpen}
          isDisabled={!canZap}
        />
      )}

      {isOpen && (
        <ZapModal
          isOpen={isOpen}
          pubkey={event.pubkey}
          event={event}
          onClose={onClose}
          onZapped={onZapped}
          allowComment={allowComment}
          showEmbed={showEventPreview}
        />
      )}
    </>
  );
}
