import { Flex, Heading, SkeletonText, Text, Link, IconButton } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { CopyIconButton } from "../../../components/copy-icon-button";
import { ExternalLinkIcon, KeyIcon, SettingsIcon } from "../../../components/icons";
import { QrIconButton } from "../../../components/qr-icon-button";
import { UserAvatar } from "../../../components/user-avatar";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity";
import { UserFollowButton } from "../../../components/user-follow-button";
import { UserTipButton } from "../../../components/user-tip-button";
import { Bech32Prefix, normalizeToBech32 } from "../../../helpers/nip-19";
import { truncatedId } from "../../../helpers/nostr-event";
import { fixWebsiteUrl, getUserDisplayName } from "../../../helpers/user-metadata";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { useIsMobile } from "../../../hooks/use-is-mobile";
import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { UserProfileMenu } from "./user-profile-menu";

export default function Header({ pubkey }: { pubkey: string }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const metadata = useUserMetadata(pubkey);
  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey);

  const account = useCurrentAccount();
  const isSelf = pubkey === account.pubkey;

  return (
    <Flex direction="column" gap="2" px="2" pt="2">
      <Flex gap="4">
        <UserAvatar pubkey={pubkey} size={isMobile ? "md" : "xl"} />
        <Flex direction="column" gap={isMobile ? 0 : 2} grow="1" overflow="hidden">
          <Flex gap="2" justifyContent="space-between" width="100%">
            <Flex gap="2" alignItems="center" wrap="wrap">
              <Heading size={isMobile ? "md" : "lg"}>{getUserDisplayName(metadata, pubkey)}</Heading>
              <UserDnsIdentityIcon pubkey={pubkey} />
            </Flex>
            <Flex gap="2">
              <UserTipButton pubkey={pubkey} size="xs" />
              <UserProfileMenu pubkey={pubkey} />
            </Flex>
          </Flex>
          {!metadata ? <SkeletonText /> : <Text>{metadata?.about}</Text>}
        </Flex>
      </Flex>
      <Flex wrap="wrap" gap="2">
        {metadata?.website && (
          <Text>
            <ExternalLinkIcon />{" "}
            <Link href={fixWebsiteUrl(metadata.website)} target="_blank" color="blue.500">
              {metadata.website}
            </Link>
          </Text>
        )}
        {npub && (
          <Flex gap="2">
            <KeyIcon />
            <Text>{truncatedId(npub, 10)}</Text>
            <CopyIconButton text={npub} title="Copy npub" aria-label="Copy npub" size="xs" />
            <QrIconButton content={"nostr:" + npub} title="Show QrCode" aria-label="Show QrCode" size="xs" />
          </Flex>
        )}
        <Flex gap="2" ml="auto">
          {isMobile && isSelf && (
            <IconButton
              icon={<SettingsIcon />}
              aria-label="Settings"
              title="Settings"
              size="sm"
              onClick={() => navigate("/settings")}
            />
          )}
          {!isSelf && <UserFollowButton pubkey={pubkey} size="sm" />}
        </Flex>
      </Flex>
    </Flex>
  );
}
