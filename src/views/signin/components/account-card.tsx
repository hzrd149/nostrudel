import { CloseIcon } from "@chakra-ui/icons";
import { Box, IconButton, Text } from "@chakra-ui/react";
import { useAccountManager } from "applesauce-react/hooks";
import { IAccount } from "applesauce-accounts";

import { getDisplayName } from "../../../helpers/nostr/profile";
import useUserProfile from "../../../hooks/use-user-profile";
import UserAvatar from "../../../components/user/user-avatar";
import AccountTypeBadge from "../../../components/accounts/account-info-badge";

export default function AccountCard({ account }: { account: IAccount }) {
  const pubkey = account.pubkey;
  // this wont load unless the data is cached since there are no relay connections yet
  const metadata = useUserProfile(pubkey);
  const manager = useAccountManager();

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
      onClick={() => manager.setActive(account)}
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
          manager.removeAccount(account);
        }}
        size="md"
        variant="ghost"
      />
    </Box>
  );
}
