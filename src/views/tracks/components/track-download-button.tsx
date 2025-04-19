import { IconButton, IconButtonProps, Link } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { DownloadIcon } from "../../../components/icons";
import { getDownloadURL } from "../../../helpers/nostr/stemstr";

export default function TrackDownloadButton({
  track,
  ...props
}: { track: NostrEvent } & Omit<IconButtonProps, "aria-label" | "icon">) {
  const download = getDownloadURL(track);

  return download ? (
    <IconButton
      as={Link}
      icon={<DownloadIcon />}
      aria-label="Download"
      title="Download"
      href={download.url}
      download
      isExternal
      {...props}
    />
  ) : null;
}
