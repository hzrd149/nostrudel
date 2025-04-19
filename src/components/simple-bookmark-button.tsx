import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import useEventBookmarkActions from "../hooks/use-event-bookmark-actions";
import { BookmarkIcon, BookmarkedIcon } from "./icons";

export default function SimpleBookmarkButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon">) {
  const { isLoading, toggleBookmark, isBookmarked } = useEventBookmarkActions(event);

  return (
    <IconButton
      icon={isBookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
      onClick={toggleBookmark}
      isLoading={isLoading}
      {...props}
    />
  );
}
