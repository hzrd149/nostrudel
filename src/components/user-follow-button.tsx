import { useCallback, useState } from "react";
import {
  Button,
  ButtonProps,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
  useToast,
} from "@chakra-ui/react";
import { useCurrentAccount } from "../hooks/use-current-account";
import useSubject from "../hooks/use-subject";
import clientFollowingService from "../services/client-following";
import { useUserContacts } from "../hooks/use-user-contacts";
import "../services/lists";
import { ArrowDownSIcon, FollowIcon, PlusCircleIcon, UnfollowIcon } from "./icons";
import useUserLists from "../hooks/use-user-lists";
import { useReadRelayUrls } from "../hooks/use-client-relays";
import { useAdditionalRelayContext } from "../providers/additional-relay-context";

function UsersLists({ pubkey }: { pubkey: string }) {
  const toast = useToast();
  const account = useCurrentAccount()!;
  const [isLoading, setLoading] = useState(false);

  const readRelays = useReadRelayUrls(useAdditionalRelayContext());
  const lists = useUserLists(account.pubkey, readRelays);

  const listsArray = Array.from(Object.values(lists));
  const inLists = listsArray.filter((list) => list.people.value.some((p) => p.pubkey === pubkey));

  const handleChange = useCallback(async (names: string | string[]) => {
    if (!Array.isArray(names)) return;

    setLoading(true);
    try {
      const addToList = listsArray.find((list) => !inLists.includes(list) && names.includes(list.name));
      const removeFromList = listsArray.find((list) => inLists.includes(list) && !names.includes(list.name));

      if (addToList) {
        const draft = addToList.draftAddPerson(pubkey);
        console.log(draft);
      } else if (removeFromList) {
        const draft = removeFromList.draftRemovePerson(pubkey);
        console.log(draft);
      }
    } catch (e) {
      if (e instanceof Error) {
        toast({ description: e.message });
      }
    }
    setLoading(false);
  }, []);

  return (
    <>
      {listsArray.length > 0 && (
        <MenuOptionGroup title="Lists" type="checkbox" value={inLists.map((l) => l.name)} onChange={handleChange}>
          {listsArray.map((list) => (
            <MenuItemOption
              key={list.event.id}
              value={list.name}
              isDisabled={account.readonly && isLoading}
              isTruncated
              maxW="90vw"
            >
              {list.name}
            </MenuItemOption>
          ))}
        </MenuOptionGroup>
      )}
    </>
  );
}

export const UserFollowButton = ({
  pubkey,
  ...props
}: { pubkey: string } & Omit<ButtonProps, "onClick" | "isLoading" | "isDisabled">) => {
  const account = useCurrentAccount();
  const following = useSubject(clientFollowingService.following) ?? [];

  const readRelays = useReadRelayUrls(useAdditionalRelayContext());
  const userContacts = useUserContacts(pubkey, readRelays);

  const isFollowing = following.some((t) => t[1] === pubkey);
  const isFollowingMe = account && userContacts?.contacts.includes(account.pubkey);

  const followLabel = account && isFollowingMe ? "Follow Back" : "Follow";

  return (
    <Menu closeOnSelect={false}>
      <MenuButton
        as={Button}
        colorScheme="brand"
        {...props}
        rightIcon={<ArrowDownSIcon />}
        isDisabled={account?.readonly ?? true}
      >
        {isFollowing ? "Unfollow" : followLabel}
      </MenuButton>
      <MenuList>
        {isFollowing ? (
          <MenuItem
            onClick={() => clientFollowingService.removeContact(pubkey)}
            icon={<UnfollowIcon />}
            isDisabled={account?.readonly}
          >
            Unfollow
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => clientFollowingService.addContact(pubkey)}
            icon={<FollowIcon />}
            isDisabled={account?.readonly}
          >
            {followLabel}
          </MenuItem>
        )}
        {account && (
          <>
            <MenuDivider />
            <UsersLists pubkey={pubkey} />
            {/* <MenuDivider />
            <MenuItem icon={<PlusCircleIcon />} isDisabled={account.readonly}>
              New list
            </MenuItem> */}
          </>
        )}
      </MenuList>
    </Menu>
  );
};
