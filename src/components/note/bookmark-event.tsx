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
import { kinds } from "nostr-tools";
import { getEventPointersFromList } from "applesauce-lists/helpers";

import useCurrentAccount from "../../hooks/use-current-account";
import useUserSets from "../../hooks/use-user-lists";
import { listAddEvent, listRemoveEvent, getListName } from "../../helpers/nostr/lists";
import { NostrEvent } from "../../types/nostr-event";
import { getEventCoordinate } from "../../helpers/nostr/event";
import { BookmarkIcon, BookmarkedIcon, PlusCircleIcon } from "../icons";
import NewSetModal from "../../views/lists/components/new-set-modal";
import useEventBookmarkActions from "../../hooks/use-event-bookmark-actions";
import { usePublishEvent } from "../../providers/global/publish-provider";

export default function BookmarkEventButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon">) {
  const publish = usePublishEvent();
  const newSetModal = useDisclosure();
  const account = useCurrentAccount();
  const [isLoading, setLoading] = useState(false);

  const { isLoading: loadingBookmark, toggleBookmark, isBookmarked } = useEventBookmarkActions(event);
  const bookmarkSets = useUserSets(account?.pubkey).filter(
    (set) => set.kind === kinds.Genericlists || set.kind === kinds.Bookmarksets,
  );

  const inSets = bookmarkSets.filter((list) => getEventPointersFromList(list).some((p) => p.id === event.id));

  const handleChange = useCallback(
    async (cords: string | string[]) => {
      if (!Array.isArray(cords)) return;

      setLoading(true);
      const addToSet = bookmarkSets.find((set) => !inSets.includes(set) && cords.includes(getEventCoordinate(set)));
      const removeFromSet = bookmarkSets.find(
        (set) => inSets.includes(set) && !cords.includes(getEventCoordinate(set)),
      );

      if (addToSet) {
        const draft = listAddEvent(addToSet, event);
        await publish("Add to list", draft);
      } else if (removeFromSet) {
        const draft = listRemoveEvent(removeFromSet, event);
        await publish("Remove from list", draft);
      }
      setLoading(false);
    },
    [bookmarkSets, event.id, publish],
  );

  return (
    <>
      <Menu isLazy closeOnSelect={false}>
        <MenuButton
          as={IconButton}
          icon={inSets.length > 0 || isBookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
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
          {bookmarkSets.length > 0 && (
            <MenuOptionGroup
              type="checkbox"
              value={inSets.map((set) => getEventCoordinate(set))}
              onChange={handleChange}
            >
              {bookmarkSets.map((set) => (
                <MenuItemOption
                  key={getEventCoordinate(set)}
                  value={getEventCoordinate(set)}
                  isDisabled={account?.readonly || isLoading}
                  isTruncated
                  maxW="90vw"
                >
                  {getListName(set)}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          )}
          <MenuDivider />
          <MenuItem icon={<PlusCircleIcon />} onClick={newSetModal.onOpen}>
            New list
          </MenuItem>
        </MenuList>
      </Menu>
      {newSetModal.isOpen && (
        <NewSetModal
          onClose={newSetModal.onClose}
          isOpen
          onCreated={newSetModal.onClose}
          initKind={kinds.Bookmarksets}
          allowSelectKind={false}
        />
      )}
    </>
  );
}
