import {
  Flex,
  Heading,
  SkeletonText,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Link,
  IconButton,
} from "@chakra-ui/react";
import { Outlet, useLoaderData, useMatches, useNavigate } from "react-router-dom";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatar } from "../../components/user-avatar";
import { fixWebsiteUrl, getUserDisplayName } from "../../helpers/user-metadata";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserProfileMenu } from "./components/user-profile-menu";
import { LinkIcon } from "@chakra-ui/icons";
import { UserTipButton } from "../../components/user-tip-button";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity";
import { truncatedId } from "../../helpers/nostr-event";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";
import { KeyIcon, SettingsIcon } from "../../components/icons";
import { CopyIconButton } from "../../components/copy-icon-button";
import { UserFollowButton } from "../../components/user-follow-button";
import { useAppTitle } from "../../hooks/use-app-title";
import { useCurrentAccount } from "../../hooks/use-current-account";

const tabs = [
  { label: "Notes", path: "notes" },
  { label: "Followers", path: "followers" },
  { label: "Following", path: "following" },
  { label: "Relays", path: "relays" },
];

const UserView = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { pubkey } = useLoaderData() as { pubkey: string };

  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];

  const activeTab = tabs.indexOf(tabs.find((t) => lastMatch.pathname.includes(t.path)) ?? tabs[0]);

  const metadata = useUserMetadata(pubkey, [], true);
  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey);
  const isSelf = pubkey === account.pubkey;

  useAppTitle(getUserDisplayName(metadata, npub ?? pubkey));

  const header = (
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
            <LinkIcon />{" "}
            <Link href={fixWebsiteUrl(metadata.website)} target="_blank" color="blue.500">
              {metadata.website}
            </Link>
          </Text>
        )}
        <Text>
          <KeyIcon /> {truncatedId(npub ?? "", 10)}{" "}
          <CopyIconButton text={npub ?? ""} title="Copy npub" aria-label="Copy npub" />
        </Text>
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

  return (
    <Flex direction="column" alignItems="stretch" gap="2" overflow={isMobile ? "auto" : "hidden"} height="100%">
      {/* {metadata?.banner && <Image src={metadata.banner} />} */}
      {header}
      <Tabs
        display="flex"
        flexDirection="column"
        flexGrow="1"
        overflow={isMobile ? undefined : "hidden"}
        isLazy
        index={activeTab}
        onChange={(v) => navigate(tabs[v].path)}
      >
        <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
          {tabs.map(({ label }) => (
            <Tab key={label}>{label}</Tab>
          ))}
        </TabList>

        <TabPanels overflow={isMobile ? undefined : "auto"} height="100%">
          {tabs.map(({ label }) => (
            <TabPanel key={label} pr={0} pl={0}>
              <Outlet context={{ pubkey }} />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Flex>
  );
};

export default UserView;
