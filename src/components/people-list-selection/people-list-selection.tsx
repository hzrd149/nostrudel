import {
  Button,
  ButtonProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
} from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import { usePeopleListContext } from "../../providers/people-list-provider";
import useUserLists from "../../hooks/use-user-lists";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { PEOPLE_LIST_KIND, getListName } from "../../helpers/nostr/lists";
import { getEventCoordinate } from "../../helpers/nostr/events";
import useFavoriteLists from "../../hooks/use-favorite-lists";

export default function PeopleListSelection({
  hideGlobalOption = false,
  ...props
}: {
  hideGlobalOption?: boolean;
} & Omit<ButtonProps, "children">) {
  const account = useCurrentAccount();
  const lists = useUserLists(account?.pubkey);
  const { lists: favoriteLists } = useFavoriteLists();
  const { list, setList, listEvent } = usePeopleListContext();

  const handleSelect = (value: string | string[]) => {
    if (typeof value === "string") {
      setList(value);
    }
  };

  return (
    <Menu>
      <MenuButton as={Button} {...props}>
        {listEvent ? getListName(listEvent) : list === "global" ? "Global" : "Loading..."}
      </MenuButton>
      <MenuList zIndex={100}>
        <MenuOptionGroup value={list} onChange={handleSelect} type="radio">
          {account && <MenuItemOption value={`${Kind.Contacts}:${account.pubkey}`}>Following</MenuItemOption>}
          {!hideGlobalOption && <MenuItemOption value="global">Global</MenuItemOption>}
          {lists.length > 0 && <MenuDivider />}
          {lists
            .filter((l) => l.kind === PEOPLE_LIST_KIND)
            .map((list) => (
              <MenuItemOption key={getEventCoordinate(list)} value={getEventCoordinate(list)} isTruncated maxW="90vw">
                {getListName(list)}
              </MenuItemOption>
            ))}
        </MenuOptionGroup>
        {favoriteLists.length > 0 && (
          <>
            <MenuDivider />
            <MenuOptionGroup value={list} onChange={handleSelect} type="radio" title="Favorites">
              {favoriteLists
                .filter((l) => l.kind === PEOPLE_LIST_KIND)
                .map((list) => (
                  <MenuItemOption
                    key={getEventCoordinate(list)}
                    value={getEventCoordinate(list)}
                    isTruncated
                    maxW="90vw"
                  >
                    {getListName(list)}
                  </MenuItemOption>
                ))}
            </MenuOptionGroup>
          </>
        )}
      </MenuList>
    </Menu>
  );
}
