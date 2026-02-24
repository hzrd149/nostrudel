import {
  Button,
  ButtonProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  useDisclosure,
} from "@chakra-ui/react";
import { AddUserToFollowSet, FollowUser, RemoveUserFromFollowSet, UnfollowUser } from "applesauce-actions/actions";
import { getEventUID, getReplaceableAddress, getReplaceableIdentifier } from "applesauce-core/helpers";
import { isProfilePointerInList } from "applesauce-common/helpers/lists";
import { useActionRunner, useActiveAccount } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";

import { getListTitle } from "../../helpers/nostr/lists";
import useAsyncAction from "../../hooks/use-async-action";
import useUserContactList from "../../hooks/use-user-contact-list";
import useUserSets from "../../hooks/use-user-sets";
import useUserMuteActions from "../../hooks/use-user-mute-actions";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { useMuteModalContext } from "../../providers/route/mute-modal-provider";
import NewBookmarkSetModal from "../../views/lists/components/new-set-modal";
import { ChevronDownIcon, FollowIcon, MuteIcon, PlusCircleIcon, UnfollowIcon, UnmuteIcon } from "../icons";

function UsersLists({ pubkey }: { pubkey: string }) {
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const newListModal = useDisclosure();
  const actions = useActionRunner();

  const lists = useUserSets(account.pubkey)?.filter((list) => list.kind === kinds.Followsets) ?? [];

  const inLists = lists.filter((list) => isProfilePointerInList(list, { pubkey }));

  const handleChange = useAsyncAction(
    async (cords: string | string[]) => {
      if (!Array.isArray(cords)) return;

      const addToList = lists.find((list) => {
        const addr = getReplaceableAddress(list);
        return addr && !inLists.includes(list) && cords.includes(addr); // v5: can be null
      });
      const removeFromList = lists.find((list) => {
        const addr = getReplaceableAddress(list);
        return addr && inLists.includes(list) && !cords.includes(addr); // v5: can be null
      });

      if (addToList) {
        await actions
          .exec(AddUserToFollowSet, pubkey, getReplaceableIdentifier(addToList))
          .forEach((e) => publish("Add to list", e));
      } else if (removeFromList) {
        await actions
          .exec(RemoveUserFromFollowSet, pubkey, getReplaceableIdentifier(removeFromList))
          .forEach((e) => publish("Remove from list", e));
      }
    },
    [lists, publish],
  );

  return (
    <>
      {lists.length > 0 && (
        <MenuOptionGroup
          title="Lists"
          type="checkbox"
          value={inLists.map((list) => getReplaceableAddress(list)).filter((addr): addr is string => addr !== null)} // v5: filter nulls
          onChange={handleChange.run}
        >
          {lists.map((list) => {
            const addr = getReplaceableAddress(list);
            if (!addr) return null; // v5: can be null
            return (
              <MenuItemOption key={getEventUID(list)} value={addr} isTruncated maxW="90vw">
                {getListTitle(list)}
              </MenuItemOption>
            );
          })}
        </MenuOptionGroup>
      )}
      <MenuDivider />
      <MenuItem icon={<PlusCircleIcon />} onClick={newListModal.onOpen}>
        New list
      </MenuItem>

      {newListModal.isOpen && (
        <NewBookmarkSetModal onClose={newListModal.onClose} isOpen onCreated={newListModal.onClose} />
      )}
    </>
  );
}

export type UserFollowButtonProps = { pubkey: string; showLists?: boolean } & Omit<
  ButtonProps,
  "onClick" | "isLoading" | "isDisabled"
>;

export function SimpleUserFollowButton({ pubkey, ...props }: UserFollowButtonProps) {
  const account = useActiveAccount()!;
  const contacts = useUserContactList(account?.pubkey);
  const actions = useActionRunner();
  const publish = usePublishEvent();

  const isFollowing = !!contacts && isProfilePointerInList(contacts, pubkey);
  const toggleFollow = useAsyncAction(async () => {
    if (isFollowing) {
      await actions.exec(UnfollowUser, pubkey).forEach((e) => publish("Unfollow user", e));
    } else {
      await actions.exec(FollowUser, pubkey).forEach((e) => publish("Follow user", e));
    }
  }, [actions, isFollowing, pubkey]);

  return (
    <Button
      as={Button}
      colorScheme={isFollowing ? "gray" : "primary"}
      {...props}
      onClick={toggleFollow.run}
      isLoading={toggleFollow.loading}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}

export function UserFollowButton({ pubkey, showLists, ...props }: UserFollowButtonProps) {
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const contacts = useUserContactList(account?.pubkey);
  const { isMuted, unmute } = useUserMuteActions(pubkey);
  const { openModal } = useMuteModalContext();
  const actions = useActionRunner();

  const isFollowing = !!contacts && isProfilePointerInList(contacts, pubkey);

  const toggleFollow = useAsyncAction(async () => {
    if (isFollowing) {
      await actions.exec(UnfollowUser, pubkey).forEach((e) => publish("Unfollow user", e));
    } else {
      await actions.exec(FollowUser, pubkey).forEach((e) => publish("Follow user", e));
    }
  }, [actions, isFollowing, pubkey]);

  if (showLists) {
    return (
      <Menu closeOnSelect={false}>
        <MenuButton as={Button} colorScheme="primary" {...props} rightIcon={<ChevronDownIcon />}>
          {isFollowing ? "Unfollow" : "Follow"}
        </MenuButton>
        <MenuList>
          <MenuItem
            onClick={toggleFollow.run}
            icon={isFollowing ? <UnfollowIcon /> : <FollowIcon />}
            isDisabled={toggleFollow.loading}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </MenuItem>
          {account?.pubkey !== pubkey && (
            <MenuItem
              onClick={isMuted ? unmute : () => openModal(pubkey)}
              icon={isMuted ? <UnmuteIcon /> : <MuteIcon />}
              color="red.500"
            >
              {isMuted ? "Unmute" : "Mute"}
            </MenuItem>
          )}
          {account && (
            <>
              <MenuDivider />
              <UsersLists pubkey={pubkey} />
            </>
          )}
        </MenuList>
      </Menu>
    );
  } else if (isFollowing) {
    return (
      <Button
        onClick={toggleFollow.run}
        colorScheme="primary"
        icon={<UnfollowIcon />}
        isLoading={toggleFollow.loading}
        {...props}
      >
        Unfollow
      </Button>
    );
  } else {
    return (
      <Button
        onClick={toggleFollow.run}
        colorScheme="primary"
        icon={<FollowIcon />}
        isLoading={toggleFollow.loading}
        {...props}
      >
        Follow
      </Button>
    );
  }
}
