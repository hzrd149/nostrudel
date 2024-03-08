import { useContext } from "react";
import { ButtonProps, IconButton } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { QuoteRepostIcon } from "../icons";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import { getSharableEventAddress } from "../../helpers/nip19";

export type QuoteRepostButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  event: NostrEvent;
};

export default function QuoteRepostButton({
  event,
  "aria-label": ariaLabel,
  title = "Quote repost",
  ...props
}: QuoteRepostButtonProps) {
  const { openModal } = useContext(PostModalContext);

  const handleClick = () => {
    const nevent = getSharableEventAddress(event);
    openModal({ cacheFormKey: null, initContent: "\nnostr:" + nevent });
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
