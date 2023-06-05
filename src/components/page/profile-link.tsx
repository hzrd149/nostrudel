import { Box, Button, LinkBox, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { UserAvatar } from "../user-avatar";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip19";
import { truncatedId } from "../../helpers/nostr-event";
import { useCurrentAccount } from "../../hooks/use-current-account";

function ProfileButton() {
  const account = useCurrentAccount()!;
  const metadata = useUserMetadata(account.pubkey);

  return (
    <LinkBox
      as={RouterLink}
      to={`/u/${normalizeToBech32(account.pubkey, Bech32Prefix.Pubkey)}`}
      display="flex"
      gap="2"
      overflow="hidden"
    >
      <UserAvatar pubkey={account.pubkey} noProxy />
      <Box>
        <Text fontWeight="bold">{metadata?.name}</Text>
        <Text>{truncatedId(normalizeToBech32(account.pubkey) ?? "")}</Text>
      </Box>
    </LinkBox>
  );
}

export default function ProfileLink() {
  const account = useCurrentAccount();

  if (account) return <ProfileButton />;
  else
    return (
      <Button as={RouterLink} to="/login" state={{ from: location.pathname }} colorScheme="brand">
        Login
      </Button>
    );
}
