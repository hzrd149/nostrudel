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
  Box,
  Link,
  IconButton,
} from "@chakra-ui/react";
import { Outlet, useLoaderData, useMatches, useNavigate } from "react-router-dom";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatar } from "../../components/user-avatar";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserProfileMenu } from "./components/user-profile-menu";
import { LinkIcon } from "@chakra-ui/icons";
import { UserTipButton } from "../../components/user-tip-button";

const tabs = [
  { label: "Notes", path: "notes" },
  { label: "Replies", path: "replies" },
  { label: "Followers", path: "followers" },
  { label: "Following", path: "following" },
  { label: "Relays", path: "relays" },
];

const UserView = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { pubkey } = useLoaderData() as { pubkey: string };

  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];

  const activeTab = tabs.indexOf(tabs.find((t) => lastMatch.pathname.includes(t.path)) ?? tabs[0]);

  const metadata = useUserMetadata(pubkey, [], true);

  const header = (
    <Flex gap="4" padding="2">
      <UserAvatar pubkey={pubkey} size={isMobile ? "md" : "xl"} />
      <Flex direction="column" gap={isMobile ? 0 : 2}>
        <Heading size={isMobile ? "md" : "lg"}>{getUserDisplayName(metadata, pubkey)}</Heading>
        {!metadata ? <SkeletonText /> : <Text>{metadata?.about}</Text>}
        {metadata?.website && (
          <Text>
            <LinkIcon />{" "}
            <Link href={metadata.website} target="_blank" color="blue.500">
              {metadata.website}
            </Link>
          </Text>
        )}
      </Flex>
      <Flex ml="auto" gap="2">
        <UserTipButton pubkey={pubkey} size="xs" />
        <UserProfileMenu pubkey={pubkey} />
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
        <TabList overflow={isMobile ? "auto" : undefined}>
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
