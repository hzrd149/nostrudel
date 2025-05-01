import { Button, ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";

import useEventCount from "../../../../hooks/use-event-count";
import { RepostIcon } from "../../../icons";
import ShareModal from "./share-modal";

export default function EventShareButton({
  event,
  title = "Share Event",
  ...props
}: Omit<ButtonProps, "children"> & { event: NostrEvent; title?: string }) {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const account = useActiveAccount();
  const shared = useEventCount(
    account ? { "#e": [event.id], kinds: [kinds.Repost, kinds.GenericRepost], authors: [account.pubkey] } : undefined,
  );
  const shareCount = useEventCount({ "#e": [event.id], kinds: [kinds.Repost, kinds.GenericRepost] });

  return (
    <>
      {shareCount !== undefined && shareCount > 0 ? (
        <Button
          leftIcon={<RepostIcon />}
          onClick={onOpen}
          title={title}
          colorScheme={shared ? "primary" : undefined}
          {...props}
        >
          {shareCount}
        </Button>
      ) : (
        <IconButton
          icon={<RepostIcon />}
          onClick={onOpen}
          aria-label={title}
          title={title}
          colorScheme={shared ? "primary" : undefined}
          {...props}
        />
      )}
      {isOpen && <ShareModal isOpen={isOpen} onClose={onClose} event={event} />}
    </>
  );
}
