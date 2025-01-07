import { Button, IconButton, useDisclosure } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import { NostrEvent } from "../../../../types/nostr-event";
import { RepostIcon } from "../../../icons";
import useEventCount from "../../../../hooks/use-event-count";
import useCurrentAccount from "../../../../hooks/use-current-account";
import ShareModal from "./share-modal";

export default function ShareButton({ event }: { event: NostrEvent }) {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const account = useCurrentAccount();
  const hasShared = useEventCount(
    account ? { "#e": [event.id], kinds: [kinds.Repost, kinds.GenericRepost], authors: [account.pubkey] } : undefined,
  );
  const ShareCount = useEventCount({ "#e": [event.id], kinds: [kinds.Repost, kinds.GenericRepost] });

  return (
    <>
      {ShareCount !== undefined && ShareCount > 0 ? (
        <Button
          leftIcon={<RepostIcon />}
          onClick={onOpen}
          title="Repost Note"
          colorScheme={hasShared ? "primary" : undefined}
        >
          {ShareCount}
        </Button>
      ) : (
        <IconButton
          icon={<RepostIcon />}
          onClick={onOpen}
          aria-label="Repost Note"
          title="Repost Note"
          colorScheme={hasShared ? "primary" : undefined}
        />
      )}
      {isOpen && <ShareModal isOpen={isOpen} onClose={onClose} event={event} />}
    </>
  );
}
