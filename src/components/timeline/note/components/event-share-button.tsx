import { Button, ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";

import { TimelineModel } from "applesauce-core/models";
import { useMemo } from "react";
import { RepostIcon } from "../../../icons";
import ShareModal from "./share-modal";

export default function EventShareButton({
  event,
  title = "Share Event",
  ...props
}: Omit<ButtonProps, "children"> & { event: NostrEvent; title?: string }) {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const account = useActiveAccount();
  const shares = useEventModel(
    TimelineModel,
    account ? [{ "#e": [event.id], kinds: [kinds.Repost, kinds.GenericRepost], authors: [account.pubkey] }] : undefined,
  );
  const shared = useMemo(() => shares?.some((e) => e.pubkey === account?.pubkey), [shares, account?.pubkey]);

  return (
    <>
      {shares !== undefined && shares.length > 0 ? (
        <Button
          leftIcon={<RepostIcon />}
          onClick={onOpen}
          title={title}
          colorScheme={shared ? "primary" : undefined}
          {...props}
        >
          {shares.length}
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
