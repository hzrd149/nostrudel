import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
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
  Image,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { UserPostsTab } from "./posts";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatar } from "../../components/user-avatar";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserRelaysTab } from "./relays";
import { UserFollowingTab } from "./following";
import { normalizeToHex } from "../../helpers/nip-19";
import { Page } from "../../components/page";
import { UserProfileMenu } from "./user-profile-menu";
import { UserFollowersTab } from "./followers";
import { useUserFollowers } from "../../hooks/use-user-followers";
import { UserRepliesTab } from "./replies";

export const UserPage = () => {
  const params = useParams();
  let id = normalizeToHex(params.pubkey ?? "");

  if (!id) {
    return (
      <Page>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Invalid pubkey</AlertTitle>
          <AlertDescription>"{params.pubkey}" dose not look like a valid pubkey</AlertDescription>
        </Alert>
      </Page>
    );
  }

  return (
    <Page>
      <UserView pubkey={id} />
    </Page>
  );
};

export type UserViewProps = {
  pubkey: string;
};

export const UserView = ({ pubkey }: UserViewProps) => {
  const isMobile = useIsMobile();

  const metadata = useUserMetadata(pubkey, [], true);
  const label = getUserDisplayName(metadata, pubkey);
  const followers = useUserFollowers(pubkey);

  return (
    <Flex direction="column" alignItems="stretch" gap="2" overflow="hidden" height="100%">
      {/* {metadata?.banner && <Image src={metadata.banner} />} */}
      <Flex gap="4" padding="2">
        <UserAvatar pubkey={pubkey} size={isMobile ? "md" : "xl"} />
        <Flex direction="column" gap={isMobile ? 0 : 2}>
          <Heading size={isMobile ? "md" : "lg"}>{label}</Heading>
          {!metadata ? <SkeletonText /> : <Text>{metadata?.about}</Text>}
        </Flex>
        <Box ml="auto">
          <UserProfileMenu pubkey={pubkey} />
        </Box>
      </Flex>
      <Tabs display="flex" flexDirection="column" flexGrow="1" overflow="hidden" isLazy>
        <TabList>
          <Tab>Posts</Tab>
          <Tab>Replies</Tab>
          <Tab>Followers ({followers?.length})</Tab>
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
            <UserFollowersTab pubkey={pubkey} />
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
