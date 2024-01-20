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

import useCurrentAccount from "../../../hooks/use-current-account";
import { useSigningContext } from "../../../providers/global/signing-provider";
import useUserLists from "../../../hooks/use-user-lists";
import {
  NOTE_LIST_KIND,
  listAddEvent,
  listRemoveEvent,
  getEventPointersFromList,
  getListName,
} from "../../../helpers/nostr/lists";
import { NostrEvent } from "../../../types/nostr-event";
import { getEventCoordinate } from "../../../helpers/nostr/events";
import clientRelaysService from "../../../services/client-relays";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { BookmarkIcon, BookmarkedIcon, PlusCircleIcon } from "../../icons";
import NewListModal from "../../../views/lists/components/new-list-modal";
import replaceableEventLoaderService from "../../../services/replaceable-event-requester";
import useEventBookmarkActions from "../../../hooks/use-event-bookmark-actions";

export default function BookmarkButton({ event, ...props }: { event: NostrEvent } & Omit<IconButtonProps, "icon">) {
  const toast = useToast();
  const newListModal = useDisclosure();
  const account = useCurrentAccount();
  const { requestSignature } = useSigningContext();
  const [isLoading, setLoading] = useState(false);

  const { isLoading: loadingBookmark, toggleBookmark, isBookmarked } = useEventBookmarkActions(event);
  const lists = useUserLists(account?.pubkey).filter((list) => list.kind === NOTE_LIST_KIND);

  const inLists = lists.filter((list) => getEventPointersFromList(list).some((p) => p.id === event.id));

  const handleChange = useCallback(
    async (cords: string | string[]) => {
      if (!Array.isArray(cords)) return;

      const writeRelays = clientRelaysService.outbox.urls;

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
