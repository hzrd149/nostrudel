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
} from "@chakra-ui/react";
import { useCurrentAccount } from "../hooks/use-current-account";
import useSubject from "../hooks/use-subject";
import clientFollowingService from "../services/client-following";
import { useUserContacts } from "../hooks/use-user-contacts";
import "../services/lists";
import { ArrowDownSIcon, FollowIcon, PlusCircleIcon, TrashIcon, UnfollowIcon } from "./icons";
import useUserLists from "../hooks/use-user-lists";
import { useReadRelayUrls } from "../hooks/use-client-relays";
import { useAdditionalRelayContext } from "../providers/additional-relay-context";

function UsersLists() {
  const account = useCurrentAccount()!;

  const readRelays = useReadRelayUrls(useAdditionalRelayContext());
  const lists = useUserLists(account.pubkey, readRelays);

  return (
    <>
      {Array.from(Object.entries(lists)).map(([name, list]) => (
        <MenuItem isDisabled={account.readonly} isTruncated maxW="90vw">
          {name}
        </MenuItem>
      ))}
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
    <Menu>
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
            <MenuItem icon={<TrashIcon />} isDisabled={account.readonly}>
              Remove from all
            </MenuItem>
            <MenuDivider />
            <UsersLists />
            <MenuDivider />
            <MenuItem icon={<PlusCircleIcon />} isDisabled={account.readonly}>
              New list
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
};
