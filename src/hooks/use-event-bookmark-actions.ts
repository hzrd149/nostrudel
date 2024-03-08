import { useCallback, useState } from "react";
import dayjs from "dayjs";

import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";
import { useSigningContext } from "../providers/global/signing-provider";
import userUserBookmarksList from "./use-user-bookmarks-list";
import { getEventCoordinate, isReplaceable, pointerMatchEvent } from "../helpers/nostr/event";
import {
  BOOKMARK_LIST_KIND,
  listAddCoordinate,
  listAddEvent,
  listRemoveCoordinate,
  listRemoveEvent,
} from "../helpers/nostr/lists";
import { usePublishEvent } from "../providers/global/publish-provider";

export default function useEventBookmarkActions(event: NostrEvent) {
  const publish = usePublishEvent();
  const { requestSignature } = useSigningContext();

  const [isLoading, setLoading] = useState(false);
  const { list: bookmarkList, eventPointers, addressPointers } = userUserBookmarksList();

  const isBookmarked = isReplaceable(event.kind)
    ? addressPointers.some((p) => pointerMatchEvent(event, p))
    : eventPointers.some((p) => p.id === event.id);

  const removeBookmark = useCallback(async () => {
    setLoading(true);
    let draft: DraftNostrEvent = {
      kind: BOOKMARK_LIST_KIND,
      content: bookmarkList?.content ?? "",
      tags: bookmarkList?.tags ?? [],
      created_at: dayjs().unix(),
    };

    if (!isBookmarked) return;

    if (isReplaceable(event.kind)) draft = listRemoveCoordinate(draft, getEventCoordinate(event));
    else draft = listRemoveEvent(draft, event.id);

    await publish("Remove Bookmark", draft);
    setLoading(false);
  }, [event, publish, bookmarkList, isBookmarked]);

  const addBookmark = useCallback(async () => {
    setLoading(true);
    let draft: DraftNostrEvent = {
      kind: BOOKMARK_LIST_KIND,
      content: bookmarkList?.content ?? "",
      tags: bookmarkList?.tags ?? [],
      created_at: dayjs().unix(),
    };

    if (isBookmarked) return;
    if (isReplaceable(event.kind)) draft = listAddCoordinate(draft, getEventCoordinate(event));
    else draft = listAddEvent(draft, event.id);

    await publish("Bookmark Note", draft);
    setLoading(false);
  }, [event, requestSignature, bookmarkList, isBookmarked]);

  const toggleBookmark = useCallback(async () => {
    if (isBookmarked) return removeBookmark();
    else return addBookmark();
  }, [removeBookmark, addBookmark, isBookmarked]);

  return { isLoading, addBookmark, removeBookmark, toggleBookmark, isBookmarked };
}
