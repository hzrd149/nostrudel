import { AvatarGroup, Box, Button, Flex, Heading, Image, SimpleGrid, Text, useDisclosure } from "@chakra-ui/react";
import {
  getAddressPointersFromList,
  getEventPointersFromList,
  getEventUID,
  getProfilePointersFromList,
  getTagValue,
} from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { useNavigate } from "react-router-dom";

import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { MuteIcon } from "../../components/icons";
import Users01 from "../../components/icons/users-01";
import SimpleNavBox from "../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../components/router/require-active-account";
import UserAvatar from "../../components/user/user-avatar";
import { getListDescription, getListTitle } from "../../helpers/nostr/lists";
import useFavoriteLists from "../../hooks/use-favorite-lists";
import useUserSets from "../../hooks/use-user-sets";
import { getSharableEventAddress } from "../../services/relay-hints";
import { createListLink } from "./components/fallback-list-card";
import NewBookmarkSetModal from "./components/new-set-modal";
import Timestamp from "../../components/timestamp";
import useUserContacts from "../../hooks/use-user-contacts";
import useUserMutes from "../../hooks/use-user-mutes";

function PeopleListRow({ list }: { list: NostrEvent }) {
  const title = getListTitle(list);
  const description = getListDescription(list);
  const image = getTagValue(list, "image");
  const people = getProfilePointersFromList(list);

  return (
    <SimpleNavBox
      title={title}
      icon={image ? <Image src={image} alt={title} w="14" h="14" objectFit="cover" /> : undefined}
      timestamp={
        <>
          updated <Timestamp timestamp={list.created_at} />
        </>
      }
      to={createListLink(list)}
      description={description}
      metadata={
        <Flex gap="2" alignItems="center">
          <AvatarGroup size="sm">
            {people.slice(0, 5).map((person) => (
              <UserAvatar key={person.pubkey} pubkey={person.pubkey} size="xs" showNip05={false} />
            ))}
          </AvatarGroup>
          {people.length > 5 && <Text fontSize="sm">+{people.length - 5}</Text>}
        </Flex>
      }
    />
  );
}

function GenericListRow({ list }: { list: NostrEvent }) {
  const title = getListTitle(list);
  const description = getListDescription(list);
  const people = getProfilePointersFromList(list);
  const notes = getEventPointersFromList(list);
  const addresses = getAddressPointersFromList(list);

  const counts = [];
  if (people.length > 0) counts.push(`${people.length} people`);
  if (notes.length > 0) counts.push(`${notes.length} notes`);
  if (addresses.length > 0) counts.push(`${addresses.length} items`);

  return (
    <SimpleNavBox
      title={title}
      to={createListLink(list)}
      description={description}
      metadata={counts.length > 0 ? <Text fontSize="sm">{counts.join(" · ")}</Text> : undefined}
      timestamp={
        <>
          updated <Timestamp timestamp={list.created_at} />
        </>
      }
    />
  );
}

function BuiltInListCards() {
  const account = useActiveAccount();
  const contacts = useUserContacts(account?.pubkey);
  const muted = useUserMutes(account?.pubkey);

  return (
    <>
      <SimpleNavBox
        icon={<Users01 boxSize={12} />}
        title="Following"
        description="People you follow"
        to="/lists/following"
        metadata={<Text fontSize="sm">{contacts?.length ?? 0} contacts</Text>}
      />
      <SimpleNavBox
        icon={<MuteIcon boxSize={12} />}
        title="Muted"
        description="Muted accounts"
        to="/lists/muted"
        metadata={<Text fontSize="sm">{muted?.pubkeys?.size ?? 0} muted users</Text>}
      />
    </>
  );
}

function PeopleListsSection() {
  const account = useActiveAccount();
  const sets = useUserSets(account?.pubkey) ?? [];

  const followSets = sets.filter((event) => event.kind === kinds.Followsets);

  return (
    <>
      <Flex px="4" pb="2" pt="4" alignItems="center" gap="2">
        <Box>
          <Heading size="md">People lists</Heading>
          <Text color="GrayText">Lists of other users.</Text>
        </Box>
      </Flex>

      {followSets.length > 0 && (
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
          {followSets.map((event) => (
            <PeopleListRow key={getEventUID(event)} list={event} />
          ))}
        </SimpleGrid>
      )}
    </>
  );
}

function GenericListsSection() {
  const account = useActiveAccount();
  const sets = useUserSets(account?.pubkey) ?? [];

  const genericSets = sets.filter((event) => event.kind === kinds.Genericlists);

  if (genericSets.length === 0) return null;

  return (
    <>
      <Box px="4" pb="2" pt="4">
        <Heading size="md">Generic lists</Heading>
      </Box>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
        {genericSets.map((event) => (
          <GenericListRow key={getEventUID(event)} list={event} />
        ))}
      </SimpleGrid>
    </>
  );
}

function BookmarkListsSection() {
  const account = useActiveAccount();
  const sets = useUserSets(account?.pubkey) ?? [];

  const bookmarkSets = sets.filter((event) => event.kind === kinds.Bookmarksets);

  if (bookmarkSets.length === 0) return null;

  return (
    <>
      <Box px="4" pb="2" pt="4">
        <Heading size="md">Bookmark lists</Heading>
        <Text color="GrayText">Lists of notes you have bookmarked.</Text>
      </Box>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
        {bookmarkSets.map((event) => (
          <GenericListRow key={getEventUID(event)} list={event} />
        ))}
      </SimpleGrid>
    </>
  );
}

function FavoriteListsSection() {
  const account = useActiveAccount();
  const { lists: favoriteLists } = useFavoriteLists(account?.pubkey);

  if (favoriteLists.length === 0) return null;

  return (
    <>
      <Box px="4" pb="2" pt="4">
        <Heading size="md">Favorite lists</Heading>
        <Text color="GrayText">Lists you have favorited.</Text>
      </Box>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
        {favoriteLists.map((event) => (
          <PeopleListRow key={getEventUID(event)} list={event} />
        ))}
      </SimpleGrid>
    </>
  );
}

function ListHomePage() {
  const newList = useDisclosure();
  const navigate = useNavigate();

  return (
    <SimpleView
      title="Lists"
      flush
      gap={0}
      actions={
        <Button onClick={newList.onOpen} variant="ghost" colorScheme="primary" ml="auto">
          New List
        </Button>
      }
    >
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }}>
        <BuiltInListCards />
      </SimpleGrid>
      <PeopleListsSection />
      <GenericListsSection />
      <BookmarkListsSection />
      <FavoriteListsSection />

      {newList.isOpen && (
        <NewBookmarkSetModal
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
