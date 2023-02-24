import { IconButton, IconButtonProps, useDisclosure, useToast } from "@chakra-ui/react";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { LightningIcon } from "./icons";
import { useState } from "react";
import { encodeText } from "../helpers/bech32";
import ZapModal from "./zap-modal";

export const UserTipButton = ({ pubkey, ...props }: { pubkey: string } & Omit<IconButtonProps, "aria-label">) => {
  const metadata = useUserMetadata(pubkey);
  const { isOpen, onOpen, onClose } = useDisclosure();
  if (!metadata) return null;

  // use lud06 and lud16 fields interchangeably
  let tipAddress = metadata.lud06 || metadata.lud16;

  if (!tipAddress) return null;

  return (
    <>
      <IconButton
        onClick={onOpen}
        aria-label="Send Tip"
        title="Send Tip"
        icon={<LightningIcon />}
        color="yellow.400"
        {...props}
      />
      {isOpen && <ZapModal isOpen={isOpen} onClose={onClose} pubkey={pubkey} />}
    </>
  );
};
