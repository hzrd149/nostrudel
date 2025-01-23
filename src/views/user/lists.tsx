import { useOutletContext } from "react-router-dom";
import { Heading, SimpleGrid } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import { isJunkList } from "../../helpers/nostr/lists";
import ListCard from "../lists/components/list-card";
import useUserSets from "../../hooks/use-user-lists";
import SimpleView from "../../components/layout/presets/simple-view";

export default function UserListsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const sets = useUserSets(pubkey).filter((e) => !isJunkList(e));

  const followSets = sets.filter((event) => event.pubkey === pubkey && event.kind === kinds.Followsets);
  const genericSets = sets.filter((event) => event.pubkey === pubkey && event.kind === kinds.Genericlists);
  const bookmarkSets = sets.filter((event) => event.pubkey === pubkey && event.kind === kinds.Bookmarksets);

  const columns = { base: 1, lg: 2, xl: 3, "2xl": 4 };

  return (
    <SimpleView title="Lists">
      <Heading size="md" mt="2">
        Special lists
      </Heading>
      <SimpleGrid columns={columns} spacing="2">
        <ListCard cord={`${kinds.Contacts}:${pubkey}`} hideCreator />
        <ListCard cord={`${kinds.Mutelist}:${pubkey}`} hideCreator />
        <ListCard cord={`${kinds.Pinlist}:${pubkey}`} hideCreator />
        <ListCard cord={`${kinds.BookmarkList}:${pubkey}`} hideCreator />
        <ListCard cord={`${kinds.CommunitiesList}:${pubkey}`} hideCreator />
        <ListCard cord={`${kinds.PublicChatsList}:${pubkey}`} hideCreator />
      </SimpleGrid>

      {followSets.length > 0 && (
        <>
          <Heading size="md" mt="2">
            People lists
          </Heading>
          <SimpleGrid columns={columns} spacing="2">
            {followSets.map((set) => (
              <ListCard key={getEventUID(set)} list={set} hideCreator />
            ))}
          </SimpleGrid>
        </>
      )}

      {genericSets.length > 0 && (
        <>
          <Heading size="md" mt="2">
            Generic lists
          </Heading>
          <SimpleGrid columns={columns} spacing="2">
            {genericSets.map((set) => (
              <ListCard key={getEventUID(set)} list={set} hideCreator />
            ))}
          </SimpleGrid>
        </>
      )}

      {bookmarkSets.length > 0 && (
        <>
          <Heading size="md" mt="2">
            Bookmark sets
          </Heading>
          <SimpleGrid columns={columns} spacing="2">
            {bookmarkSets.map((set) => (
              <ListCard key={getEventUID(set)} list={set} hideCreator />
            ))}
          </SimpleGrid>
        </>
      )}
    </SimpleView>
  );
}
