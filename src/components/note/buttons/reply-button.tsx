import { useContext } from "react";
import { IconButton } from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import { ReplyIcon } from "../../icons";
import { PostModalContext } from "../../../providers/post-modal-provider";
import { buildReply } from "../../../helpers/nostr-event";
import { useCurrentAccount } from "../../../hooks/use-current-account";

export function ReplyButton({ event }: { event: NostrEvent }) {
  const account = useCurrentAccount();
  const { openModal } = useContext(PostModalContext);

  const reply = () => openModal(buildReply(event));

  return (
    <IconButton
      icon={<ReplyIcon />}
      title="Reply"
      aria-label="Reply"
      onClick={reply}
      isDisabled={account?.readonly ?? true}
    />
  );
}
