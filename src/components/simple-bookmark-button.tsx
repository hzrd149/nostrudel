import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { BookmarkIcon, BookmarkedIcon } from "./icons";
import userUserBookmarksList from "../hooks/use-user-bookmarks-list";
import { useActionHub } from "applesauce-react/hooks";
import { usePublishEvent } from "../providers/global/publish-provider";
import { isEventInList } from "applesauce-core/helpers";
import useAsyncAction from "../hooks/use-async-action";
import { BookmarkEvent, CreateBookmarkList, UnbookmarkEvent } from "applesauce-actions/actions";

export default function SimpleBookmarkButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon">) {
  const { list } = userUserBookmarksList();
  const actions = useActionHub();
  const publish = usePublishEvent();

  const bookmarked = !!list && isEventInList(list, event);

  const toggle = useAsyncAction(async () => {
    if (!list) {
      await actions.exec(CreateBookmarkList, [event]).forEach((e) => publish("Add bookmark", e));
    } else if (bookmarked) {
      await actions.exec(UnbookmarkEvent, event).forEach((e) => publish("Remove bookmark", e));
    } else {
      await actions.exec(BookmarkEvent, event).forEach((e) => publish("Add bookmark", e));
    }
  }, [event, publish, list, bookmarked]);

  return (
    <IconButton
      icon={bookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
      onClick={toggle.run}
      isLoading={toggle.loading}
      {...props}
      aria-pressed={bookmarked}
      title={props.title || (bookmarked ? "Remove bookmark" : "Add bookmark")}
      aria-label={props["aria-label"] || (bookmarked ? "Remove bookmark" : "Add bookmark")}
    />
  );
}
