import { Button, Divider, Flex, Heading, Image, Link, SimpleGrid, Spacer, useDisclosure } from "@chakra-ui/react";
import { useNavigate, Link as RouterLink, Navigate } from "react-router-dom";
import { Kind } from "nostr-tools";

import { useCurrentAccount } from "../../hooks/use-current-account";
import { ExternalLinkIcon, PlusCircleIcon } from "../../components/icons";
import ListCard from "./components/list-card";
import { getEventUID } from "../../helpers/nostr/events";
import useUserLists from "../../hooks/use-user-lists";
import NewListModal from "./components/new-list-modal";
import { getSharableEventAddress } from "../../helpers/nip19";
import { MUTE_LIST_KIND, NOTE_LIST_KIND, PEOPLE_LIST_KIND, PIN_LIST_KIND } from "../../helpers/nostr/lists";
import useFavoriteLists from "../../hooks/use-favorite-lists";
import VerticalPageLayout from "../../components/vertical-page-layout";

function ListsPage() {
  const account = useCurrentAccount()!;
  const lists = useUserLists(account.pubkey);
  const { lists: favoriteLists } = useFavoriteLists();
  const newList = useDisclosure();
  const navigate = useNavigate();

  const peopleLists = lists.filter((event) => event.kind === PEOPLE_LIST_KIND);
  const noteLists = lists.filter((event) => event.kind === NOTE_LIST_KIND);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Button as={RouterLink} to="/lists/browse">
          Browse Lists
        </Button>
        <Spacer />
        <Button
          as={Link}
          href="https://listr.lol/"
          isExternal
          rightIcon={<ExternalLinkIcon />}
          leftIcon={<Image src="https://listr.lol/favicon.ico" w="1.2em" />}
        >
          Listr
        </Button>
        <Button leftIcon={<PlusCircleIcon />} onClick={newList.onOpen} colorScheme="brand">
          New List
        </Button>
      </Flex>

      <Heading size="md">Special lists</Heading>
      <Divider />
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
        <ListCard cord={`${Kind.Contacts}:${account.pubkey}`} />
        <ListCard cord={`${MUTE_LIST_KIND}:${account.pubkey}`} />
        <ListCard cord={`${PIN_LIST_KIND}:${account.pubkey}`} />
      </SimpleGrid>
      {peopleLists.length > 0 && (
        <>
          <Heading size="md">People lists</Heading>
          <Divider />
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
            {peopleLists.map((event) => (
              <ListCard key={getEventUID(event)} list={event} />
            ))}
          </SimpleGrid>
        </>
      )}
      {noteLists.length > 0 && (
        <>
          <Heading size="md">Bookmark lists</Heading>
          <Divider />
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
            {noteLists.map((event) => (
              <ListCard key={getEventUID(event)} list={event} />
            ))}
          </SimpleGrid>
        </>
      )}
      {favoriteLists.length > 0 && (
        <>
          <Heading size="md">Favorite lists</Heading>
          <Divider />
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
            {favoriteLists.map((event) => (
              <ListCard key={getEventUID(event)} list={event} />
            ))}
          </SimpleGrid>
        </>
      )}

      {newList.isOpen && (
        <NewListModal
          isOpen
          onClose={newList.onClose}
          onCreated={(list) => navigate(`/lists/${getSharableEventAddress(list)}`)}
        />
      )}
    </VerticalPageLayout>
  );
}

export default function ListsView() {
  const account = useCurrentAccount();
  return account ? <ListsPage /> : <Navigate to="/lists/browse" />;
}
