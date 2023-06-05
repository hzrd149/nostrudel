import { Button, ButtonProps, useDisclosure } from "@chakra-ui/react";
import { useMemo } from "react";
import { readablizeSats } from "../../helpers/bolt11";
import { parseZapNote, totalZaps } from "../../helpers/zaps";
import { useCurrentAccount } from "../../hooks/use-current-account";
import useEventZaps from "../../hooks/use-event-zaps";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import clientRelaysService from "../../services/client-relays";
import eventZapsService from "../../services/event-zaps";
import { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";
import ZapModal from "../zap-modal";

export default function NoteZapButton({ note, ...props }: { note: NostrEvent } & Omit<ButtonProps, "children">) {
  const account = useCurrentAccount();
  const metadata = useUserMetadata(note.pubkey);
  const zaps = useEventZaps(note.id) ?? [];
  const parsedZaps = useMemo(() => {
    const parsed = [];
    for (const zap of zaps) {
      try {
        parsed.push(parseZapNote(zap));
      } catch (e) {}
    }
    return parsed;
  }, [zaps]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const hasZapped = !!account && parsedZaps.some((zapRequest) => zapRequest.request.pubkey === account.pubkey);
  const tipAddress = metadata?.lud06 || metadata?.lud16;

  const invoicePaid = () => eventZapsService.requestZaps(note.id, clientRelaysService.getReadUrls(), true);

  return (
    <>
      <Button
        leftIcon={<LightningIcon color="yellow.500" />}
        aria-label="Zap Note"
        title="Zap Note"
        colorScheme={hasZapped ? "brand" : undefined}
        {...props}
        onClick={onOpen}
        isDisabled={!tipAddress}
      >
        {readablizeSats(totalZaps(zaps) / 1000)}
      </Button>
      {isOpen && <ZapModal isOpen={isOpen} onClose={onClose} event={note} onPaid={invoicePaid} pubkey={note.pubkey} />}
    </>
  );
}
