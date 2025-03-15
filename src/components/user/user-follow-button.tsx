import {
  Button,
  ButtonProps,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuOptionGroup,
  MenuDivider,
  useDisclosure,
} from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { isProfilePointerInList } from "applesauce-core/helpers/lists";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { FollowUser, UnfollowUser, AddUserToFollowSet, RemoveUserFromFollowSet } from "applesauce-actions/actions";
import { getEventUID, getReplaceableIdentifier } from "applesauce-core/helpers";

import { ChevronDownIcon, FollowIcon, MuteIcon, PlusCircleIcon, UnfollowIcon, UnmuteIcon } from "../icons";
import useUserSets from "../../hooks/use-user-lists";
import { getListName } from "../../helpers/nostr/lists";
import { getEventCoordinate } from "../../helpers/nostr/event";
import useUserContactList from "../../hooks/use-user-contact-list";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";
import NewSetModal from "../../views/lists/components/new-set-modal";
import useUserMuteActions from "../../hooks/use-user-mute-actions";
import { useMuteModalContext } from "../../providers/route/mute-modal-provider";
import { usePublishEvent } from "../../providers/global/publish-provider";

function UsersLists({ pubkey }: { pubkey: string }) {
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const newListModal = useDisclosure();
  const actions = useActionHub();

  const lists = useUserSets(account.pubkey).filter((list) => list.kind === kinds.Followsets);

  const inLists = lists.filter((list) => isProfilePointerInList(list, { pubkey }));

  const handleChange = useAsyncErrorHandler(
    async (cords: string | string[]) => {
      if (!Array.isArray(cords)) return;

      const addToList = lists.find((list) => !inLists.includes(list) && cords.includes(getEventCoordinate(list)));
      const removeFromList = lists.find((list) => inLists.includes(list) && !cords.includes(getEventCoordinate(list)));

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
          value={inLists.map((list) => getEventCoordinate(list))}
          onChange={handleChange.run}
        >
          {lists.map((list) => (
            <MenuItemOption key={getEventUID(list)} value={getEventCoordinate(list)} isTruncated maxW="90vw">
              {getListName(list)}
            </MenuItemOption>
          ))}
        </MenuOptionGroup>
      )}
      <MenuDivider />
      <MenuItem icon={<PlusCircleIcon />} onClick={newListModal.onOpen}>
        New list
      </MenuItem>

      {newListModal.isOpen && <NewSetModal onClose={newListModal.onClose} isOpen onCreated={newListModal.onClose} />}
    </>
  );
}

export type UserFollowButtonProps = { pubkey: string; showLists?: boolean } & Omit<
  ButtonProps,
  "onClick" | "isLoading" | "isDisabled"
>;

export function UserFollowButton({ pubkey, showLists, ...props }: UserFollowButtonProps) {
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const contacts = useUserContactList(account?.pubkey, undefined, true);
  const { isMuted, unmute } = useUserMuteActions(pubkey);
  const { openModal } = useMuteModalContext();
  const actions = useActionHub();

  const isFollowing = !!contacts && isProfilePointerInList(contacts, pubkey);

  const toggleFollow = useAsyncErrorHandler(async () => {
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
