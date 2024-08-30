import { CloseIcon } from "@chakra-ui/icons";
import { Box, IconButton, Text } from "@chakra-ui/react";

import { getDisplayName } from "../../../helpers/nostr/user-metadata";
import useUserMetadata from "../../../hooks/use-user-metadata";
import accountService from "../../../services/account";
import UserAvatar from "../../../components/user/user-avatar";
import AccountTypeBadge from "../../../components/account-info-badge";
import { Account } from "../../../classes/accounts/account";

export default function AccountCard({ account }: { account: Account }) {
  const pubkey = account.pubkey;
  // this wont load unless the data is cached since there are no relay connections yet
  const metadata = useUserMetadata(pubkey, []);

  return (
    <Box
      display="flex"
      gap="4"
      alignItems="center"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      padding="2"
      cursor="pointer"
      onClick={() => accountService.switchAccount(pubkey)}
    >
      <UserAvatar pubkey={pubkey} size="md" noProxy />
      <Box flex={1}>
        <Text isTruncated fontWeight="bold">
          {getDisplayName(metadata, pubkey)}
        </Text>
        <AccountTypeBadge account={account} />
      </Box>
      <IconButton
        icon={<CloseIcon />}
        aria-label="Remove Account"
        onClick={(e) => {
          e.stopPropagation();
          accountService.removeAccount(pubkey);
        }}
        size="md"
        variant="ghost"
      />
    </Box>
  );
}
