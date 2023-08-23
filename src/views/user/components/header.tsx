import { Flex, Heading, IconButton, Spacer, useBreakpointValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { EditIcon } from "../../../components/icons";
import { UserAvatar } from "../../../components/user-avatar";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { UserProfileMenu } from "./user-profile-menu";

export default function Header({
  pubkey,
  showRelaySelectionModal,
}: {
  pubkey: string;
  showRelaySelectionModal: () => void;
}) {
  const navigate = useNavigate();
  const metadata = useUserMetadata(pubkey);

  const account = useCurrentAccount();
  const isSelf = pubkey === account?.pubkey;

  const showFullNip05 = useBreakpointValue({ base: false, md: true });

  return (
    <Flex direction="column" gap="2" px="2" pt="2">
      <Flex gap="2" alignItems="center">
        <UserAvatar pubkey={pubkey} size="sm" noProxy mr="2" />
        <Heading size="md" isTruncated>
          {getUserDisplayName(metadata, pubkey)}
        </Heading>
        <UserDnsIdentityIcon pubkey={pubkey} onlyIcon={showFullNip05} />
        <Spacer />
        {isSelf && (
          <IconButton
            icon={<EditIcon />}
            aria-label="Edit profile"
            title="Edit profile"
            size="sm"
            colorScheme="brand"
            onClick={() => navigate("/profile")}
          />
        )}
        <UserProfileMenu
          pubkey={pubkey}
          aria-label="More Options"
          size="sm"
          showRelaySelectionModal={showRelaySelectionModal}
        />
      </Flex>
    </Flex>
  );
}
