import { useCallback, useState } from "react";
import {
  IconButton,
  IconButtonProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  useDisclosure,
} from "@chakra-ui/react";

import useCurrentAccount from "../../hooks/use-current-account";
import useUserLists from "../../hooks/use-user-lists";
import {
  NOTE_LIST_KIND,
  listAddEvent,
  listRemoveEvent,
  getEventPointersFromList,
  getListName,
} from "../../helpers/nostr/lists";
import { NostrEvent } from "../../types/nostr-event";
import { getEventCoordinate } from "../../helpers/nostr/event";
import { BookmarkIcon, BookmarkedIcon, PlusCircleIcon } from "../icons";
import NewListModal from "../../views/lists/components/new-list-modal";
import useEventBookmarkActions from "../../hooks/use-event-bookmark-actions";
import { usePublishEvent } from "../../providers/global/publish-provider";

export default function BookmarkButton({ event, ...props }: { event: NostrEvent } & Omit<IconButtonProps, "icon">) {
  const publish = usePublishEvent();
  const newListModal = useDisclosure();
  const account = useCurrentAccount();
  const [isLoading, setLoading] = useState(false);

  const { isLoading: loadingBookmark, toggleBookmark, isBookmarked } = useEventBookmarkActions(event);
  const lists = useUserLists(account?.pubkey).filter((list) => list.kind === NOTE_LIST_KIND);

  const inLists = lists.filter((list) => getEventPointersFromList(list).some((p) => p.id === event.id));

  const handleChange = useCallback(
    async (cords: string | string[]) => {
      if (!Array.isArray(cords)) return;

      setLoading(true);
      const addToList = lists.find((list) => !inLists.includes(list) && cords.includes(getEventCoordinate(list)));
      const removeFromList = lists.find((list) => inLists.includes(list) && !cords.includes(getEventCoordinate(list)));

      if (addToList) {
        const draft = listAddEvent(addToList, event.id);
        await publish("Add to list", draft);
      } else if (removeFromList) {
        const draft = listRemoveEvent(removeFromList, event.id);
        await publish("Remove from list", draft);
      }
      setLoading(false);
    },
    [lists, event.id, publish],
  );

  return (
    <>
      <Menu isLazy closeOnSelect={false}>
        <MenuButton
          as={IconButton}
          icon={inLists.length > 0 || isBookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
          isDisabled={account?.readonly ?? true}
          {...props}
        />
        <MenuList minWidth="240px">
          <MenuItem
            icon={isBookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
            isDisabled={account?.readonly || loadingBookmark}
            onClick={toggleBookmark}
          >
            Bookmark
          </MenuItem>
          <MenuDivider />
          {lists.length > 0 && (
            <MenuOptionGroup
              type="checkbox"
              value={inLists.map((list) => getEventCoordinate(list))}
              onChange={handleChange}
            >
              {lists.map((list) => (
                <MenuItemOption
                  key={getEventCoordinate(list)}
                  value={getEventCoordinate(list)}
                  isDisabled={account?.readonly || isLoading}
                  isTruncated
                  maxW="90vw"
                >
                  {getListName(list)}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          )}
          <MenuDivider />
          <MenuItem icon={<PlusCircleIcon />} onClick={newListModal.onOpen}>
            New list
          </MenuItem>
        </MenuList>
      </Menu>
      {newListModal.isOpen && (
        <NewListModal
          onClose={newListModal.onClose}
          isOpen
          onCreated={newListModal.onClose}
          initKind={NOTE_LIST_KIND}
          allowSelectKind={false}
        />
      )}
    </>
  );
}
