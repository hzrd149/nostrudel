import { SimpleGrid, Spinner } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import { getPubkeysFromList } from "../../helpers/nostr/lists";
import useUserContactList from "../../hooks/use-user-contact-list";
import { useWebOfTrust } from "../../providers/global/web-of-trust-provider";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import { UserCard } from "./components/user-card";

export default function UserFollowingTab() {
  const webOfTrust = useWebOfTrust();
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const contactsList = useUserContactList({ pubkey, relays: contextRelays });

  const people = contactsList ? getPubkeysFromList(contactsList) : [];
  const sorted = webOfTrust ? webOfTrust.sortByDistanceAndConnections(people, (p) => p.pubkey) : people;

  if (!contactsList) return <Spinner />;

  return (
    <SimpleView title="Following">
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2" p="2">
        {sorted.map(({ pubkey, relay }) => (
          <ErrorBoundary key={pubkey}>
            <UserCard pubkey={pubkey} relay={relay} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
    </SimpleView>
  );
}
