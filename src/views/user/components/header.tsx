import { Flex, Heading, IconButton, Spacer } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { EditIcon } from "../../../components/icons";
import { UserAvatar } from "../../../components/user-avatar";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { useIsMobile } from "../../../hooks/use-is-mobile";
import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { UserProfileMenu } from "./user-profile-menu";

export default function Header({
  pubkey,
  showRelaySelectionModal,
}: {
  pubkey: string;
  showRelaySelectionModal: () => void;
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const metadata = useUserMetadata(pubkey);

  const account = useCurrentAccount();
  const isSelf = pubkey === account?.pubkey;

  return (
    <Flex direction="column" gap="2" px="2" pt="2">
      <Flex gap="2" alignItems="center">
        <UserAvatar pubkey={pubkey} size="sm" noProxy mr="2" />
        <Heading size="md">{getUserDisplayName(metadata, pubkey)}</Heading>
        <UserDnsIdentityIcon pubkey={pubkey} onlyIcon={isMobile} />
        <Spacer />
        {isSelf && (
          <IconButton
            icon={<EditIcon />}
            aria-label="Edit profile"
            title="Edit profile"
            size="sm"
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
