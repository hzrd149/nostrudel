import { useContext } from "react";
import { ButtonProps, IconButton, IconButtonProps } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";

import { NostrEvent } from "../../../types/nostr-event";
import { QuoteRepostIcon } from "../../icons";
import { PostModalContext } from "../../../providers/post-modal-provider";
import { getSharableNoteId } from "../../../helpers/nip19";

export type QuoteRepostButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  event: NostrEvent;
};

export function QuoteRepostButton({
  event,
  "aria-label": ariaLabel = "Quote repost",
  title = "Quote repost",
  ...props
}: QuoteRepostButtonProps) {
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
    <IconButton icon={<QuoteRepostIcon />} onClick={handleClick} aria-label={ariaLabel} title={title} {...props} />
  );
}
