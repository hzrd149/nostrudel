import { IconButton, IconButtonProps, useDisclosure } from "@chakra-ui/react";
import useUserProfile from "../../../hooks/use-user-profile";
import { LightningIcon } from "../../../components/icons";
import ZapModal from "../../../components/event-zap-modal";

export default function UserZapButton({ pubkey, ...props }: { pubkey: string } & Omit<IconButtonProps, "aria-label">) {
  const metadata = useUserProfile(pubkey);
  const { isOpen, onOpen, onClose } = useDisclosure();
  if (!metadata) return null;

  // use lud06 and lud16 fields interchangeably
  const tipAddress = metadata.lud06 || metadata.lud16;

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
      {isOpen && (
        <ZapModal
          isOpen={isOpen}
          onClose={onClose}
          pubkey={pubkey}
          onZapped={async () => {
            onClose();
          }}
        />
      )}
    </>
  );
}
