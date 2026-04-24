import { Button, ButtonProps } from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";
import { useContext } from "react";

import { RepostIcon } from "../../../components/icons";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import { PostModalContext } from "../../../providers/route/post-modal-provider";

export type StreamShareButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  stream: Stream;
};

export default function StreamShareButton({
  stream,
  "aria-label": ariaLabel,
  title = "Quote share",
  ...props
}: StreamShareButtonProps) {
  const { openModal } = useContext(PostModalContext);
  const address = useShareableEventAddress(stream.event, stream.relays);

  const handleClick = () => {
    openModal({ initContent: "\nnostr:" + address });
  };

  return (
    <Button leftIcon={<RepostIcon />} onClick={handleClick} aria-label={ariaLabel || title} title={title} {...props}>
      Share
    </Button>
  );
}
