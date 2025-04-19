import { ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import useUserLNURLMetadata from "../../hooks/use-user-lnurl-metadata";
import ZapModal from "../event-zap-modal";
import { LightningIcon } from "../icons";

export type SingleZapButton = Omit<ButtonProps, "children"> & {
  event: NostrEvent;
  allowComment?: boolean;
  showEventPreview?: boolean;
};

export default function SingleZapButton({ event, allowComment, showEventPreview, ...props }: SingleZapButton) {
  const { metadata } = useUserLNURLMetadata(event.pubkey);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const canZap = !!metadata?.allowsNostr || event.tags.some((t) => t[0] === "zap");

  if (!canZap) return null;

  return (
    <>
      <IconButton
        icon={<LightningIcon color="yellow.400" verticalAlign="sub" />}
        aria-label="Zap"
        title="Zap"
        {...props}
        onClick={onOpen}
        isDisabled={!canZap}
      />

      {isOpen && (
        <ZapModal
          isOpen={isOpen}
          pubkey={event.pubkey}
          event={event}
          onClose={onClose}
          onZapped={onClose}
          allowComment={allowComment}
          showEmbed={showEventPreview}
        />
      )}
    </>
  );
}
