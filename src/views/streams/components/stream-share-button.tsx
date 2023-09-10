import { useContext } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";

import { getSharableEventAddress } from "../../../helpers/nip19";
import { DraftNostrEvent } from "../../../types/nostr-event";
import { PostModalContext } from "../../../providers/post-modal-provider";
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
    openModal("\nnostr:" + nevent);
  };

  return (
    <Button leftIcon={<RepostIcon />} onClick={handleClick} aria-label={ariaLabel || title} title={title} {...props}>
      Share
    </Button>
  );
}
