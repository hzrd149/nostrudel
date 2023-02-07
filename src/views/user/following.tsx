import moment from "moment";
import { Flex, Grid, SkeletonText, Text } from "@chakra-ui/react";

import { UserCard } from "./components/user-card";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useOutletContext } from "react-router-dom";

const UserFollowingTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contacts = useUserContacts(pubkey, [], true);

  return (
    <Flex gap="2" direction="column">
      {contacts ? (
        <>
          <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)", "2xl": "repeat(3, 1fr)" }} gap="2">
            {contacts.contacts.map((pubkey, i) => (
              <UserCard key={pubkey + i} pubkey={pubkey} />
            ))}
          </Grid>
          <Text>{`Updated ${moment(contacts?.created_at * 1000).fromNow()}`}</Text>
        </>
      ) : (
        <SkeletonText />
      )}
    </Flex>
  );
};

export default UserFollowingTab;
