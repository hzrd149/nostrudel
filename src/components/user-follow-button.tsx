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
  useToast,
  useDisclosure,
} from "@chakra-ui/react";

import { useCurrentAccount } from "../hooks/use-current-account";
import { ArrowDownSIcon, FollowIcon, PlusCircleIcon, UnfollowIcon } from "./icons";
import useUserLists from "../hooks/use-user-lists";
import {
  PEOPLE_LIST_KIND,
  createEmptyContactList,
  draftAddPerson,
  draftRemovePerson,
  getListName,
  getPubkeysFromList,
  isPubkeyInList,
} from "../helpers/nostr/lists";
import { getEventCoordinate } from "../helpers/nostr/events";
import { useSigningContext } from "../providers/signing-provider";
import NostrPublishAction from "../classes/nostr-publish-action";
import clientRelaysService from "../services/client-relays";
import useUserContactList from "../hooks/use-user-contact-list";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import useAsyncErrorHandler from "../hooks/use-async-error-handler";
import NewListModal from "../views/lists/components/new-list-modal";

function UsersLists({ pubkey }: { pubkey: string }) {
  const toast = useToast();
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const [isLoading, setLoading] = useState(false);
  const newListModal = useDisclosure();

  const lists = useUserLists(account.pubkey).filter((list) => list.kind === PEOPLE_LIST_KIND);

  const inLists = lists.filter((list) => getPubkeysFromList(list).some((p) => p.pubkey === pubkey));

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
          const draft = draftAddPerson(addToList, pubkey);
          const signed = await requestSignature(draft);
          const pub = new NostrPublishAction("Add to list", writeRelays, signed);
        } else if (removeFromList) {
          const draft = draftRemovePerson(removeFromList, pubkey);
          const signed = await requestSignature(draft);
          const pub = new NostrPublishAction("Remove from list", writeRelays, signed);
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setLoading(false);
    },
    [lists],
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

export const UserFollowButton = ({ pubkey, showLists, ...props }: UserFollowButtonProps) => {
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const contacts = useUserContactList(account?.pubkey, [], true);

  const isFollowing = isPubkeyInList(contacts, pubkey);
  const isDisabled = account?.readonly ?? true;

  const handleFollow = useAsyncErrorHandler(async () => {
    const draft = draftAddPerson(contacts || createEmptyContactList(), pubkey);
    const signed = await requestSignature(draft);
    const pub = new NostrPublishAction("Follow", clientRelaysService.getWriteUrls(), signed);
    replaceableEventLoaderService.handleEvent(signed);
  });
  const handleUnfollow = useAsyncErrorHandler(async () => {
    const draft = draftRemovePerson(contacts || createEmptyContactList(), pubkey);
    const signed = await requestSignature(draft);
    const pub = new NostrPublishAction("Unfollow", clientRelaysService.getWriteUrls(), signed);
    replaceableEventLoaderService.handleEvent(signed);
  });

  if (showLists) {
    return (
      <Menu closeOnSelect={false}>
        <MenuButton as={Button} colorScheme="brand" {...props} rightIcon={<ArrowDownSIcon />} isDisabled={isDisabled}>
          {isFollowing ? "Unfollow" : "Follow"}
        </MenuButton>
        <MenuList>
          {isFollowing ? (
            <MenuItem onClick={handleUnfollow} icon={<UnfollowIcon />} isDisabled={isDisabled}>
              Unfollow
            </MenuItem>
          ) : (
            <MenuItem onClick={handleFollow} icon={<FollowIcon />} isDisabled={isDisabled}>
              Follow
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
      <Button onClick={handleUnfollow} colorScheme="brand" icon={<UnfollowIcon />} isDisabled={isDisabled} {...props}>
        Unfollow
      </Button>
    );
  } else {
    return (
      <Button onClick={handleFollow} colorScheme="brand" icon={<FollowIcon />} isDisabled={isDisabled} {...props}>
        Follow
      </Button>
    );
  }
};
