import { SimpleGrid, Spinner } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";

import { UserCard } from "./components/user-card";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import useUserContactList from "../../hooks/use-user-contact-list";
import { getPubkeysFromList } from "../../helpers/nostr/lists";

export default function UserFollowingTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();
  const contactsList = useUserContactList(pubkey, contextRelays, true);

  const people = contactsList ? getPubkeysFromList(contactsList) : [];

  if (!contactsList) return <Spinner />;

  return (
    <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2" py="2">
      {people.map(({ pubkey, relay }) => (
        <UserCard key={pubkey} pubkey={pubkey} relay={relay} />
      ))}
    </SimpleGrid>
  );
}
