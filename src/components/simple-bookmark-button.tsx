import { IconButton, IconButtonProps } from "@chakra-ui/react";

import { NostrEvent } from "../types/nostr-event";
import useCurrentAccount from "../hooks/use-current-account";
import useEventBookmarkActions from "../hooks/use-event-bookmark-actions";
import { BookmarkIcon, BookmarkedIcon } from "./icons";

export default function SimpleBookmarkButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon">) {
  const account = useCurrentAccount();

  const { isLoading, toggleBookmark, isBookmarked } = useEventBookmarkActions(event);

  return (
    <IconButton
      icon={isBookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
      isDisabled={account?.readonly ?? true}
      onClick={toggleBookmark}
      isLoading={isLoading}
      {...props}
    />
  );
}
