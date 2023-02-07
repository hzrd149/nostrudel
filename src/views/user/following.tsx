import { useMemo } from "react";
import { Flex, SkeletonText, Text } from "@chakra-ui/react";
import settings from "../../services/settings";
import useSubject from "../../hooks/use-subject";
import userContacts from "../../services/user-contacts";
import { UserAvatarLink } from "../../components/user-avatar-link";
import moment from "moment";

export const UserFollowingTab = ({ pubkey }: { pubkey: string }) => {
  const relays = useSubject(settings.relays);

  const sub = useMemo(
    () => userContacts.requestUserContacts(pubkey, relays),
    [pubkey]
  );

  const contacts = useSubject(sub);

  return (
    <Flex gap="2" direction="column">
      {contacts ? (
        <>
          <Flex flexWrap="wrap" gap="2">
            {contacts.contacts.map((contact) => (
              <UserAvatarLink key={contact.pubkey} pubkey={contact.pubkey} />
            ))}
          </Flex>
          <Text>{`Updated ${moment(contacts?.updated).fromNow()}`}</Text>
        </>
      ) : (
        <SkeletonText />
      )}
    </Flex>
  );
};
