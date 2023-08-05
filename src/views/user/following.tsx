import { SimpleGrid, Spinner } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";

import { UserCard } from "./components/user-card";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { UserContacts } from "../../services/user-contacts";
import { unique } from "../../helpers/array";

export default function UserFollowingTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();
  const contacts = useUserContacts(pubkey, contextRelays, true);

  const people = unique(contacts?.contacts ?? []);

  if (!contacts) return <Spinner />;

  return (
    <SimpleGrid minChildWidth={["full", "4in"]} spacing="2" py="2">
      {people.map((pubkey) => (
        <UserCard key={pubkey} pubkey={pubkey} relay={contacts?.contactRelay[pubkey]} />
      ))}
    </SimpleGrid>
  );
}
