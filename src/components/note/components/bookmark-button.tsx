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
  useToast,
} from "@chakra-ui/react";
import dayjs from "dayjs";

import useCurrentAccount from "../../../hooks/use-current-account";
import { useSigningContext } from "../../../providers/signing-provider";
import useUserLists from "../../../hooks/use-user-lists";
import {
  NOTE_LIST_KIND,
  listAddEvent,
  listRemoveEvent,
  getEventsFromList,
  getListName,
  BOOKMARK_LIST_KIND,
} from "../../../helpers/nostr/lists";
import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import { getEventCoordinate } from "../../../helpers/nostr/events";
import clientRelaysService from "../../../services/client-relays";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { BookmarkIcon, BookmarkedIcon, PlusCircleIcon } from "../../icons";
import NewListModal from "../../../views/lists/components/new-list-modal";
import replaceableEventLoaderService from "../../../services/replaceable-event-requester";
import userUserBookmarksList from "../../../hooks/use-user-bookmarks-list";

export default function BookmarkButton({ event, ...props }: { event: NostrEvent } & Omit<IconButtonProps, "icon">) {
  const toast = useToast();
  const newListModal = useDisclosure();
  const account = useCurrentAccount();
  const { requestSignature } = useSigningContext();
  const [isLoading, setLoading] = useState(false);

  const { list: bookmarkList, pointers: bookmarkPointers } = userUserBookmarksList();
  const lists = useUserLists(account?.pubkey).filter((list) => list.kind === NOTE_LIST_KIND);

  const isBookmarked = bookmarkPointers.some((p) => p.id === event.id);
  const handleBookmarkClick = useCallback(async () => {
    const writeRelays = clientRelaysService.getWriteUrls();

    setLoading(true);
    try {
      let draft: DraftNostrEvent = {
        kind: BOOKMARK_LIST_KIND,
        content: bookmarkList?.content ?? "",
        tags: bookmarkList?.tags ?? [],
        created_at: dayjs().unix(),
      };

      if (isBookmarked) {
        draft = listRemoveEvent(draft, event.id);
        const signed = await requestSignature(draft);
        new NostrPublishAction("Remove Bookmark", writeRelays, signed);
      } else {
        draft = listAddEvent(draft, event.id);
        const signed = await requestSignature(draft);
        new NostrPublishAction("Bookmark Note", writeRelays, signed);
      }
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  }, [event.id, requestSignature, bookmarkList, isBookmarked]);

  const inLists = lists.filter((list) => getEventsFromList(list).some((p) => p.id === event.id));

  const handleChange = useCallback(
    async (cords: string | string[]) => {
      if (!Array.isArray(cords)) return;

      const writeRelays = clientRelaysService.getWriteUrls();

      setLoading(true);
      try {
        const addToList = lists.find((list) => !inLists.includes(list) && cords.includes(getEventCoordinate(list)));
        const removeFromList = lists.find(
          (list) => inLists.includes(list) && !cords.includes(getEventCoordinate(list)),
        );

        if (addToList) {
          const draft = listAddEvent(addToList, event.id);
          const signed = await requestSignature(draft);
          const pub = new NostrPublishAction("Add to list", writeRelays, signed);
          replaceableEventLoaderService.handleEvent(signed);
        } else if (removeFromList) {
          const draft = listRemoveEvent(removeFromList, event.id);
          const signed = await requestSignature(draft);
          const pub = new NostrPublishAction("Remove from list", writeRelays, signed);
          replaceableEventLoaderService.handleEvent(signed);
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setLoading(false);
    },
    [lists, event.id, requestSignature],
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
            isDisabled={account?.readonly || isLoading}
            onClick={handleBookmarkClick}
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
