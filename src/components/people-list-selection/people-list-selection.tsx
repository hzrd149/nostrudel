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
  useDisclosure,
} from "@chakra-ui/react";
import { useActiveAccount, useObservableState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useCallback, useState } from "react";
import { getProfilePointersFromList, getReplaceableAddress } from "applesauce-core/helpers";

import { matchSorter } from "match-sorter";
import { NostrEvent } from "nostr-tools";
import { getEventUID } from "../../helpers/nostr/event";
import { getListTitle } from "../../helpers/nostr/lists";
import useFavoriteLists from "../../hooks/use-favorite-lists";
import useUserContactList from "../../hooks/use-user-contact-list";
import useUserSets from "../../hooks/use-user-lists";
import { usePeopleListContext } from "../../providers/local/people-list-provider";
import { userSearchDirectory } from "../../services/username-search";
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

  const searchDirectory = useObservableState(userSearchDirectory);
  const contacts = useUserContactList(account?.pubkey);
  const getSearchResults = useCallback(
    (search: string) => {
      const pubkeys = contacts ? getProfilePointersFromList(contacts).map((p) => p.pubkey) : [];
      const filteredByContacts = searchDirectory?.filter((p) => pubkeys.includes(p.pubkey)) ?? [];
      return matchSorter(filteredByContacts, search.trim(), { keys: ["names"] }).slice(0, 10);
    },
    [contacts, searchDirectory],
  );
  const [search, setSearch] = useState("");

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

  return (
    <>
      <Button onClick={modal.onOpen} {...props}>
        {listEvent ? getListTitle(listEvent) : selected === "global" ? "Global" : "Loading..."}
      </Button>
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p="4">Select List</ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" pb="4" pt="0" display="flex" flexDirection="column" gap="2">
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
                {getSearchResults(search).map((person) => (
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
