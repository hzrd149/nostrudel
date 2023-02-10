import { Box, Button, Flex, SkeletonText } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Bech32Prefix, normalizeToBech32 } from "../helpers/nip-19";
import { getUserDisplayName } from "../helpers/user-metadata";
import useSubject from "../hooks/use-subject";
import { useUserMetadata } from "../hooks/use-user-metadata";
import clientFollowingService from "../services/client-following";
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
  const following = useSubject(clientFollowingService.following);

  if (!following) return <SkeletonText />;

  return (
    <Box overflow="auto" pr="2" pb="4" pt="2">
      <Flex direction="column" gap="2">
        {following.map((pTag) => (
          <FollowingListItem key={pTag[1]} pubkey={pTag[1]} />
        ))}
      </Flex>
    </Box>
  );
};
