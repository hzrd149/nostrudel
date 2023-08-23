import { useContext } from "react";
import { IconButton } from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import { QuoteRepostIcon } from "../../icons";
import { PostModalContext } from "../../../providers/post-modal-provider";
import { buildQuoteRepost } from "../../../helpers/nostr/events";
import { useCurrentAccount } from "../../../hooks/use-current-account";

export function QuoteRepostButton({ event }: { event: NostrEvent }) {
  const account = useCurrentAccount();
  const { openModal } = useContext(PostModalContext);

  const handleClick = () => openModal(buildQuoteRepost(event));

  return (
    <IconButton
      icon={<QuoteRepostIcon />}
      onClick={handleClick}
      aria-label="Quote repost"
      title="Quote repost"
      isDisabled={account?.readonly ?? true}
    />
  );
}
