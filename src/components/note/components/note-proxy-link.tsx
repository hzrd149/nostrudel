import { IconButton, IconButtonProps, Link } from "@chakra-ui/react";
import { ExternalLinkIcon } from "../../icons";
import { useMemo } from "react";
import { NostrEvent } from "../../../types/nostr-event";

export default function NoteProxyLink({
  event,
  ...props
}: Omit<IconButtonProps, "aria-label"> & { event: NostrEvent }) {
  const externalLink = useMemo(() => event.tags.find((t) => t[0] === "mostr" || t[0] === "proxy"), [event])?.[1];

  return (
    <IconButton
      as={Link}
      icon={<ExternalLinkIcon />}
      href={externalLink}
      target="_blank"
      aria-label="Open External"
      title="Open External"
      {...props}
    />
  );
}
