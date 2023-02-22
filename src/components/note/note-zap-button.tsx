import { Button, ButtonProps } from "@chakra-ui/react";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";

export default function NoteZapButton({ note, ...props }: { note: NostrEvent } & Omit<ButtonProps, "children">) {
  const metadata = useUserMetadata(note.pubkey);

  return (
    <Button
      leftIcon={<LightningIcon color="yellow.500" />}
      aria-label="Zap Note"
      title="Zap Note"
      {...props}
      isDisabled
    >
      0
    </Button>
  );
}
