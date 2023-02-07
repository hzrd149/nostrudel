import { Box, Button, Flex, SkeletonText } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Bech32Prefix, normalizeToBech32 } from "../helpers/nip-19";
import { getUserDisplayName } from "../helpers/user-metadata";
import useSubject from "../hooks/use-subject";
import { useUserContacts } from "../hooks/use-user-contacts";
import { useUserMetadata } from "../hooks/use-user-metadata";
import identity from "../services/identity";
import { UserAvatar } from "./user-avatar";

const FollowingListItem = ({ pubkey }: { pubkey: string }) => {
  const metadata = useUserMetadata(pubkey);

  if (!metadata) return <SkeletonText />;

  return (
    <Button
      as={Link}
      leftIcon={<UserAvatar pubkey={pubkey} size="xs" />}
      overflow="hidden"
      variant="outline"
      to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`}
      justifyContent="flex-start"
    >
      {getUserDisplayName(metadata, pubkey)}
    </Button>
  );
};

export const FollowingList = () => {
  const pubkey = useSubject(identity.pubkey);
  const contacts = useUserContacts(pubkey);

  if (!contacts) return <SkeletonText />;

  return (
    <Box overflow="auto" pr="2" pb="4" pt="2">
      <Flex direction="column" gap="2">
        {contacts.contacts.map((contact) => (
          <FollowingListItem key={contact} pubkey={contact} />
        ))}
      </Flex>
    </Box>
  );
};
