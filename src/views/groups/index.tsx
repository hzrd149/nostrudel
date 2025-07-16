import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  SimpleGrid,
  Skeleton,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { encodeGroupPointer, getPublicGroups, GroupPointer, GROUPS_LIST_KIND } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import GroupCard from "../../components/groups/group-card";
import SimpleView from "../../components/layout/presets/simple-view";
import RouterLink from "../../components/router-link";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useUserContacts from "../../hooks/use-user-contacts";
import useUserGroupsList from "../../hooks/use-user-groups-list";

function useFriendsGroupsList() {
  const account = useActiveAccount();
  const contacts = useUserContacts(account?.pubkey);
  const readRelays = useReadRelays();

  const contactPubkeys = useMemo(() => {
    if (!contacts) return [];
    return contacts.map((contact) => contact.pubkey);
  }, [contacts]);

  const filters = useMemo(() => {
    if (contactPubkeys.length === 0) return undefined;
    return {
      kinds: [GROUPS_LIST_KIND],
      authors: contactPubkeys,
    };
  }, [contactPubkeys]);

  const { timeline: groupListEvents } = useTimelineLoader("friends-groups-lists", readRelays, filters);

  const groupsByPopularity = useMemo(() => {
    if (!groupListEvents) return [];

    // Extract all groups from all contacts' lists
    const groupCounts = new Map<string, { pointer: GroupPointer; users: string[] }>();

    for (const event of groupListEvents) {
      const groups = getPublicGroups(event);
      for (const group of groups) {
        const key = encodeGroupPointer(group);

        const existing = groupCounts.get(key);
        if (existing) existing.users.push(event.pubkey);
        else
          groupCounts.set(key, {
            pointer: group,
            users: [event.pubkey],
          });
      }
    }

    // Sort by most popular (most users)
    return Array.from(groupCounts.entries())
      .map(([key, data]) => ({
        key,
        pointer: data.pointer,
        users: data.users,
      }))
      .sort((a, b) => b.users.length - a.users.length);
  }, [groupListEvents]);

  return { groupsByPopularity, loading: !groupListEvents };
}

function YourGroups() {
  const { pointers: userGroups } = useUserGroupsList();

  const hasUserGroups = userGroups && userGroups.length > 0;

  return (
    <Box>
      <Heading size="lg" mb="4">
        Your Groups
      </Heading>
      {hasUserGroups ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
          {userGroups.map((group) => (
            <GroupCard key={`${group.id}:${group.relay}`} group={group} />
          ))}
        </SimpleGrid>
      ) : (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          py="8"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            No groups bookmarked
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            You haven't bookmarked any groups yet. Start by exploring groups to find ones that interest you.
          </AlertDescription>
          <Button as={RouterLink} to="explore" variant="link" p="2" mt="2">
            Explore Groups
          </Button>
        </Alert>
      )}
    </Box>
  );
}

function FriendsGroups() {
  const account = useActiveAccount();
  const { pointers: userGroups } = useUserGroupsList();
  const { groupsByPopularity: friendsGroups, loading: friendsLoading } = useFriendsGroupsList();
  const [showSingleUserGroups, setShowSingleUserGroups] = useState(false);

  // Filter friends groups based on the switch
  const filteredFriendsGroups =
    friendsGroups?.filter(
      (group) =>
        !userGroups.some((g) => encodeGroupPointer(g) === encodeGroupPointer(group.pointer)) &&
        (showSingleUserGroups ? true : group.users.length > 1),
    ) || [];

  const hasFriendsGroups = filteredFriendsGroups && filteredFriendsGroups.length > 0;

  return (
    <Box>
      <Flex align="center" justify="space-between" mb="4">
        <Heading size="lg">Your Friends Groups</Heading>
        {!account && (
          <Text fontSize="sm" color="gray.500">
            Sign in to see your friends' groups
          </Text>
        )}
      </Flex>

      {account && (
        <FormControl display="flex" alignItems="center" mb="4">
          <FormLabel htmlFor="single-user-groups" mb="0" fontSize="sm">
            Show groups with only one user
          </FormLabel>
          <Switch
            id="single-user-groups"
            size="sm"
            isChecked={showSingleUserGroups}
            onChange={(e) => setShowSingleUserGroups(e.target.checked)}
          />
        </FormControl>
      )}

      {!account ? (
        <Alert status="info" variant="subtle">
          <AlertIcon />
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription>Sign in to see groups that your friends have bookmarked.</AlertDescription>
        </Alert>
      ) : friendsLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="md" />
          ))}
        </SimpleGrid>
      ) : hasFriendsGroups ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
          {filteredFriendsGroups.map((item) => (
            <GroupCard key={item.key} group={item.pointer} users={item.users} />
          ))}
        </SimpleGrid>
      ) : (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          py="8"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            No friends groups found
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            None of your contacts have bookmarked any groups yet, or they haven't published their group lists.
          </AlertDescription>
        </Alert>
      )}
    </Box>
  );
}

export default function GroupsHomeView() {
  const account = useActiveAccount();

  if (!account) return <Navigate to="/login" />;

  return (
    <SimpleView title="Groups" maxW="8xl" center>
      <VStack spacing="8" align="stretch">
        {/* Your Groups Section */}
        <YourGroups />

        {/* Your Friends Groups Section */}
        <FriendsGroups />
      </VStack>
    </SimpleView>
  );
}
