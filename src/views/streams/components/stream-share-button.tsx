import { useContext } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";

import { PostModalContext } from "../../../providers/route/post-modal-provider";
import { RepostIcon } from "../../../components/icons";
import { ParsedStream } from "../../../helpers/nostr/stream";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";

export type StreamShareButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  stream: ParsedStream;
};

export default function StreamShareButton({
  stream,
  "aria-label": ariaLabel,
  title = "Quote repost",
  ...props
}: StreamShareButtonProps) {
  const { openModal } = useContext(PostModalContext);

  const handleClick = () => {
    const address = useShareableEventAddress(stream.event);
    openModal({ initContent: "\nnostr:" + address });
  };

  return (
    <Button leftIcon={<RepostIcon />} onClick={handleClick} aria-label={ariaLabel || title} title={title} {...props}>
      Share
    </Button>
  );
}
