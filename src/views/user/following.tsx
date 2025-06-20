import { SimpleGrid, Spinner } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import useUserContactList from "../../hooks/use-user-contact-list";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay";
import { UserCard } from "./components/user-card";
import { getProfilePointersFromList } from "applesauce-core/helpers";
import { sortByDistanceAndConnections } from "../../services/social-graph";

export default function UserFollowingTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const contactsList = useUserContactList({ pubkey, relays: contextRelays });

  const people = contactsList ? getProfilePointersFromList(contactsList) : [];
  const sorted = sortByDistanceAndConnections(people, (p) => p.pubkey);

  if (!contactsList) return <Spinner />;

  return (
    <SimpleView title="Following">
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2" p="2">
        {sorted.map(({ pubkey, relays }) => (
          <ErrorBoundary key={pubkey}>
            <UserCard pubkey={pubkey} relay={relays?.[0]} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
    </SimpleView>
  );
}
