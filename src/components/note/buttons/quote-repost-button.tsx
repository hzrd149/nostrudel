import { useContext } from "react";
import { IconButton } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";

import { NostrEvent } from "../../../types/nostr-event";
import { QuoteRepostIcon } from "../../icons";
import { PostModalContext } from "../../../providers/post-modal-provider";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { getSharableNoteId } from "../../../helpers/nip19";

export function QuoteRepostButton({ event }: { event: NostrEvent }) {
  const account = useCurrentAccount();
  const { openModal } = useContext(PostModalContext);

  const handleClick = () => {
    const nevent = getSharableNoteId(event.id);
    const draft = {
      kind: Kind.Text,
      tags: [],
      content: "nostr:" + nevent,
      created_at: dayjs().unix(),
    };
    openModal(draft);
  };

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
