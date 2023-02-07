import { useMemo } from "react";
import { Flex, SkeletonText, Text } from "@chakra-ui/react";
import settings from "../../services/settings";
import useSubject from "../../hooks/use-subject";
import userContactsService from "../../services/user-contacts";
import { UserAvatarLink } from "../../components/user-avatar-link";
import moment from "moment";

export const UserFollowingTab = ({ pubkey }: { pubkey: string }) => {
  const observable = useMemo(() => userContactsService.requestContacts(pubkey, [], true), [pubkey]);
  const contacts = useSubject(observable);

  return (
    <Flex gap="2" direction="column">
      {contacts ? (
        <>
          <Flex flexWrap="wrap" gap="2">
            {contacts.contacts.map((contact, i) => (
              <UserAvatarLink key={contact.pubkey + i} pubkey={contact.pubkey} />
            ))}
          </Flex>
          <Text>{`Updated ${moment(contacts?.created_at).fromNow()}`}</Text>
        </>
      ) : (
        <SkeletonText />
      )}
    </Flex>
  );
};
