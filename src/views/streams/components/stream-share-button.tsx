import { useContext } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";

import { getSharableEventAddress } from "../../../helpers/nip19";
import { PostModalContext } from "../../../providers/route/post-modal-provider";
import { RepostIcon } from "../../../components/icons";
import { ParsedStream } from "../../../helpers/nostr/stream";

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
    const nevent = getSharableEventAddress(stream.event);
    openModal({ initContent: "\nnostr:" + nevent });
  };

  return (
    <Button leftIcon={<RepostIcon />} onClick={handleClick} aria-label={ariaLabel || title} title={title} {...props}>
      Share
    </Button>
  );
}
