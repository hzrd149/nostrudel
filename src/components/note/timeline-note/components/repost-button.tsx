import { Button, IconButton, useDisclosure } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import { NostrEvent } from "../../../../types/nostr-event";
import { RepostIcon } from "../../../icons";
import useEventCount from "../../../../hooks/use-event-count";
import useCurrentAccount from "../../../../hooks/use-current-account";
import RepostModal from "./repost-modal";

export default function RepostButton({ event }: { event: NostrEvent }) {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const account = useCurrentAccount();
  const hasReposted = useEventCount(
    account ? { "#e": [event.id], kinds: [kinds.Repost, kinds.GenericRepost], authors: [account.pubkey] } : undefined,
  );
  const repostCount = useEventCount({ "#e": [event.id], kinds: [kinds.Repost, kinds.GenericRepost] });

  return (
    <>
      {repostCount !== undefined && repostCount > 0 ? (
        <Button
          leftIcon={<RepostIcon />}
          onClick={onOpen}
          title="Repost Note"
          colorScheme={hasReposted ? "primary" : undefined}
        >
          {repostCount}
        </Button>
      ) : (
        <IconButton
          icon={<RepostIcon />}
          onClick={onOpen}
          aria-label="Repost Note"
          title="Repost Note"
          colorScheme={hasReposted ? "primary" : undefined}
        />
      )}
      {isOpen && <RepostModal isOpen={isOpen} onClose={onClose} event={event} />}
    </>
  );
}
