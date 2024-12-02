import { useContext } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { ExternalLinkIcon } from "../../../components/icons";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import { AppHandlerContext } from "../../../providers/route/app-handler-provider";
import useAsyncErrorHandler from "../../../hooks/use-async-error-handler";

export type StreamOpenButtonProps = Omit<IconButtonProps, "onClick" | "aria-label"> & {
  stream: NostrEvent;
  "aria-label"?: string;
};

export default function StreamOpenButton({
  stream,
  "aria-label": ariaLabel,
  title = "Open stream",
  ...props
}: StreamOpenButtonProps) {
  const { openAddress } = useContext(AppHandlerContext);
  const address = useShareableEventAddress(stream);

  const handleClick = useAsyncErrorHandler(async () => {
    if (!address) throw new Error("Failed to get address");
    openAddress(address);
  }, [address]);

  if (!address) return null;

  return (
    <IconButton
      icon={<ExternalLinkIcon />}
      onClick={handleClick}
      aria-label={ariaLabel || title}
      title={title}
      {...props}
    >
      Share
    </IconButton>
  );
}
