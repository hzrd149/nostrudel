import { Button, ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";
import { getEventUID, getZapSender } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";

import { humanReadableSats } from "../../helpers/lightning";
import { totalZaps } from "../../helpers/nostr/zaps";
import useEventZaps from "../../hooks/use-event-zaps";
import { NostrEvent } from "nostr-tools";
import { LightningIcon } from "../icons";
import ZapModal from "../event-zap-modal";
import useUserLNURLMetadata from "../../hooks/use-user-lnurl-metadata";
import { useReadRelays } from "../../hooks/use-client-relays";
import { zapsLoader } from "../../services/loaders";

export type NoteZapButtonProps = Omit<ButtonProps, "children"> & {
  event: NostrEvent;
  allowComment?: boolean;
  showEventPreview?: boolean;
};

export default function EventZapButton({ event, allowComment, showEventPreview, ...props }: NoteZapButtonProps) {
  const account = useActiveAccount();
  const { metadata } = useUserLNURLMetadata(event.pubkey);
  const zaps = useEventZaps(event) ?? [];
  const { isOpen, onOpen, onClose } = useDisclosure();

  const hasZapped = !!account && zaps.some((zap) => getZapSender(zap) === account.pubkey);

  const readRelays = useReadRelays();
  const onZapped = () => {
    onClose();
    zapsLoader(event, readRelays).subscribe();
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
          colorScheme={hasZapped ? "primary" : undefined}
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
