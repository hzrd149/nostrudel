import { Button, Flex, Heading, SimpleGrid, Spacer, useDisclosure } from "@chakra-ui/react";
import { useNavigate, Link as RouterLink, Navigate } from "react-router-dom";
import { getEventUID } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import useCurrentAccount from "../../hooks/use-current-account";
import ListCard from "./components/list-card";
import useUserSets from "../../hooks/use-user-lists";
import NewSetModal from "./components/new-set-modal";
import useFavoriteLists from "../../hooks/use-favorite-lists";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { getSharableEventAddress } from "../../services/relay-hints";
import Plus from "../../components/icons/plus";

function ListsHomePage() {
  const account = useCurrentAccount()!;
  const sets = useUserSets(account.pubkey, undefined, true);
  const { lists: favoriteLists } = useFavoriteLists();
  const newList = useDisclosure();
  const navigate = useNavigate();

  const followSets = sets.filter((event) => event.kind === kinds.Followsets);
  const genericSets = sets.filter((event) => event.kind === kinds.Genericlists);
  const bookmarkSets = sets.filter((event) => event.kind === kinds.Bookmarksets);

  const columns = { base: 1, lg: 2, xl: 3, "2xl": 4 };

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Button as={RouterLink} to="/lists/browse">
          Browse Lists
        </Button>
        <Spacer />
        <Button leftIcon={<Plus boxSize={5} />} onClick={newList.onOpen} colorScheme="primary">
          New List
        </Button>
      </Flex>

      <Heading size="lg" mt="2">
        Special lists
      </Heading>
      <SimpleGrid columns={columns} spacing="2">
        <ListCard cord={`${kinds.Contacts}:${account.pubkey}`} hideCreator />
        <ListCard cord={`${kinds.Mutelist}:${account.pubkey}`} hideCreator />
        <ListCard cord={`${kinds.Pinlist}:${account.pubkey}`} hideCreator />
        <ListCard cord={`${kinds.CommunitiesList}:${account.pubkey}`} hideCreator />
        <ListCard cord={`${kinds.BookmarkList}:${account.pubkey}`} hideCreator />
      </SimpleGrid>
      {followSets.length > 0 && (
        <>
          <Heading size="lg" mt="2">
            People lists
          </Heading>
          <SimpleGrid columns={columns} spacing="2">
            {followSets.map((event) => (
              <ListCard key={getEventUID(event)} list={event} hideCreator />
            ))}
          </SimpleGrid>
        </>
      )}
      {genericSets.length > 0 && (
        <>
          <Heading size="lg" mt="2">
            Generic lists
          </Heading>
          <SimpleGrid columns={columns} spacing="2">
            {genericSets.map((event) => (
              <ListCard key={getEventUID(event)} list={event} hideCreator />
            ))}
          </SimpleGrid>
        </>
      )}
      {bookmarkSets.length > 0 && (
        <>
          <Heading size="lg" mt="2">
            Bookmark lists
          </Heading>
          <SimpleGrid columns={columns} spacing="2">
            {bookmarkSets.map((event) => (
              <ListCard key={getEventUID(event)} list={event} hideCreator />
            ))}
          </SimpleGrid>
        </>
      )}
      {favoriteLists.length > 0 && (
        <>
          <Heading size="lg" mt="2">
            Favorite lists
          </Heading>
          <SimpleGrid columns={columns} spacing="2">
            {favoriteLists.map((event) => (
              <ListCard key={getEventUID(event)} list={event} />
            ))}
          </SimpleGrid>
        </>
      )}

      {newList.isOpen && (
        <NewSetModal
          isOpen
          onClose={newList.onClose}
          onCreated={(list) => navigate(`/lists/${getSharableEventAddress(list)}`)}
        />
      )}
    </VerticalPageLayout>
  );
}

export default function ListsHomeView() {
  const account = useCurrentAccount();
  return account ? <ListsHomePage /> : <Navigate to="/lists/browse" />;
}
