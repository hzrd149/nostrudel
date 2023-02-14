import { CloseIcon } from "@chakra-ui/icons";
import { Box, IconButton, Text } from "@chakra-ui/react";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { useUserMetadata } from "../../../hooks/use-user-metadata";
import accountService from "../../../services/account";
import { UserAvatar } from "../../../components/user-avatar";

export default function AccountCard({ pubkey }: { pubkey: string }) {
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
      <UserAvatar pubkey={pubkey} size="sm" />
      <Text flex={1} mr="4" overflow="hidden">
        {getUserDisplayName(metadata, pubkey)}
      </Text>
      <IconButton
        icon={<CloseIcon />}
        aria-label="Remove Account"
        onClick={(e) => {
          e.stopPropagation();
          accountService.removeAccount(pubkey);
        }}
        size="sm"
        variant="ghost"
      />
    </Box>
  );
}
