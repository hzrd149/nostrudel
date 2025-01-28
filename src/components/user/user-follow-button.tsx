import { useCallback, useState } from "react";
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
import { useActiveAccount } from "applesauce-react/hooks";

import { ChevronDownIcon, FollowIcon, MuteIcon, PlusCircleIcon, UnfollowIcon, UnmuteIcon } from "../icons";
import useUserSets from "../../hooks/use-user-lists";
import {
  createEmptyContactList,
  listAddPerson,
  listRemovePerson,
  getListName,
  getPubkeysFromList,
} from "../../helpers/nostr/lists";
import { getEventCoordinate } from "../../helpers/nostr/event";
import { useSigningContext } from "../../providers/global/signing-provider";
import useUserContactList from "../../hooks/use-user-contact-list";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";
import NewSetModal from "../../views/lists/components/new-set-modal";
import useUserMuteActions from "../../hooks/use-user-mute-actions";
import { useMuteModalContext } from "../../providers/route/mute-modal-provider";
import { usePublishEvent } from "../../providers/global/publish-provider";

function UsersLists({ pubkey }: { pubkey: string }) {
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const { requestSignature } = useSigningContext();
  const [isLoading, setLoading] = useState(false);
  const newListModal = useDisclosure();

  const lists = useUserSets(account.pubkey).filter((list) => list.kind === kinds.Followsets);

  const inLists = lists.filter((list) => getPubkeysFromList(list).some((p) => p.pubkey === pubkey));

  const handleChange = useCallback(
    async (cords: string | string[]) => {
      if (!Array.isArray(cords)) return;
      setLoading(true);

      const addToList = lists.find((list) => !inLists.includes(list) && cords.includes(getEventCoordinate(list)));
      const removeFromList = lists.find((list) => inLists.includes(list) && !cords.includes(getEventCoordinate(list)));

      if (addToList) {
        const draft = listAddPerson(addToList, pubkey);
        const signed = await requestSignature(draft);
        await publish("Add to list", signed);
      } else if (removeFromList) {
        const draft = listRemovePerson(removeFromList, pubkey);
        const signed = await requestSignature(draft);
        await publish("Remove from list", signed);
      }
      setLoading(false);
    },
    [lists, publish, setLoading],
  );

  return (
    <>
      {lists.length > 0 && (
        <MenuOptionGroup
          title="Lists"
          type="checkbox"
          value={inLists.map((list) => getEventCoordinate(list))}
          onChange={handleChange}
        >
          {lists.map((list) => (
            <MenuItemOption key={getEventCoordinate(list)} value={getEventCoordinate(list)} isTruncated maxW="90vw">
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
  const { requestSignature } = useSigningContext();
  const contacts = useUserContactList(account?.pubkey, undefined, true);
  const { isMuted, unmute } = useUserMuteActions(pubkey);
  const { openModal } = useMuteModalContext();

  const isFollowing = !!contacts && isProfilePointerInList(contacts, pubkey);

  const [loading, setLoading] = useState(false);
  const handleFollow = useAsyncErrorHandler(async () => {
    setLoading(true);
    const draft = listAddPerson(contacts || createEmptyContactList(), pubkey);
    const signed = await requestSignature(draft);
    await publish("Follow", signed);
    setLoading(false);
  }, [contacts, requestSignature, pubkey, publish]);
  const handleUnfollow = useAsyncErrorHandler(async () => {
    setLoading(true);
    const draft = listRemovePerson(contacts || createEmptyContactList(), pubkey);
    const signed = await requestSignature(draft);
    await publish("Unfollow", signed);
    setLoading(false);
  }, [contacts, requestSignature, pubkey, publish]);

  if (showLists) {
    return (
      <Menu closeOnSelect={false}>
        <MenuButton as={Button} colorScheme="primary" {...props} rightIcon={<ChevronDownIcon />}>
          {isFollowing ? "Unfollow" : "Follow"}
        </MenuButton>
        <MenuList>
          {isFollowing ? (
            <MenuItem onClick={handleUnfollow} icon={<UnfollowIcon />} isDisabled={loading}>
              Unfollow
            </MenuItem>
          ) : (
            <MenuItem onClick={handleFollow} icon={<FollowIcon />} isDisabled={loading}>
              Follow
            </MenuItem>
          )}
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
      <Button onClick={handleUnfollow} colorScheme="primary" icon={<UnfollowIcon />} isLoading={loading} {...props}>
        Unfollow
      </Button>
    );
  } else {
    return (
      <Button onClick={handleFollow} colorScheme="primary" icon={<FollowIcon />} isLoading={loading} {...props}>
        Follow
      </Button>
    );
  }
}
