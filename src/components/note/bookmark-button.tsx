import {
  Button,
  Flex,
  IconButton,
  IconButtonProps,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { BookmarkEvent, CreateBookmarkList, UnbookmarkEvent } from "applesauce-actions/actions/bookmarks";
import { getEventUID, getReplaceableIdentifier } from "applesauce-core/helpers";
import { isEventPointerInList } from "applesauce-core/helpers/lists";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";

import { getListTitle, isEventInList } from "../../helpers/nostr/lists";
import useAsyncAction from "../../hooks/use-async-action";
import userUserBookmarksList from "../../hooks/use-user-bookmarks-list";
import useUserSets from "../../hooks/use-user-lists";
import { usePublishEvent } from "../../providers/global/publish-provider";
import NewBookmarkSetModal from "../../views/lists/components/new-set-modal";
import { BookmarkedIcon, BookmarkIcon } from "../icons";
import BookmarkAdd from "../icons/bookmark-add";
import BookmarkMinus from "../icons/bookmark-minus";

function PrimaryBookmarkButton({ event }: { event: NostrEvent }) {
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
    <Button
      leftIcon={bookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
      onClick={toggle.run}
      isLoading={toggle.loading}
      colorScheme={bookmarked ? "red" : "primary"}
      variant={bookmarked ? "solid" : "outline"}
      size="sm"
    >
      {bookmarked ? "Remove Bookmark" : "Add Bookmark"}
    </Button>
  );
}

function BookmarkListItem({ list, event }: { list: NostrEvent; event: NostrEvent }) {
  const publish = usePublishEvent();
  const actions = useActionHub();

  const bookmarked = isEventInList(list, event);

  const toggle = useAsyncAction(async () => {
    if (bookmarked) {
      await actions
        .exec(UnbookmarkEvent, event, getReplaceableIdentifier(list))
        .forEach((e) => publish("Remove from list", e));
    } else {
      await actions
        .exec(BookmarkEvent, event, getReplaceableIdentifier(list))
        .forEach((e) => publish("Add to list", e));
    }
  }, [event, publish, list, bookmarked]);

  return (
    <Flex alignItems="center" gap="2">
      <Text flex="1" fontSize="sm" isTruncated>
        {getListTitle(list)}
      </Text>
      <Button
        leftIcon={bookmarked ? <BookmarkMinus /> : <BookmarkAdd />}
        onClick={toggle.run}
        isLoading={toggle.loading}
        size="xs"
        colorScheme={bookmarked ? "red" : "green"}
        variant="outline"
      >
        {bookmarked ? "Remove" : "Add"}
      </Button>
    </Flex>
  );
}

export default function BookmarkEventButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon">) {
  const modal = useDisclosure();
  const account = useActiveAccount();
  const { list } = userUserBookmarksList();

  const bookmarked = !!list && isEventInList(list, event);

  const bookmarkSets =
    useUserSets(account?.pubkey)?.filter((set) => set.kind === kinds.Genericlists || set.kind === kinds.Bookmarksets) ??
    [];

  const inSets = bookmarkSets.filter((set) => isEventInList(set, event));

  return (
    <>
      <Popover isLazy>
        <PopoverTrigger>
          <IconButton
            icon={inSets.length > 0 || bookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
            {...props}
            aria-label={props["aria-label"] || "Bookmark Event"}
          />
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>Bookmark Event</PopoverHeader>
          <PopoverBody display="flex" flexDirection="column" gap="2">
            {/* Primary bookmark button */}
            <PrimaryBookmarkButton event={event} />

            {/* Bookmark lists */}
            {bookmarkSets.length > 0 && (
              <>
                <Text fontSize="sm" fontWeight="semibold" mt="2" mb="1">
                  Bookmark Lists
                </Text>
                {bookmarkSets.map((list) => (
                  <BookmarkListItem key={getEventUID(list)} list={list} event={event} />
                ))}
              </>
            )}

            {/* New list button */}
            <Button onClick={modal.onOpen} size="sm" variant="ghost" mt="2">
              Create New List
            </Button>
          </PopoverBody>
        </PopoverContent>
      </Popover>
      {modal.isOpen && (
        <NewBookmarkSetModal
          onClose={modal.onClose}
          isOpen
          onCreated={modal.onClose}
          initKind={kinds.Bookmarksets}
          allowSelectKind={false}
        />
      )}
    </>
  );
}
