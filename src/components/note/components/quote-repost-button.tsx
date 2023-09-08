import { useContext } from "react";
import { ButtonProps, IconButton } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";

import { NostrEvent } from "../../../types/nostr-event";
import { QuoteRepostIcon } from "../../icons";
import { PostModalContext } from "../../../providers/post-modal-provider";
import { getSharableEventAddress } from "../../../helpers/nip19";

export type QuoteRepostButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  event: NostrEvent;
};

export function QuoteRepostButton({
  event,
  "aria-label": ariaLabel,
  title = "Quote repost",
  ...props
}: QuoteRepostButtonProps) {
  const { openModal } = useContext(PostModalContext);

  const handleClick = () => {
    const nevent = getSharableEventAddress(event);
    const draft = {
      kind: Kind.Text,
      tags: [],
      content: "\nnostr:" + nevent,
      created_at: dayjs().unix(),
    };
    openModal(draft);
  };

  return (
    <IconButton
      icon={<QuoteRepostIcon />}
      onClick={handleClick}
      aria-label={ariaLabel || title}
      title={title}
      {...props}
    />
  );
}
