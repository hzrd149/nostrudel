import { Button, IconButton, useDisclosure } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { RepostIcon } from "../../icons";
import useEventCount from "../../../hooks/use-event-count";
import RepostModal from "./repost-modal";

export default function RepostButton({ event }: { event: NostrEvent }) {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const repostCount = useEventCount({ "#e": [event.id], kinds: [6] });

  return (
    <>
      {repostCount !== undefined && repostCount > 0 ? (
        <Button leftIcon={<RepostIcon />} onClick={onOpen} title="Repost Note">
          {repostCount}
        </Button>
      ) : (
        <IconButton icon={<RepostIcon />} onClick={onOpen} aria-label="Repost Note" title="Repost Note" />
      )}
      {isOpen && <RepostModal isOpen={isOpen} onClose={onClose} event={event} />}
    </>
  );
}
