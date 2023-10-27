import { Flex, Heading, IconButton, Spacer } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { EditIcon, GhostIcon } from "../../../components/icons";
import UserAvatar from "../../../components/user-avatar";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { UserProfileMenu } from "./user-profile-menu";
import { UserFollowButton } from "../../../components/user-follow-button";
import accountService from "../../../services/account";
import { useBreakpointValue } from "../../../providers/breakpoint-provider";

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

  const showExtraButtons = useBreakpointValue({ base: false, sm: true });

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
        {isSelf && !account.readonly && (
          <IconButton
            icon={<EditIcon />}
            aria-label="Edit profile"
            title="Edit profile"
            size="sm"
            colorScheme="primary"
            onClick={() => navigate("/profile")}
          />
        )}
        {showExtraButtons && !isSelf && <UserFollowButton pubkey={pubkey} size="sm" />}
        {showExtraButtons && !isSelf && (
          <IconButton
            icon={<GhostIcon />}
            size="sm"
            aria-label="ghost user"
            title="ghost user"
            onClick={() => accountService.startGhost(pubkey)}
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
