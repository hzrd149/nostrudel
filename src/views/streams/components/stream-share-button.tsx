import { useContext } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { PostModalContext } from "../../../providers/route/post-modal-provider";
import { RepostIcon } from "../../../components/icons";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";

export type StreamShareButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  stream: NostrEvent;
};

export default function StreamShareButton({
  stream,
  "aria-label": ariaLabel,
  title = "Quote share",
  ...props
}: StreamShareButtonProps) {
  const { openModal } = useContext(PostModalContext);

  const handleClick = () => {
    const address = useShareableEventAddress(stream);
    openModal({ initContent: "\nnostr:" + address });
  };

  return (
    <Button leftIcon={<RepostIcon />} onClick={handleClick} aria-label={ariaLabel || title} title={title} {...props}>
      Share
    </Button>
  );
}
