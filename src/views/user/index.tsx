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
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { UserPostsTab } from "./posts";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatar } from "../../components/user-avatar";
import { getUserFullName } from "../../helpers/user-metadata";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserRelaysTab } from "./relays";
import { UserFollowingTab } from "./following";
import { UserRepliesTab } from "./replies";
import { normalizeToBech32, normalizeToHex } from "../../helpers/nip-19";

export const UserView = () => {
  const isMobile = useIsMobile();
  const params = useParams();

  if (!params.pubkey) {
    // TODO: better 404
    throw new Error("No pubkey");
  }

  const pubkey = normalizeToHex(params.pubkey) ?? "";

  const { metadata, loading: loadingMetadata } = useUserMetadata(pubkey, true);
  const bech32Key = normalizeToBech32(pubkey);
  const label = metadata ? getUserFullName(metadata) || bech32Key : bech32Key;

  return (
    <Flex
      direction="column"
      alignItems="stretch"
      gap="2"
      overflow="hidden"
      height="100%"
    >
      <Flex gap="4" padding="2">
        <UserAvatar pubkey={pubkey} size={isMobile ? "md" : "xl"} />
        <Flex direction="column" gap={isMobile ? 0 : 2}>
          <Heading size={isMobile ? "md" : "lg"}>{label}</Heading>
          {loadingMetadata ? <SkeletonText /> : <Text>{metadata?.about}</Text>}
        </Flex>
      </Flex>
      <Tabs
        display="flex"
        flexDirection="column"
        flexGrow="1"
        overflow="hidden"
        isManual
      >
        <TabList>
          <Tab>Posts</Tab>
          <Tab>Replies</Tab>
          <Tab>Following</Tab>
          <Tab>Relays</Tab>
        </TabList>

        <TabPanels overflow="auto" height="100%">
          <TabPanel pr={0} pl={0}>
            <UserPostsTab pubkey={pubkey} />
          </TabPanel>
          <TabPanel pr={0} pl={0}>
            <UserRepliesTab pubkey={pubkey} />
          </TabPanel>
          <TabPanel>
            <UserFollowingTab pubkey={pubkey} />
          </TabPanel>
          <TabPanel pr={0} pl={0}>
            <UserRelaysTab pubkey={pubkey} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
};
