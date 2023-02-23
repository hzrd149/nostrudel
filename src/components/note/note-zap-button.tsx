import { Button, ButtonProps } from "@chakra-ui/react";
import { readableAmountInSats } from "../../helpers/bolt11";
import { totalZaps } from "../../helpers/nip57";
import useEventZaps from "../../hooks/use-event-zaps";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";

export default function NoteZapButton({ note, ...props }: { note: NostrEvent } & Omit<ButtonProps, "children">) {
  const metadata = useUserMetadata(note.pubkey);
  const zaps = useEventZaps(note.id, [], true) ?? [];

  return (
    <Button
      leftIcon={<LightningIcon color="yellow.500" />}
      aria-label="Zap Note"
      title="Zap Note"
      {...props}
      isDisabled
    >
      {readableAmountInSats(totalZaps(zaps), false)}
    </Button>
  );
}
