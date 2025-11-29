import {
  Button,
  ButtonGroup,
  ButtonProps,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useCallback, useMemo, useState } from "react";
import { getProfilePointersFromList, getReplaceableAddress } from "applesauce-core/helpers";

import { NostrEvent } from "nostr-tools";
import { useAsync, useDebounce } from "react-use";
import { DEFAULT_ANON_PUBKEYS } from "../../const";
import { getDisplayName } from "../../helpers/nostr/profile";
import { getEventUID } from "../../helpers/nostr/event";
import { getListTitle } from "../../helpers/nostr/lists";
import useFavoriteLists from "../../hooks/use-favorite-lists";
import useUserContactList from "../../hooks/use-user-contact-list";
import useUserProfile from "../../hooks/use-user-profile";
import useUserSets from "../../hooks/use-user-sets";
import { usePeopleListContext } from "../../providers/local/people-list-provider";
import { lookupUsers } from "../../services/username-search";
import UserAvatar from "../user/user-avatar";
import UserName from "../user/user-name";

function ListCard({ list, ...props }: { list: NostrEvent } & Omit<ButtonProps, "children`">) {
  return (
    <Button justifyContent="flex-start" {...props}>
      {getListTitle(list)}
    </Button>
  );
}
function PersonCard({ pubkey, ...props }: { pubkey: string } & Omit<ButtonProps, "children`">) {
  return (
    <Button
      leftIcon={<UserAvatar pubkey={pubkey} size="sm" />}
      isTruncated
      justifyContent="flex-start"
      p="2"
      {...props}
    >
      <UserName pubkey={pubkey} />
    </Button>
  );
}

function AnonPerspectiveCard({
  pubkey,
  isSelected,
  ...props
}: { pubkey: string; isSelected: boolean } & Omit<ButtonProps, "children">) {
  const profile = useUserProfile(pubkey);
  const displayName = getDisplayName(profile, pubkey);

  return (
    <Button
      leftIcon={<UserAvatar pubkey={pubkey} size="sm" showNip05={false} />}
      isTruncated
      justifyContent="flex-start"
      p="2"
      colorScheme={isSelected ? "primary" : undefined}
      variant={isSelected ? "solid" : "outline"}
      {...props}
    >
      {displayName}
    </Button>
  );
}

export default function PeopleListSelection({
  hideGlobalOption = false,
  ...props
}: {
  hideGlobalOption?: boolean;
} & Omit<ButtonProps, "children">) {
  const modal = useDisclosure();
  const account = useActiveAccount();
  const lists = useUserSets(account?.pubkey)?.filter((list) => list.kind === kinds.Followsets) ?? [];
  const { lists: favoriteLists } = useFavoriteLists(account?.pubkey);
  const { selected, setSelected, listEvent } = usePeopleListContext();

  const contacts = useUserContactList(account?.pubkey);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    300,
    [search],
  );

  const { value: searchResults = [] } = useAsync(async () => {
    if (debouncedSearch.trim().length < 2) return [];

    const results = await lookupUsers(debouncedSearch.trim(), 10);
    const contactPubkeys = contacts ? getProfilePointersFromList(contacts).map((p) => p.pubkey) : [];
    // Filter to only show contacts
    return results.filter((r) => contactPubkeys.includes(r.pubkey));
  }, [debouncedSearch, contacts]);

  const selectList = useCallback(
    (list: NostrEvent) => {
      setSelected(getReplaceableAddress(list));
      modal.onClose();
    },
    [setSelected, modal.onClose],
  );
  const selectPerson = useCallback(
    (pubkey: string) => {
      setSelected(`3:${pubkey}`);
      modal.onClose();
      setSearch("");
    },
    [setSelected, modal.onClose, setSearch],
  );

  // Check if we're viewing an anon contact list (logged out and viewing a contact list)
  const isAnonList = !account && listEvent && listEvent.kind === kinds.Contacts;
  const anonPubkey = isAnonList ? listEvent.pubkey : undefined;
  const anonProfile = useUserProfile(anonPubkey);
  const anonDisplayName = useMemo(() => {
    if (!isAnonList || !anonPubkey) return null;
    return getDisplayName(anonProfile, anonPubkey);
  }, [isAnonList, anonPubkey, anonProfile]);

  return (
    <>
      <Button onClick={modal.onOpen} {...props}>
        {isAnonList && anonDisplayName
          ? `Viewing as ${anonDisplayName}`
          : isAnonList
            ? "Anon"
            : listEvent
              ? getListTitle(listEvent)
              : selected === "global"
                ? "Global"
                : "Loading..."}
      </Button>
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p="4">Select List</ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" pb="4" pt="0" display="flex" flexDirection="column" gap="2">
            {!account && isAnonList && DEFAULT_ANON_PUBKEYS.length > 0 && (
              <>
                <Heading size="md">Perspectives</Heading>
                <Text fontSize="sm" color="gray.500" mb="2">
                  {DEFAULT_ANON_PUBKEYS.length > 1
                    ? "View the app from different user perspectives"
                    : "Current perspective"}
                </Text>
                <SimpleGrid columns={2} spacing="2">
                  {DEFAULT_ANON_PUBKEYS.map((pubkey) => {
                    const contactListId = `${kinds.Contacts}:${pubkey}`;
                    const isSelected = selected === contactListId;
                    return (
                      <AnonPerspectiveCard
                        key={pubkey}
                        pubkey={pubkey}
                        isSelected={isSelected}
                        onClick={() => {
                          setSelected(contactListId);
                          modal.onClose();
                        }}
                      />
                    );
                  })}
                </SimpleGrid>
              </>
            )}
            <ButtonGroup>
              {account && (
                <Button
                  onClick={() => {
                    setSelected("following");
                    modal.onClose();
                  }}
                >
                  Following
                </Button>
              )}
              {!hideGlobalOption && (
                <Button
                  onClick={() => {
                    setSelected("global");
                    modal.onClose();
                  }}
                >
                  Global
                </Button>
              )}
            </ButtonGroup>
            <Heading mt="2" size="md">
              Lists
            </Heading>
            <SimpleGrid columns={2} spacing="2">
              {lists.map((list) => (
                <ListCard key={getEventUID(list)} list={list} onClick={() => selectList(list)} />
              ))}
            </SimpleGrid>
            {favoriteLists.length > 0 && (
              <>
                <Heading mt="2" size="md">
                  Favorites
                </Heading>
                <SimpleGrid columns={2} spacing="2">
                  {favoriteLists.map((list) => (
                    <ListCard key={getEventUID(list)} list={list} onClick={() => selectList(list)} />
                  ))}
                </SimpleGrid>
              </>
            )}
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Contacts"
            />
            {search.length > 2 && (
              <SimpleGrid columns={2} spacing="2">
                {searchResults.map((person) => (
                  <PersonCard key={person.pubkey} pubkey={person.pubkey} onClick={() => selectPerson(person.pubkey)} />
                ))}
              </SimpleGrid>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
