import { Button, Flex, Heading, SimpleGrid, Spacer, useDisclosure } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useActiveAccount } from "applesauce-react/hooks";
import Plus from "../../components/icons/plus";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useFavoriteLists from "../../hooks/use-favorite-lists";
import useUserSets from "../../hooks/use-user-lists";
import { getSharableEventAddress } from "../../services/relay-hints";
import ListCard from "./components/list-card";
import NewSetModal from "./components/new-set-modal";
import SimpleView from "../../components/layout/presets/simple-view";
import ListTypeCard from "./components/list-type-card";
import Users01 from "../../components/icons/users-01";
import useUserContacts from "../../hooks/use-user-contacts";
import useUserMutes from "../../hooks/use-user-mutes";
import { MuteIcon } from "../../components/icons";
import RequireActiveAccount from "../../components/router/require-active-account";
import PeopleListCard from "./components/people-list-card";

function ListHomePage() {
  const account = useActiveAccount()!;
  const sets = useUserSets(account?.pubkey, undefined, true);
  const { lists: favoriteLists } = useFavoriteLists();
  const newList = useDisclosure();
  const navigate = useNavigate();

  const contacts = useUserContacts(account?.pubkey);
  const mutes = useUserMutes(account?.pubkey);

  const followSets = sets.filter((event) => event.kind === kinds.Followsets);
  const genericSets = sets.filter((event) => event.kind === kinds.Genericlists);
  const bookmarkSets = sets.filter((event) => event.kind === kinds.Bookmarksets);

  const columns = { base: 1, lg: 2, xl: 3, "2xl": 4 };

  return (
    <SimpleView title="Lists" maxW="8xl" center>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing="2">
        <ListTypeCard title="Following" path="/lists/following" icon={Users01} people={contacts} />
        <ListTypeCard title="Muted" path="/lists/muted" icon={MuteIcon} />
      </SimpleGrid>

      <Flex mt="4">
        <Heading size="lg">Follow sets</Heading>
        <Button leftIcon={<Plus boxSize={5} />} onClick={newList.onOpen} colorScheme="primary" ms="auto">
          New List
        </Button>
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="2">
        {followSets.map((event) => (
          <PeopleListCard key={getEventUID(event)} list={event} />
        ))}
      </SimpleGrid>

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
    </SimpleView>
  );
}

export default function ListHomeView() {
  return (
    <RequireActiveAccount>
      <ListHomePage />
    </RequireActiveAccount>
  );
}
