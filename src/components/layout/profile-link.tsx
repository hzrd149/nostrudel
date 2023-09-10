import { Box, Button, ButtonProps, LinkBox, LinkOverlay } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { UserAvatar } from "../user-avatar";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../helpers/user-metadata";

function ProfileButton() {
  const account = useCurrentAccount()!;
  const metadata = useUserMetadata(account.pubkey);

  return (
    <LinkBox
      borderRadius="lg"
      borderWidth={1}
      p="2"
      display="flex"
      gap="2"
      alignItems="center"
      flexGrow={1}
      overflow="hidden"
    >
      <UserAvatar pubkey={account.pubkey} noProxy size="sm" />
      <LinkOverlay
        as={RouterLink}
        to={`/u/${nip19.npubEncode(account.pubkey)}`}
        whiteSpace="nowrap"
        fontWeight="bold"
        fontSize="lg"
        title="View profile"
        isTruncated
      >
        {getUserDisplayName(metadata, account.pubkey)}
      </LinkOverlay>
    </LinkBox>
  );
}

export default function ProfileLink() {
  const account = useCurrentAccount();
  const location = useLocation();

  if (account) return <ProfileButton />;

  return (
    <Button as={RouterLink} to="/login" state={{ from: location.pathname }} colorScheme="brand" isTruncated>
      Login
    </Button>
  );
}
