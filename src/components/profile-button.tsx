import { Box, LinkBox, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import identityService from "../services/identity";
import { UserAvatar } from "./user-avatar";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { normalizeToBech32 } from "../helpers/nip-19";
import { truncatedId } from "../helpers/nostr-event";
import useSubject from "../hooks/use-subject";

export const ProfileButton = () => {
  const pubkey = useSubject(identityService.pubkey) ?? "";
  const metadata = useUserMetadata(pubkey);

  return (
    <LinkBox as={Link} to={`/u/${pubkey}`} display="flex" gap="2" overflow="hidden">
      <UserAvatar pubkey={pubkey} />
      <Box>
        <Text fontWeight="bold">{metadata?.name}</Text>
        <Text>{truncatedId(normalizeToBech32(pubkey) ?? "")}</Text>
      </Box>
    </LinkBox>
  );
};
