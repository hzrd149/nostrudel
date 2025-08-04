import { Heading, SimpleGrid } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import Users01 from "../../../components/icons/users-01";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useUserContacts from "../../../hooks/use-user-contacts";
import useUserSets from "../../../hooks/use-user-lists";
import useUserMutes from "../../../hooks/use-user-mutes";
import FallbackListCard from "../../lists/components/fallback-list-card";
import ListTypeCard from "../../lists/components/list-type-card";
import PeopleListCard from "../../lists/components/people-list-card";

export default function UserListsTab() {
  const user = useParamsProfilePointer("pubkey");
  const sets = useUserSets(user.pubkey) ?? [];
  const pubkey = user.pubkey;

  const contacts = useUserContacts(user.pubkey);
  const muted = useUserMutes(pubkey);
  const followSets = sets.filter((event) => event.pubkey === pubkey && event.kind === kinds.Followsets);
  const genericSets = sets.filter((event) => event.pubkey === pubkey && event.kind === kinds.Genericlists);
  const bookmarkSets = sets.filter((event) => event.pubkey === pubkey && event.kind === kinds.Bookmarksets);

  const columns = { base: 1, xl: 2 };

  return (
    <ScrollLayout maxW="6xl" center>
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="2">
        <ListTypeCard title="Following" path={`/u/${pubkey}/following`} icon={Users01} people={contacts} />
        {/* {muted && <ListTypeCard title="Muted" path={`/u/${pubkey}/muted`} icon={MuteIcon} />} */}
        {/* <ListTypeCard title="Bookmarks" path={`/u/${pubkey}/bookmarks`} icon={BookmarkIcon} /> */}
      </SimpleGrid>

      {followSets.length > 0 && (
        <>
          <Heading size="md" mt="2">
            People lists
          </Heading>
          <SimpleGrid columns={columns} spacing="2">
            {followSets.map((set) => (
              <PeopleListCard key={getEventUID(set)} list={set} />
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
              <FallbackListCard key={getEventUID(set)} list={set} hideCreator />
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
              <FallbackListCard key={getEventUID(set)} list={set} hideCreator />
            ))}
          </SimpleGrid>
        </>
      )}
    </ScrollLayout>
  );
}
