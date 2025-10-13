import { SimpleGrid, Spinner } from "@chakra-ui/react";

import { getProfilePointersFromList } from "applesauce-core/helpers";
import { ErrorBoundary } from "../../../components/error-boundary";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useUserContactList from "../../../hooks/use-user-contact-list";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { sortByDistanceAndConnections } from "../../../services/social-graph";
import { UserCard } from "../components/user-card";

export default function UserFollowingTab() {
  const user = useParamsProfilePointer("pubkey");
  const mailboxes = useUserMailboxes(user);
  const readRelays = useReadRelays();

  const contactsList = useUserContactList({ pubkey: user.pubkey, relays: mailboxes?.outboxes || readRelays });

  const people = contactsList ? getProfilePointersFromList(contactsList) : [];
  const sorted = sortByDistanceAndConnections(people, (p) => p.pubkey);

  if (!contactsList) return <Spinner />;

  return (
    <ScrollLayout>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
        {sorted.map(({ pubkey, relays }) => (
          <ErrorBoundary key={pubkey}>
            <UserCard pubkey={pubkey} relay={relays?.[0]} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
    </ScrollLayout>
  );
}
