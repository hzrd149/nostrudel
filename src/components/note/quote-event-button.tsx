import { useContext } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { QuoteEventIcon } from "../icons";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import { getSharableEventAddress } from "../../services/event-relay-hint";

export default function QuoteEventButton({
  event,
  "aria-label": ariaLabel,
  title = "Quote Note",
  ...props
}: Omit<IconButtonProps, "children" | "onClick" | "aria-label"> & {
  event: NostrEvent;
  "aria-label"?: string;
}) {
  const { openModal } = useContext(PostModalContext);

  const handleClick = () => {
    const nevent = getSharableEventAddress(event);
    openModal({ cacheFormKey: null, initContent: "\nnostr:" + nevent });
  };

  return (
    <IconButton
      icon={<QuoteEventIcon />}
      onClick={handleClick}
      aria-label={ariaLabel || title}
      title={title}
      {...props}
    />
  );
}
