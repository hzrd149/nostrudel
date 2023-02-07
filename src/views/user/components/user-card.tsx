import { Box, Flex, Heading, IconButton, Link } from "@chakra-ui/react";
import { Link as ReactRouterLink } from "react-router-dom";

import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { AddIcon } from "../../../components/icons";
import { UserAvatar } from "../../../components/user-avatar";
import { Bech32Prefix, normalizeToBech32 } from "../../../helpers/nip-19";

export const UserCard = ({ pubkey }: { pubkey: string }) => {
  const metadata = useUserMetadata(pubkey);

  return (
    <Box borderWidth="1px" borderRadius="lg" pl="3" pr="3" pt="2" pb="2" overflow="hidden">
      <Flex gap="4" alignItems="center">
        <UserAvatar pubkey={pubkey} />
        <Link as={ReactRouterLink} to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`}>
          <Heading size="sm">{getUserDisplayName(metadata, pubkey)}</Heading>
        </Link>
        <IconButton size="sm" icon={<AddIcon />} aria-label="Follow user" title="Follow" ml="auto" />
      </Flex>
    </Box>
  );
};
