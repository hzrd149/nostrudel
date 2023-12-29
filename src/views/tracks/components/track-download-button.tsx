import { IconButton, IconButtonProps, Link } from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import { getDownloadURL } from "../../../helpers/nostr/stemstr";
import { DownloadIcon } from "../../../components/icons";

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
