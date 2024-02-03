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

import useCurrentAccount from "../hooks/use-current-account";
import { ChevronDownIcon, FollowIcon, MuteIcon, PlusCircleIcon, UnfollowIcon, UnmuteIcon } from "./icons";
import useUserLists from "../hooks/use-user-lists";
import {
  PEOPLE_LIST_KIND,
  createEmptyContactList,
  listAddPerson,
  listRemovePerson,
  getListName,
  getPubkeysFromList,
  isPubkeyInList,
} from "../helpers/nostr/lists";
import { getEventCoordinate } from "../helpers/nostr/events";
import { useSigningContext } from "../providers/global/signing-provider";
import useUserContactList from "../hooks/use-user-contact-list";
import useAsyncErrorHandler from "../hooks/use-async-error-handler";
import NewListModal from "../views/lists/components/new-list-modal";
import useUserMuteActions from "../hooks/use-user-mute-actions";
import { useMuteModalContext } from "../providers/route/mute-modal-provider";
import { usePublishEvent } from "../providers/global/publish-provider";

function UsersLists({ pubkey }: { pubkey: string }) {
  const publish = usePublishEvent();
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const [isLoading, setLoading] = useState(false);
  const newListModal = useDisclosure();

  const lists = useUserLists(account.pubkey).filter((list) => list.kind === PEOPLE_LIST_KIND);

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
            <MenuItemOption
              key={getEventCoordinate(list)}
              value={getEventCoordinate(list)}
              isDisabled={account.readonly && isLoading}
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

      {newListModal.isOpen && <NewListModal onClose={newListModal.onClose} isOpen onCreated={newListModal.onClose} />}
    </>
  );
}

export type UserFollowButtonProps = { pubkey: string; showLists?: boolean } & Omit<
  ButtonProps,
  "onClick" | "isLoading" | "isDisabled"
>;

export function UserFollowButton({ pubkey, showLists, ...props }: UserFollowButtonProps) {
  const publish = usePublishEvent();
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const contacts = useUserContactList(account?.pubkey, [], { ignoreCache: true });
  const { isMuted, unmute } = useUserMuteActions(pubkey);
  const { openModal } = useMuteModalContext();

  const isFollowing = isPubkeyInList(contacts, pubkey);
  const isDisabled = account?.readonly ?? true;

  const [loading, setLoading] = useState(false);
  const handleFollow = useAsyncErrorHandler(async () => {
    setLoading(true);
    const draft = listAddPerson(contacts || createEmptyContactList(), pubkey);
    const signed = await requestSignature(draft);
    await publish("Follow", signed);
    setLoading(false);
  }, [contacts, requestSignature]);
  const handleUnfollow = useAsyncErrorHandler(async () => {
    setLoading(true);
    const draft = listRemovePerson(contacts || createEmptyContactList(), pubkey);
    const signed = await requestSignature(draft);
    await publish("Unfollow", signed);
    setLoading(false);
  }, [contacts, requestSignature]);

  if (showLists) {
    return (
      <Menu closeOnSelect={false}>
        <MenuButton
          as={Button}
          colorScheme="primary"
          {...props}
          rightIcon={<ChevronDownIcon />}
          isDisabled={isDisabled}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </MenuButton>
        <MenuList>
          {isFollowing ? (
            <MenuItem onClick={handleUnfollow} icon={<UnfollowIcon />} isDisabled={isDisabled || loading}>
              Unfollow
            </MenuItem>
          ) : (
            <MenuItem onClick={handleFollow} icon={<FollowIcon />} isDisabled={isDisabled || loading}>
              Follow
            </MenuItem>
          )}
          {account?.pubkey !== pubkey && (
            <MenuItem
              onClick={isMuted ? unmute : () => openModal(pubkey)}
              icon={isMuted ? <UnmuteIcon /> : <MuteIcon />}
              color="red.500"
              isDisabled={isDisabled}
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
        onClick={handleUnfollow}
        colorScheme="primary"
        icon={<UnfollowIcon />}
        isDisabled={isDisabled}
        isLoading={loading}
        {...props}
      >
        Unfollow
      </Button>
    );
  } else {
    return (
      <Button
        onClick={handleFollow}
        colorScheme="primary"
        icon={<FollowIcon />}
        isDisabled={isDisabled}
        isLoading={loading}
        {...props}
      >
        Follow
      </Button>
    );
  }
}
